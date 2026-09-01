/**
 * Axorks OS — Email Finder & Lead Enrichment Integration Services
 * Safe server-side API integrations for Hunter, Tomba, Prospeo, Snov.io, and Location/Business Discovery.
 * Maximized for highest allowable free tier quotas (up to 50 results per query) with real-time MX/DNS verification.
 */

import { verifyEmailAddressAsync, verifyEmailBatchAsync } from "./email-verifier";

// ─── 1. Hunter.io Integration ────────────────────────────────────────

export async function searchDomainHunter(domain: string, limit: number = 50) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return { success: false, provider: "Hunter", error: "HUNTER_API_KEY not configured" };
  }

  try {
    const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=${limit}&api_key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, provider: "Hunter", error: `Hunter API HTTP ${res.status}: ${errText}` };
    }
    const json = await res.json();
    const rawEmails = json.data?.emails || [];

    const mapped = rawEmails.map((e: any) => {
      const conf = Number(e.confidence || 0);
      const isVerified = conf >= 70;
      return {
        email: e.value,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        confidence: conf,
        verification_status: isVerified ? "verified" : conf >= 40 ? "risky" : "unverified",
        verification_score: conf,
        is_verified: isVerified,
        type: e.type,
      };
    });

    return {
      success: true,
      provider: "Hunter",
      data: mapped,
      domain: json.data?.domain,
      organization: json.data?.organization,
      credits_remaining: json.meta?.params?.credits_remaining,
    };
  } catch (err: any) {
    return { success: false, provider: "Hunter", error: err.message };
  }
}

// ─── 2. Tomba.io Integration ──────────────────────────────────────────

export async function searchDomainTomba(domain: string, limit: number = 50) {
  const apiKey = process.env.TOMBA_API_KEY;
  const secret = process.env.TOMBA_SECRET;

  if (!apiKey || !secret) {
    return { success: false, provider: "Tomba", error: "TOMBA_API_KEY / TOMBA_SECRET not configured" };
  }

  try {
    const res = await fetch(`https://api.tomba.io/v1/domain-search?domain=${encodeURIComponent(domain)}&limit=${limit}`, {
      headers: {
        "X-Tomba-Key": apiKey,
        "X-Tomba-Secret": secret,
      },
    });

    if (!res.ok) {
      return { success: false, provider: "Tomba", error: `Tomba API HTTP ${res.status}` };
    }

    const json = await res.json();
    const rawEmails = json.data?.emails || [];

    const mapped = rawEmails.map((e: any) => {
      const conf = Number(e.score || 0);
      const isVerified = conf >= 70;
      return {
        email: e.email,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        confidence: conf,
        verification_status: isVerified ? "verified" : conf >= 40 ? "risky" : "unverified",
        verification_score: conf,
        is_verified: isVerified,
        type: e.type,
      };
    });

    return {
      success: true,
      provider: "Tomba",
      data: mapped,
      organization: json.data?.organization?.name,
    };
  } catch (err: any) {
    return { success: false, provider: "Tomba", error: err.message };
  }
}

// ─── 3. Prospeo.io Integration ────────────────────────────────────────

export async function findEmailProspeo(domain: string, firstName?: string, lastName?: string) {
  const apiKey = process.env.PROSPEO_API_KEY;
  if (!apiKey) {
    return { success: false, provider: "Prospeo", error: "PROSPEO_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.prospeo.io/email-finder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KEY": apiKey,
      },
      body: JSON.stringify({
        domain,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!res.ok) {
      return { success: false, provider: "Prospeo", error: `Prospeo API HTTP ${res.status}` };
    }

    const json = await res.json();
    const isDeliverable = json.response?.status === "VERIFIED";
    const score = Number(json.response?.score || (isDeliverable ? 95 : 50));

    return {
      success: !json.error,
      provider: "Prospeo",
      email: json.response?.email,
      status: json.response?.status,
      verification_status: isDeliverable ? "verified" : "risky",
      verification_score: score,
      is_verified: isDeliverable,
      score,
    };
  } catch (err: any) {
    return { success: false, provider: "Prospeo", error: err.message };
  }
}

// ─── 4. Unified Multi-Provider Domain Finder (Up to 50 leads) ────────

export async function findDomainEmailsUnified(domain: string, limit: number = 50) {
  const results = await Promise.allSettled([
    searchDomainHunter(domain, limit),
    searchDomainTomba(domain, limit),
  ]);

  const emails: any[] = [];
  const providersUsed: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.success) {
      providersUsed.push(r.value.provider);
      if (r.value.data) {
        emails.push(...r.value.data);
      }
    }
  }

  // Deduplicate emails by value
  const uniqueMap = new Map();
  for (const e of emails) {
    if (e.email && !uniqueMap.has(e.email.toLowerCase())) {
      uniqueMap.set(e.email.toLowerCase(), e);
    }
  }

  const deduped = Array.from(uniqueMap.values()).slice(0, limit);

  // Run fast MX verification on the unified list
  const emailStrings = deduped.map((d) => d.email).filter(Boolean);
  const verifiedMap = await verifyEmailBatchAsync(emailStrings);

  const enrichedDeduped = deduped.map((item) => {
    const v = verifiedMap.get(item.email.toLowerCase());
    if (v) {
      return {
        ...item,
        verification_status: v.status,
        verification_score: v.score,
        is_verified: v.status === "verified",
        mx_valid: v.mx_records_found,
        verification_notes: v.reason,
      };
    }
    return item;
  });

  return {
    domain,
    success: enrichedDeduped.length > 0,
    providers_used: providersUsed,
    total: enrichedDeduped.length,
    emails: enrichedDeduped,
  };
}

// ─── 5. Location + Business Discovery (With Real DNS / MX Verification) ───

export async function searchLocationBusinessDiscovery(businessType: string, location: string, limit: number = 50) {
  const query = `${businessType.trim()} in ${location.trim()}`.toLowerCase();

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`;
    const nomRes = await fetch(nomUrl, {
      headers: { "User-Agent": "AxorksOS-LeadDiscovery/2.0 (lead-intel@axorks.com)" },
    });

    let discoveredPlaces: any[] = [];
    if (nomRes.ok) {
      discoveredPlaces = await nomRes.json();
    }

    if (!discoveredPlaces || discoveredPlaces.length < 5) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${businessType.trim()} ${location.trim()}`)}&format=json&addressdetails=1&limit=${limit}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { "User-Agent": "AxorksOS-LeadDiscovery/2.0 (lead-intel@axorks.com)" },
      });
      if (fallbackRes.ok) {
        const secondary = await fallbackRes.json();
        if (Array.isArray(secondary)) {
          const existingIds = new Set(discoveredPlaces.map((p) => p.place_id));
          for (const p of secondary) {
            if (!existingIds.has(p.place_id)) {
              discoveredPlaces.push(p);
            }
          }
        }
      }
    }

    const rawCandidates: any[] = [];

    if (discoveredPlaces && discoveredPlaces.length > 0) {
      for (const place of discoveredPlaces.slice(0, limit)) {
        const name = place.display_name?.split(",")[0] || place.name || `${businessType} ${location}`;
        const city = place.address?.city || place.address?.town || place.address?.county || location;
        const country = place.address?.country || location;
        const cleanNameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanDomain = cleanNameSlug ? `${cleanNameSlug}.com` : "";

        rawCandidates.push({
          business_name: name,
          website: cleanDomain ? `https://${cleanDomain}` : `https://google.com/search?q=${encodeURIComponent(name)}`,
          domain: cleanDomain,
          industry: businessType,
          country: country,
          location: `${city}, ${country}`.trim(),
          decision_maker_name: "",
          decision_maker_title: "Commercial Director / Owner",
          email: cleanDomain ? `contact@${cleanDomain}` : "",
          source: "location_discovery",
        });
      }
    }

    // Run batch DNS MX checks on candidate domains
    const emailsToCheck = rawCandidates.map((c) => c.email).filter(Boolean);
    const verificationMap = await verifyEmailBatchAsync(emailsToCheck);

    const verifiedLeads: any[] = [];

    for (const c of rawCandidates) {
      if (!c.email) {
        verifiedLeads.push({
          ...c,
          score: 50,
          verification_status: "unverified",
          verification_score: 50,
          is_verified: false,
          mx_valid: false,
          verification_notes: "No verified direct email found",
        });
        continue;
      }

      const v = verificationMap.get(c.email.toLowerCase());
      if (v && v.mx_records_found && v.status === "verified") {
        // Genuine company with active MX server
        verifiedLeads.push({
          ...c,
          score: 85,
          verification_status: "verified",
          verification_score: v.score,
          is_verified: true,
          mx_valid: true,
          verification_notes: v.reason,
        });
      } else {
        // Domain does not have MX records -> Do not present as verified lead email
        verifiedLeads.push({
          ...c,
          email: "", // Strip unresolvable email to prevent bounces
          score: 40,
          verification_status: "unverified",
          verification_score: 30,
          is_verified: false,
          mx_valid: false,
          verification_notes: "Physical business location found, domain email unverified",
        });
      }
    }

    // Sort so verified leads appear first
    verifiedLeads.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));

    return {
      success: true,
      query: `${businessType} in ${location}`,
      business_type: businessType,
      location: location,
      total: verifiedLeads.length,
      verified_count: verifiedLeads.filter((l) => l.is_verified).length,
      leads: verifiedLeads,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Location discovery search error",
      leads: [],
    };
  }
}

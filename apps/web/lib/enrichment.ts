/**
 * Axorks OS — Email Finder & Lead Enrichment Integration Services
 * Safe server-side API integrations for Hunter, Tomba, Prospeo, and Snov.io.
 */

// ─── 1. Hunter.io Integration ────────────────────────────────────────

export async function searchDomainHunter(domain: string, limit: number = 10) {
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
    return {
      success: true,
      provider: "Hunter",
      data: json.data?.emails?.map((e: any) => ({
        email: e.value,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        confidence: e.confidence,
        type: e.type,
      })) || [],
      domain: json.data?.domain,
      organization: json.data?.organization,
      credits_remaining: json.meta?.params?.credits_remaining,
    };
  } catch (err: any) {
    return { success: false, provider: "Hunter", error: err.message };
  }
}

// ─── 2. Tomba.io Integration ──────────────────────────────────────────

export async function searchDomainTomba(domain: string, limit: number = 10) {
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
    return {
      success: true,
      provider: "Tomba",
      data: json.data?.emails?.map((e: any) => ({
        email: e.email,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        confidence: e.score,
        type: e.type,
      })) || [],
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
    return {
      success: !json.error,
      provider: "Prospeo",
      email: json.response?.email,
      status: json.response?.status,
      score: json.response?.score,
    };
  } catch (err: any) {
    return { success: false, provider: "Prospeo", error: err.message };
  }
}

// ─── Unified Multi-Provider Finder ───────────────────────────────────

export async function findDomainEmailsUnified(domain: string) {
  const results = await Promise.allSettled([
    searchDomainHunter(domain),
    searchDomainTomba(domain),
  ]);

  const emails: any[] = [];
  const providersUsed: string[] = [];
  let totalFound = 0;

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

  const deduped = Array.from(uniqueMap.values());
  return {
    domain,
    success: deduped.length > 0,
    providers_used: providersUsed,
    total: deduped.length,
    emails: deduped,
  };
}

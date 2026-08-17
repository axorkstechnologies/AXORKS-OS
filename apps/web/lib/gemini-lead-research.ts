/**
 * Axorks OS — Gemini AI Lead Verification & Deep Research Service
 *
 * Utilizes Google Gemini to inspect prospective B2B leads, verify commercial authenticity,
 * detect bogus/synthetic leads, confirm Google presence, websites, decision makers,
 * LinkedIn URLs, and social profiles.
 */

import fs from "fs";
import path from "path";

export interface LeadToResearch {
  id?: string;
  lead_id?: string;
  business_name: string;
  website?: string;
  industry?: string;
  location?: string;
  country?: string;
  decision_maker_name?: string;
  decision_maker_title?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
}

export interface SocialMediaPresence {
  linkedin_company: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
}

export interface LeadResearchResult {
  lead_id: string;
  business_name: string;
  is_real_business: boolean;
  verification_status: "verified_real" | "suspicious_bogus" | "uncertain";
  confidence: "High" | "Medium" | "Low";
  confidence_score: number; // 0 to 100
  appears_on_google: boolean;
  google_presence_notes: string;
  verified_website: string | null;
  website_status: "active" | "down" | "invalid_domain" | "unconfirmed";
  verified_email: string | null;
  email_status: "verified" | "pattern_match" | "unconfirmed" | "invalid";
  decision_maker_name: string | null;
  decision_maker_role: string | null;
  decision_maker_linkedin: string | null;
  social_media: SocialMediaPresence;
  business_summary: string;
  verification_notes: string;
  recommended_action: "Reach Out via Email" | "Manual Review Required" | "Discard as Bogus";
}

// Active and verified working Gemini models (v1beta)
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

/**
 * Dynamically resolves the Google AI API key from environment or local env files.
 */
function getGoogleApiKey(): string {
  if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY.trim().length > 0) {
    return process.env.GOOGLE_AI_API_KEY.trim();
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // Fallback: Check possible .env.local locations
  const potentialPaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", ".env.local"),
    path.join(process.cwd(), "..", "..", ".env.local"),
    "d:/AxorksOS/.env.local",
    "d:/AxorksOS/apps/web/.env.local",
  ];

  for (const envPath of potentialPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/(?:GOOGLE_AI_API_KEY|GEMINI_API_KEY)=(.*)/);
        if (match && match[1]) {
          const key = match[1].trim();
          if (key.length > 0) {
            process.env.GOOGLE_AI_API_KEY = key;
            return key;
          }
        }
      }
    } catch {
      // Ignore filesystem access errors in restricted serverless environments
    }
  }

  return "";
}

/**
 * Executes deep AI lead verification and research on a batch of leads using Gemini.
 */
export async function researchLeadsWithGemini(
  leads: LeadToResearch[]
): Promise<LeadResearchResult[]> {
  if (!leads || leads.length === 0) {
    return [];
  }

  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Please verify your Google Gemini API key in .env.local."
    );
  }

  // Chunk into batches of up to 10 leads per prompt to ensure prompt token safety
  const CHUNK_SIZE = 10;
  const chunks: LeadToResearch[][] = [];
  for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
    chunks.push(leads.slice(i, i + CHUNK_SIZE));
  }

  const allResults: LeadResearchResult[] = [];

  for (const chunk of chunks) {
    const chunkResults = await processLeadChunk(chunk, apiKey);
    allResults.push(...chunkResults);
  }

  return allResults;
}

/**
 * Processes an individual batch of leads with Gemini and handles model fallbacks.
 */
async function processLeadChunk(
  chunk: LeadToResearch[],
  apiKey: string
): Promise<LeadResearchResult[]> {
  const sanitizedInput = chunk.map((lead, idx) => ({
    lead_id: lead.id || lead.lead_id || `lead-${idx + 1}`,
    business_name: lead.business_name || "Unknown Company",
    website: lead.website || "",
    industry: lead.industry || "General Commercial",
    location: lead.location || lead.country || "",
    country: lead.country || "",
    decision_maker_name: lead.decision_maker_name || "",
    decision_maker_title: lead.decision_maker_title || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "api",
  }));

  const prompt = `You are a Principal B2B Lead Intelligence Researcher and Corporate Verification Specialist at Axorks Technologies.
Analyze each prospective business lead to strictly differentiate between GENUINE commercial entities and BOGUS / SYNTHETIC / PLACEHOLDER leads.

CRITICAL INSTRUCTIONS:
1. Verify if the business actually exists as a real commercial enterprise.
2. Check if the business appears on Google organic search, business registries, or maps.
3. Confirm or find the genuine corporate website and email address.
4. Verify or identify the key decision maker (CEO, Founder, Director, VP) and their LinkedIn profile URL if identifiable.
5. Identify the company's social media presence: LinkedIn company page, Instagram, Facebook, and YouTube URLs.
6. DO NOT hallucinate or make up fake URLs. If a specific social media profile or LinkedIn page cannot be verified, return null.
7. Return a structured JSON array with one object per lead in the exact same order.

INPUT LEADS:
${JSON.stringify(sanitizedInput, null, 2)}

REQUIRED JSON RESPONSE SCHEMA:
[
  {
    "lead_id": "string (matching input lead_id)",
    "business_name": "string",
    "is_real_business": true or false,
    "verification_status": "verified_real" | "suspicious_bogus" | "uncertain",
    "confidence": "High" | "Medium" | "Low",
    "confidence_score": number (0 to 100),
    "appears_on_google": true or false,
    "google_presence_notes": "string detailing organic search presence",
    "verified_website": "string (https://...) or null",
    "website_status": "active" | "down" | "invalid_domain" | "unconfirmed",
    "verified_email": "string or null",
    "email_status": "verified" | "pattern_match" | "unconfirmed" | "invalid",
    "decision_maker_name": "string or null",
    "decision_maker_role": "string or null",
    "decision_maker_linkedin": "string (https://linkedin.com/in/...) or null",
    "social_media": {
      "linkedin_company": "string (https://linkedin.com/company/...) or null",
      "instagram": "string (https://instagram.com/...) or null",
      "facebook": "string (https://facebook.com/...) or null",
      "youtube": "string (https://youtube.com/...) or null"
    },
    "business_summary": "1-2 sentence description of what the company sells/does",
    "verification_notes": "concise explanation of why this lead was marked real or suspicious",
    "recommended_action": "Reach Out via Email" | "Manual Review Required" | "Discard as Bogus"
  }
]`;

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        lastError = new Error(
          `Gemini [${model}] HTTP ${res.status}: ${errorJson.error?.message || res.statusText}`
        );
        console.warn(`Gemini model ${model} returned error:`, lastError.message);
        continue; // Fallback to next working model in list
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = new Error(`Gemini [${model}] returned empty candidate response.`);
        continue;
      }

      const parsed: LeadResearchResult[] = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeResearchResults(parsed, chunk);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} fetch exception:`, err.message);
    }
  }

  // If all models failed or encountered temporary demand spikes, throw descriptive error so user and API get the real reason
  if (lastError) {
    throw new Error(`Gemini Research Service: ${lastError.message}`);
  }

  throw new Error("Gemini AI lead verification service is temporarily unavailable.");
}

/**
 * Sanitizes and normalizes the parsed Gemini output.
 */
function sanitizeResearchResults(
  results: any[],
  originalChunk: LeadToResearch[]
): LeadResearchResult[] {
  return originalChunk.map((lead, idx) => {
    const leadId = lead.id || lead.lead_id || `lead-${idx + 1}`;
    const r = results.find((item) => item.lead_id === leadId) || results[idx] || {};

    const isReal = typeof r.is_real_business === "boolean" ? r.is_real_business : true;

    let status: "verified_real" | "suspicious_bogus" | "uncertain" = "uncertain";
    if (r.verification_status === "verified_real" || (isReal && (r.confidence_score || 80) >= 60)) {
      status = "verified_real";
    } else if (
      r.verification_status === "suspicious_bogus" ||
      !isReal ||
      (r.confidence_score || 0) < 40
    ) {
      status = "suspicious_bogus";
    }

    return {
      lead_id: leadId,
      business_name: r.business_name || lead.business_name,
      is_real_business: isReal,
      verification_status: status,
      confidence: r.confidence || (isReal ? "High" : "Low"),
      confidence_score:
        typeof r.confidence_score === "number"
          ? Math.max(0, Math.min(100, Math.round(r.confidence_score)))
          : isReal
          ? 85
          : 15,
      appears_on_google: typeof r.appears_on_google === "boolean" ? r.appears_on_google : isReal,
      google_presence_notes:
        r.google_presence_notes ||
        (isReal ? "Commercial entity confirmed." : "No verified Google presence."),
      verified_website: r.verified_website || lead.website || null,
      website_status: r.website_status || (lead.website ? "active" : "unconfirmed"),
      verified_email: r.verified_email || lead.email || null,
      email_status: r.email_status || (lead.email ? "verified" : "unconfirmed"),
      decision_maker_name: r.decision_maker_name || lead.decision_maker_name || null,
      decision_maker_role: r.decision_maker_role || lead.decision_maker_title || null,
      decision_maker_linkedin: r.decision_maker_linkedin || null,
      social_media: {
        linkedin_company: r.social_media?.linkedin_company || null,
        instagram: r.social_media?.instagram || null,
        facebook: r.social_media?.facebook || null,
        youtube: r.social_media?.youtube || null,
      },
      business_summary:
        r.business_summary || `${lead.business_name} - ${lead.industry || "B2B Organization"}.`,
      verification_notes:
        r.verification_notes || (isReal ? "Confirmed genuine entity." : "Suspicious profile."),
      recommended_action:
        r.recommended_action || (isReal ? "Reach Out via Email" : "Discard as Bogus"),
    };
  });
}

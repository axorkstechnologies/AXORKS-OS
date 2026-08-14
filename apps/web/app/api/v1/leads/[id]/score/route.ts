import { NextRequest, NextResponse } from "next/server";
import { LEADS_STORE } from "@/lib/leads-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Global in-memory score history store
const globalScoreStore = globalThis as unknown as {
  __axorks_score_history?: Record<string, Array<{
    id: string;
    lead_id: string;
    new_score: number;
    reason: string;
    scored_by: string;
    created_at: string;
  }>>;
};

if (!globalScoreStore.__axorks_score_history) {
  globalScoreStore.__axorks_score_history = {};
}

const scoreHistoryStore = globalScoreStore.__axorks_score_history;

/**
 * AI Lead Scoring using Google Gemini 1.5 Flash API
 */
async function scoreLeadWithGemini(lead: any): Promise<{ score: number; reason: string }> {
  if (!GOOGLE_AI_API_KEY) {
    return calculateFallbackScore(lead);
  }

  try {
    const prompt = `Analyze this business lead for a software development & AI agency and evaluate its qualification score from 1 to 100.
Company: ${lead.business_name || "Unknown"}
Industry: ${lead.industry || "Unknown"}
Company Size: ${lead.company_size || "Unknown"}
Decision Maker Title: ${lead.decision_maker_title || "Unknown"}
Country: ${lead.country || "Unknown"}
Notes: ${lead.notes || "None"}

Return strictly valid JSON with no markdown formatting or extra text:
{"score": number, "reason": "1-2 sentence explanation of why this lead received this score"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (typeof parsed.score === "number" && parsed.reason) {
          return {
            score: Math.min(100, Math.max(1, Math.round(parsed.score))),
            reason: parsed.reason,
          };
        }
      }
    }
  } catch {
    // Fallback if Gemini request times out or fails
  }

  return calculateFallbackScore(lead);
}

function calculateFallbackScore(lead: any): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];

  if (lead.email) {
    score += 15;
    reasons.push("Direct email provided");
  }
  if (lead.phone) {
    score += 10;
    reasons.push("Direct phone contact available");
  }
  if (lead.decision_maker_title && /c[eo]|cto|vp|director|founder|head/i.test(lead.decision_maker_title)) {
    score += 15;
    reasons.push("High-level decision maker title");
  }
  if (lead.website) {
    score += 10;
    reasons.push("Active web presence");
  }

  const finalScore = Math.min(98, Math.max(30, score));
  return {
    score: finalScore,
    reason: `Evaluated based on contact completeness and decision maker authority (${reasons.join(", ") || "Standard lead"}).`,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Attempt FastAPI backend first if available
    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/leads/${id}/score`, {
        method: "POST",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // FastAPI backend unreachable, use Gemini in Next.js route
    }

    // 2. Next.js Route with Gemini AI integration
    const lead = LEADS_STORE.find((l) => l.id === id) || LEADS_STORE[0];

    const { score, reason } = await scoreLeadWithGemini(lead);

    // Update lead in store
    lead.score = score;
    lead.updated_at = new Date().toISOString();

    // Log in score history
    if (!scoreHistoryStore[lead.id]) {
      scoreHistoryStore[lead.id] = [];
    }

    const historyItem = {
      id: `score_${Date.now()}`,
      lead_id: lead.id,
      new_score: score,
      reason,
      scored_by: GOOGLE_AI_API_KEY ? "Gemini 1.5 Flash" : "AXORKS AI Engine",
      created_at: new Date().toISOString(),
    };

    scoreHistoryStore[lead.id].unshift(historyItem);

    return NextResponse.json({
      data: {
        lead,
        history: historyItem,
      },
      lead, // for compatibility
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to score lead" }] },
      { status: 500 }
    );
  }
}

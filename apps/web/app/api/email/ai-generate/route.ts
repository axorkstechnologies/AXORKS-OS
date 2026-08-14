import { NextRequest, NextResponse } from "next/server";
import { AIGenerateEmailSchema } from "@/lib/validators/email";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AIGenerateEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { company, industry, decisionMaker, painPoints, interestedService, country, previousCommunication } = validation.data;

    // If GOOGLE_AI_API_KEY is configured, use Gemini 1.5 Flash to generate custom email
    if (GOOGLE_AI_API_KEY) {
      try {
        const prompt = `You are a principal software solution architect at Axorks. Write a professional, highly personalized cold outreach email to a prospect with the following details:
- Target Company: ${company}
- Industry: ${industry}
- Contact Person: ${decisionMaker || "Engineering Leader"}
- Country: ${country || "Global"}
- Service Interested In: ${interestedService}
- Pain Points to Address: ${painPoints || "scalability, technical debt, and modern architecture"}
- Previous Context: ${previousCommunication || "None"}

Return strictly valid JSON with no markdown formatting:
{
  "subject": "Compelling subject line",
  "html": "<p>Professional HTML email body formatted with <p>, <strong>, <ul>, <li> tags</p>"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.subject && parsed.html) {
              return NextResponse.json({
                success: true,
                subject: parsed.subject,
                html: parsed.html,
                provider: "Gemini 1.5 Flash",
              });
            }
          }
        }
      } catch {
        // Fallback to template if Gemini API call fails
      }
    }

    // Fallback template generator when Gemini key is missing or fails
    const recipientName = decisionMaker || "Team";
    const painText = painPoints ? `addressing challenges like ${painPoints}` : "building scalable cloud solutions";
    const countryText = country ? ` in ${country}` : "";

    const generatedSubject = `Personalized Technology Partnership for ${company}: ${interestedService}`;

    const generatedHtml = `<p>Hi ${recipientName},</p>

<p>I hope this email finds you well. I've been following <strong>${company}</strong>'s work in the ${industry} space${countryText} and wanted to reach out directly.</p>

<p>At <strong>Axorks</strong>, we specialize in high-impact engineering solutions, specifically focusing on <strong>${interestedService}</strong>. We routinely partner with ambitious growth companies to solve technical bottlenecks, particularly around ${painText}.</p>

${previousCommunication ? `<p><em>Reflecting on our prior discussions (${previousCommunication}), we have updated our deployment frameworks to offer even faster turnaround times.</em></p>` : ""}

<p>Here is what a collaboration with Axorks delivers:</p>
<ul>
  <li>Dedicated Staffing & Enterprise-grade Code Quality</li>
  <li>Rapid 2-Week Prototyping & CI/CD Pipelines</li>
  <li>Full Security Compliance & Modern Next.js / Cloud Architecture</li>
</ul>

<p>Would you be open to a 15-minute discovery call next week to explore how we can support ${company}'s current software roadmap?</p>

<p>Best regards,<br/>
<strong>Engineering Leadership | Axorks</strong><br/>
<a href="mailto:hello@axorks.com">hello@axorks.com</a></p>`;

    return NextResponse.json({
      success: true,
      subject: generatedSubject,
      html: generatedHtml,
      provider: "Axorks Template Engine",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI email" },
      { status: 500 }
    );
  }
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: "sales" | "projects" | "finance" | "support" | "general";
  subject: string;
  description: string;
  html: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold-outreach",
    name: "Cold Outreach (High Impact)",
    category: "sales",
    subject: "Quick question regarding {{company}}'s engineering speed",
    description: "Punchy, 5-second pitch highlighting Axorks development velocity and cloud capabilities.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">I'll keep this short: <strong>Axorks Technologies</strong> builds and scales mission-critical web, mobile, and AI software for fast-growing companies like {{company}} — in half the typical agency timeline.</p>
<div style="background:#f8fafc;border-left:4px solid #7c3aed;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 6px 0;font-size:13px;font-weight:bold;color:#0f172a;">Why leaders choose Axorks:</p>
  <ul style="margin:0;padding-left:18px;font-size:13px;color:#334155;line-height:1.6;">
    <li><strong>Full-Stack Speed:</strong> Production-grade Next.js, Cloud APIs & Mobile apps built with zero tech debt</li>
    <li><strong>Enterprise AI:</strong> Custom automated agentic workflows and LLM pipelines</li>
    <li><strong>Dedicated Pods:</strong> Senior engineers aligned to your timezone with daily sprint releases</li>
  </ul>
</div>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">Are you free for a 10-minute intro call this Thursday at 2 PM?</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Book 10-Min Discovery Call →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Solutions Team</strong><br/><a href="mailto:hello@axorks.com" style="color:#7c3aed;text-decoration:none;">hello@axorks.com</a> • <a href="https://axorks.com" style="color:#7c3aed;text-decoration:none;">axorks.com</a></p>`
  },
  {
    id: "proposal",
    name: "Project Proposal (Value First)",
    category: "sales",
    subject: "Technical Proposal & Roadmap for {{company}} — Axorks",
    description: "Action-oriented proposal handover with clear milestone deliverables.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Following our architecture review, here is the official <strong>Scope of Work & Technical Roadmap</strong> for {{company}}.</p>
<div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 6px 0;font-size:13px;font-weight:bold;color:#0f172a;">Key Deliverables Summary:</p>
  <ul style="margin:0;padding-left:18px;font-size:13px;color:#334155;line-height:1.6;">
    <li><strong>Phase 1:</strong> Architecture Design, Core Backend APIs & Database Schema</li>
    <li><strong>Phase 2:</strong> High-Performance Frontend & Role-Based Permissions</li>
    <li><strong>Phase 3:</strong> Automated Testing, Security Audit & Cloud Production Deploy</li>
  </ul>
</div>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">The full proposal document is attached. Let's schedule a 15-minute walkthrough to finalize the timeline.</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#2563eb;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Review & Approve Proposal →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Warm regards,<br/><strong style="color:#0f172a;">Lead Solutions Architect</strong><br/>Axorks Technologies</p>`
  },
  {
    id: "quotation",
    name: "Quotation & Pricing",
    category: "sales",
    subject: "Official Quotation #QT-{{quote_number}} for {{company}}",
    description: "Transparent, milestone-based pricing estimate.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Please find attached the official itemized quote <strong>#QT-{{quote_number}}</strong> for your project.</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;margin:16px 0;border-radius:8px;">
  <p style="margin:0;font-size:13px;font-weight:bold;color:#065f46;">All-Inclusive Scope Guarantee:</p>
  <p style="margin:4px 0 0 0;font-size:12px;color:#047857;">Includes end-to-end design, QA testing, DevOps configuration, source code handover, and 30 days of post-launch warranty support.</p>
</div>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">This estimate is locked for 30 days. Ready to proceed?</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#059669;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Accept Quote & Start Sprint →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Commercial Accounts</strong></p>`
  },
  {
    id: "meeting-request",
    name: "Meeting Request (15-Min)",
    category: "sales",
    subject: "15-min chat: {{company}} x Axorks engineering",
    description: "Low-friction call invitation with direct calendar link.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Would you be open to a quick 15-minute conversation to explore how Axorks can accelerate {{company}}'s software goals?</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">Pick any time directly on our live calendar that fits your schedule:</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Select 15-Minute Slot on Calendar →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Looking forward to speaking with you,<br/><strong style="color:#0f172a;">Axorks Growth & Engineering Team</strong></p>`
  },
  {
    id: "follow-up",
    name: "Quick Follow-Up (High Reply)",
    category: "sales",
    subject: "Checking in on {{company}}'s software roadmap",
    description: "Ultra-short 2-sentence polite follow-up with maximum response rate.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Following up on my previous note. I know you're busy running things at {{company}} — is accelerating your engineering pipeline still a priority this quarter?</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">If so, happy to share a 2-minute breakdown of how we delivered a similar architecture for another tech team.</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Let's Connect Briefly →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Solutions</strong></p>`
  },
  {
    id: "project-kickoff",
    name: "Project Kickoff & Onboarding",
    category: "projects",
    subject: "🚀 Sprint Kickoff: Welcome to Axorks OS — {{project_name}}",
    description: "Energetic onboarding notice with Client Portal access.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Welcome {{company}} Team,</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">We're officially kicking off <strong>{{project_name}}</strong>! Your dedicated engineering squad has provisioned your Client Portal workspace.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;margin:16px 0;border-radius:8px;">
  <p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#0f172a;">What happens next:</p>
  <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">
    <li><strong>Live Sprint Tracking:</strong> Monitor real-time task completion and milestone burndowns</li>
    <li><strong>Weekly Video Sync:</strong> Next demo scheduled for {{kickoff_date}}</li>
    <li><strong>Direct Slack/Team Channel:</strong> Instant comms with your lead engineer</li>
  </ul>
</div>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Access Your Project Workspace →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Let's build something exceptional,<br/><strong style="color:#0f172a;">Axorks Project Office</strong></p>`
  },
  {
    id: "project-delivery",
    name: "Milestone Handover & Review",
    category: "projects",
    subject: "🎉 Milestone Ready: {{project_name}} — Review & Demo",
    description: "Showcase deployed milestone build with staging credentials.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Milestone <strong>{{milestone_title}}</strong> for <strong>{{project_name}}</strong> is live on your staging environment and ready for your review.</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">All automated tests and security checks have passed with 100% compliance.</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#2563eb;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Open Staging Demo & Changelog →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Engineering Pod</strong></p>`
  },
  {
    id: "invoice",
    name: "Invoice & Billing Notice",
    category: "finance",
    subject: "Invoice #INV-{{invoice_number}} from Axorks Inc. (Due {{due_date}})",
    description: "Clear billing notice with 1-click online payment.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Please find attached Invoice <strong>#INV-{{invoice_number}}</strong> for services on <strong>{{project_name}}</strong>.</p>
<div style="background:#f1f5f9;padding:12px 16px;margin:16px 0;border-radius:8px;font-family:sans-serif;">
  <p style="margin:0;font-size:13px;color:#475569;">Amount Due: <strong style="font-size:16px;color:#0f172a;">{{amount_due}}</strong></p>
  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Due Date: <strong>{{due_date}}</strong></p>
</div>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#059669;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Pay Invoice Online →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Thank you for your business,<br/><strong style="color:#0f172a;">Axorks Billing & Accounts</strong></p>`
  },
  {
    id: "maintenance-reminder",
    name: "System Maintenance Notice",
    category: "support",
    subject: "Scheduled Upgrade: {{system_name}} on {{maintenance_date}}",
    description: "Proactive maintenance window notice.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Dear {{company}} Team,</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">We are deploying performance and security optimizations on <strong>{{system_name}}</strong> on <strong>{{maintenance_date}}</strong> ({{start_time}} - {{end_time}}).</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">Zero or minimal service disruption is expected. You can track live status below:</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#475569;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">View Live Infrastructure Status →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Site Reliability Engineering (SRE)</strong></p>`
  },
  {
    id: "thank-you",
    name: "Client Partnership & Appreciation",
    category: "general",
    subject: "Thank you for partnering with Axorks",
    description: "Appreciation message cementing long-term client loyalty.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Dear {{decision_maker}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Thank you for trusting Axorks Technologies as your software partner for <strong>{{project_name}}</strong>.</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">It has been an absolute pleasure collaborating with your team. We are dedicated to supporting your continuous growth.</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Explore Continued Advisory →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Warmest regards,<br/><strong style="color:#0f172a;">Leadership Team</strong><br/>Axorks Technologies</p>`
  },
  {
    id: "general-inquiry",
    name: "General Inquiry (Fast Response)",
    category: "general",
    subject: "Received: Your inquiry to Axorks Technologies",
    description: "Fast acknowledgment with immediate callback offer.",
    html: `<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Hi {{contact_name}},</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:12px;">Thanks for reaching out to Axorks Technologies regarding <em>"{{inquiry_topic}}"</em>.</p>
<p style="font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:16px;">A dedicated technical lead has been assigned to your request and will follow up within 4 business hours.</p>
<p style="margin-top:16px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Visit Axorks Knowledge Base →</a></p>
<p style="margin-top:20px;font-size:13px;color:#64748b;">Best,<br/><strong style="color:#0f172a;">Axorks Client Relations</strong></p>`
  }
];

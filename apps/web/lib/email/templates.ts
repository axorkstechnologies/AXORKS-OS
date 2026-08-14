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
    name: "Cold Outreach",
    category: "sales",
    subject: "Scaling {{company}}'s engineering roadmap with Axorks",
    description: "Personalized cold outreach template for target decision makers.",
    html: `<p>Hi {{decision_maker}},</p>
<p>I hope this email finds you well. I've been following {{company}}'s momentum in the {{industry}} sector and was really impressed by your team's recent developments.</p>
<p>At <strong>Axorks Technologies</strong>, we partner with growth-focused tech organizations to build, optimize, and scale high-performance web, mobile, and cloud applications.</p>
<p>Our core capabilities include:</p>
<ul style="line-height: 1.6;">
  <li><strong>Custom Cloud & SaaS Engineering:</strong> Scalable microservices & modern frontend architectures</li>
  <li><strong>AI Integration & Automation:</strong> Enterprise AI workflows & agentic integration</li>
  <li><strong>Infrastructure Optimization:</strong> High-availability DevOps, security, and performance tuning</li>
</ul>
<p>Would you be open to a quick 15-minute discovery call next week to explore potential technical alignment?</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Schedule Intro Call</a></p>
<p style="margin-top:20px;">Best regards,<br/><strong>The Axorks Engineering Team</strong><br/><a href="mailto:hello@axorks.com">hello@axorks.com</a></p>`
  },
  {
    id: "proposal",
    name: "Proposal",
    category: "sales",
    subject: "Project Proposal & Scope of Work for {{company}}",
    description: "Formal proposal presentation email with attached proposal document.",
    html: `<p>Dear {{decision_maker}},</p>
<p>Thank you for taking the time to discuss {{company}}'s upcoming software initiative with our architecture team.</p>
<p>We have synthesized your requirements into a detailed <strong>Project Proposal & Technical Scope of Work</strong> document, attached to this email for your review.</p>
<p><strong>Proposal Executive Summary:</strong></p>
<ul style="line-height: 1.6;">
  <li><strong>Target Architecture:</strong> Resilient Cloud-native stack designed for high throughput</li>
  <li><strong>Milestone Roadmap:</strong> Phased sprint timeline with weekly deliverable reviews</li>
  <li><strong>SLA & Deliverables:</strong> Turnkey delivery including QA, docs, and deployment setup</li>
</ul>
<p>Please let us know if you would like to schedule a walk-through session with our lead architect to discuss the proposal details.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Review & Approve Proposal</a></p>
<p style="margin-top:20px;">Warm regards,<br/><strong>Axorks Solutions Team</strong><br/>hello@axorks.com</p>`
  },
  {
    id: "quotation",
    name: "Quotation",
    category: "sales",
    subject: "Official Quotation #QT-{{quote_number}} for {{company}}",
    description: "Itemized cost estimate and pricing quotation delivery.",
    html: `<p>Hi {{decision_maker}},</p>
<p>Following our discovery session, please find attached official quotation <strong>#QT-{{quote_number}}</strong> for your project.</p>
<p>This quotation is valid for 30 days and encompasses complete end-to-end development, automated testing, security audit, and deployment.</p>
<p>If you have any questions regarding specific line items or milestone billing, feel free to reply directly to this email.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#059669;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Itemized Quotation</a></p>
<p style="margin-top:20px;">Best regards,<br/><strong>Axorks Finance & Accounts</strong><br/>hello@axorks.com</p>`
  },
  {
    id: "meeting-request",
    name: "Meeting Request",
    category: "sales",
    subject: "Meeting Invitation: Axorks & {{company}} Technical Alignment",
    description: "Request for calendar scheduling and discovery call.",
    html: `<p>Hi {{decision_maker}},</p>
<p>We would love to schedule a 30-minute alignment call to review {{company}}'s software requirements in detail.</p>
<p>Please let us know which of the following times works best for your schedule:</p>
<ul style="line-height: 1.6;">
  <li>Option 1: Tuesday at 10:00 AM EST</li>
  <li>Option 2: Wednesday at 2:00 PM EST</li>
  <li>Option 3: Thursday at 11:30 AM EST</li>
</ul>
<p>Alternatively, feel free to select a slot directly on our calendar link below:</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Book Calendar Time Slot</a></p>
<p style="margin-top:20px;">Looking forward to speaking with you!<br/><strong>Axorks Team</strong></p>`
  },
  {
    id: "follow-up",
    name: "Follow-up",
    category: "sales",
    subject: "Following up on our conversation — {{company}}",
    description: "Polite check-in follow up for pending leads.",
    html: `<p>Hi {{decision_maker}},</p>
<p>I wanted to quickly follow up on my previous note regarding {{company}}'s engineering roadmap.</p>
<p>I know how busy things get. If you are still exploring solutions for {{pain_point}}, I would be glad to share how our team resolved a similar challenge for another client in your domain.</p>
<p>Would 10 minutes later this week work for a brief update?</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Connect with Engineering Team</a></p>
<p style="margin-top:20px;">Best regards,<br/><strong>Axorks Sales & Engineering</strong></p>`
  },
  {
    id: "project-kickoff",
    name: "Project Kickoff",
    category: "projects",
    subject: "🚀 Project Kickoff: Welcome to Axorks OS — {{project_name}}",
    description: "Onboarding email sent at project inception.",
    html: `<p>Dear {{company}} Team,</p>
<p>We are thrilled to officially launch the <strong>{{project_name}}</strong> project!</p>
<p>Our engineering leads have set up your dedicated workspace in <strong>Axorks OS</strong>. You can log into your Client Portal to track real-time sprint progress, view design mockups, and inspect builds.</p>
<p><strong>Kickoff Overview:</strong></p>
<ul style="line-height: 1.6;">
  <li><strong>Kickoff Meeting Date:</strong> {{kickoff_date}}</li>
  <li><strong>Client Portal Access:</strong> Credentials activated</li>
  <li><strong>Sprint 1 Planning:</strong> Commences immediately</li>
</ul>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Access Client Portal Workspace</a></p>
<p style="margin-top:20px;">Welcome aboard!<br/><strong>Axorks Project Management Office</strong></p>`
  },
  {
    id: "project-delivery",
    name: "Project Delivery",
    category: "projects",
    subject: "🎉 Milestone Handover: {{project_name}} is Ready for Review",
    description: "Delivery notice for project milestone or final release.",
    html: `<p>Hi {{decision_maker}},</p>
<p>We are excited to inform you that milestone <strong>{{milestone_title}}</strong> for <strong>{{project_name}}</strong> has been successfully built, verified, and deployed to your staging environment.</p>
<p>Please review the attached release notes and test the build at your convenience.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Staging Build & Notes</a></p>
<p style="margin-top:20px;">Thank you for your ongoing partnership!<br/><strong>Axorks Engineering Team</strong></p>`
  },
  {
    id: "invoice",
    name: "Invoice",
    category: "finance",
    subject: "Invoice #INV-{{invoice_number}} from Axorks Inc.",
    description: "Billing notice with payment link and attached PDF invoice.",
    html: `<p>Hi {{decision_maker}},</p>
<p>Please find attached Invoice <strong>#INV-{{invoice_number}}</strong> for services rendered on <strong>{{project_name}}</strong>.</p>
<p><strong>Invoice Summary:</strong></p>
<ul style="line-height: 1.6;">
  <li><strong>Invoice Date:</strong> {{invoice_date}}</li>
  <li><strong>Amount Due:</strong> {{amount_due}}</li>
  <li><strong>Due Date:</strong> {{due_date}}</li>
</ul>
<p>You can complete payment securely online via bank transfer or card through your Client Portal.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#059669;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Pay Invoice Online</a></p>
<p style="margin-top:20px;">Thank you for your business!<br/><strong>Axorks Billing & Accounts Department</strong></p>`
  },
  {
    id: "maintenance-reminder",
    name: "Maintenance Reminder",
    category: "support",
    subject: "Upcoming Scheduled Maintenance Notice — {{system_name}}",
    description: "Notification for planned maintenance window.",
    html: `<p>Dear {{company}} Team,</p>
<p>Please be advised that we have scheduled routine system maintenance for <strong>{{system_name}}</strong> on <strong>{{maintenance_date}}</strong> between {{start_time}} and {{end_time}}.</p>
<p>During this window, brief service interruptions may occur while we deploy security updates and performance optimizations.</p>
<p>If you have any urgent requests, please contact our support desk directly.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#475569;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Check Live System Status</a></p>
<p style="margin-top:20px;">Best regards,<br/><strong>Axorks DevOps & Security Operations</strong></p>`
  },
  {
    id: "thank-you",
    name: "Thank You",
    category: "general",
    subject: "Thank you for partnering with Axorks",
    description: "Appreciation message for clients after project completion.",
    html: `<p>Dear {{decision_maker}},</p>
<p>On behalf of the entire team at Axorks, I wanted to express our sincere gratitude for choosing us as your technology partner for <strong>{{project_name}}</strong>.</p>
<p>It has been a privilege collaborating with your team, and we look forward to supporting your future growth and innovation roadmap.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Explore Axorks Solutions</a></p>
<p style="margin-top:20px;">Warmest regards,<br/><strong>Leadership Team, Axorks Technologies</strong></p>`
  },
  {
    id: "general-inquiry",
    name: "General Inquiry",
    category: "general",
    subject: "Response regarding your inquiry to Axorks",
    description: "Standard response template for general customer inquiries.",
    html: `<p>Hi {{contact_name}},</p>
<p>Thank you for contacting Axorks Technologies!</p>
<p>We received your inquiry regarding <em>"{{inquiry_topic}}"</em> and a technical account specialist has been assigned to your request.</p>
<p>We will follow up with detailed information within 24 business hours.</p>
<p style="margin-top:18px;"><a href="https://axorks.com" target="_blank" style="background:#7c3aed;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Visit Axorks Resource Center</a></p>
<p style="margin-top:20px;">Best regards,<br/><strong>Axorks Client Support</strong></p>`
  }
];

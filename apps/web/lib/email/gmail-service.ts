/**
 * Axorks OS — Google Workspace & Gmail API Service (Server Only)
 *
 * Implements Google OAuth 2.0 and Gmail REST API connectivity:
 * - OAuth Authorization URL generation with offline refresh token
 * - Secure Token exchange & automatic token refreshing
 * - Sending emails from Google Workspace aliases (sales@axorks.com, contact@, hello@, careers@, muhammad.mujahid@)
 * - Thread reply support with In-Reply-To and References RFC 2822 headers
 * - Inbox sync to receive incoming emails sent to primary account or any alias
 * - Safe token persistence in Neon PostgreSQL (never exposed to frontend)
 */

import { sql, DATABASE_URL } from "../db";
import { PRIMARY_WORKSPACE_EMAIL, WORKSPACE_ALIASES, WorkspaceAlias } from "./constants";

export { PRIMARY_WORKSPACE_EMAIL, WORKSPACE_ALIASES, type WorkspaceAlias };

/** Read Google credentials lazily at call time so env vars are always resolved */
export function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || "";
}
export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || "";
}

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

/**
 * Computes the Google OAuth 2.0 Redirect URI dynamically.
 * Priority:
 * 1. Explicit GOOGLE_REDIRECT_URI environment variable
 * 2. APP_URL / NEXT_PUBLIC_DOMAIN / VERCEL_URL + /api/v1/email/gmail/callback
 * 3. Default localhost:3000 callback
 */
export function getGoogleOAuthRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim().length > 0) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }

  const baseDomain =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const cleanBase = baseDomain.replace(/\/$/, "");
  return `${cleanBase}/api/v1/email/gmail/callback`;
}

/**
 * Generates the Google OAuth 2.0 consent URL.
 */
export function generateGoogleAuthUrl(state?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables");
  }

  const redirectUri = getGoogleOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent", // Force consent prompt to guarantee receiving a refresh_token
    include_granted_scopes: "true",
    login_hint: PRIMARY_WORKSPACE_EMAIL,
  });

  if (state) {
    params.set("state", state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the OAuth authorization code for Access & Refresh tokens,
 * and persists them in Neon PostgreSQL.
 */
export async function exchangeGoogleCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  email: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) missing in environment.");
  }

  const redirectUri = getGoogleOAuthRedirectUri();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorJson = await tokenResponse.json().catch(() => ({}));
    throw new Error(
      `Failed to exchange authorization code: ${errorJson.error_description || errorJson.error || tokenResponse.statusText}`
    );
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;
  const expiryDate = Date.now() + expiresIn * 1000;
  const scope = tokenData.scope || GMAIL_SCOPE;

  // Verify Google User Profile Email
  let userEmail = PRIMARY_WORKSPACE_EMAIL;
  try {
    const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      if (profileData.emailAddress) {
        userEmail = profileData.emailAddress;
      }
    }
  } catch (err) {
    console.warn("Could not fetch user profile email address from Gmail API:", err);
  }

  // Save or update tokens in Neon DB
  if (DATABASE_URL) {
    try {
      await sql`
        INSERT INTO workspace_oauth_tokens (
          provider, account_email, access_token, refresh_token, scope, token_type, expiry_date, is_active, updated_at
        ) VALUES (
          'google', ${userEmail.toLowerCase()}, ${accessToken}, ${refreshToken || null}, ${scope}, 'Bearer', ${expiryDate}, TRUE, NOW()
        )
        ON CONFLICT (account_email) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, workspace_oauth_tokens.refresh_token),
          scope = EXCLUDED.scope,
          expiry_date = EXCLUDED.expiry_date,
          is_active = TRUE,
          updated_at = NOW();
      `;
    } catch (dbErr) {
      console.error("Failed to save Google OAuth token into Neon DB:", dbErr);
    }
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    scope,
    email: userEmail,
  };
}

/**
 * Retrieves a valid Google Access Token for the workspace account.
 * Automatically refreshes using the stored refresh_token if expired.
 */
export async function getGoogleAccessToken(accountEmail: string = PRIMARY_WORKSPACE_EMAIL): Promise<string | null> {
  if (!DATABASE_URL) return null;

  try {
    const rows = await sql`
      SELECT * FROM workspace_oauth_tokens
      WHERE provider = 'google' AND (LOWER(account_email) = ${accountEmail.toLowerCase()} OR is_active = TRUE)
      ORDER BY updated_at DESC LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return null;
    }

    const tokenRecord = rows[0];
    const expiryDate = Number(tokenRecord.expiry_date || 0);
    const now = Date.now();

    // If access token is still valid (with 2 min buffer), return it
    if (tokenRecord.access_token && expiryDate > now + 120000) {
      return tokenRecord.access_token;
    }

    // Access token expired, attempt refresh using refresh_token
    const refreshToken = tokenRecord.refresh_token;
    if (!refreshToken) {
      console.warn("No refresh_token found for Google Workspace account. Re-authorization required.");
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing during token refresh.");
      return null;
    }

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errBody = await refreshResponse.json().catch(() => ({}));
      console.error("Token refresh failed:", errBody);
      return null;
    }

    const refreshedData = await refreshResponse.json();
    const newAccessToken = refreshedData.access_token;
    const newExpiresIn = refreshedData.expires_in || 3600;
    const newExpiryDate = Date.now() + newExpiresIn * 1000;

    // Update database with new token
    await sql`
      UPDATE workspace_oauth_tokens
      SET access_token = ${newAccessToken}, expiry_date = ${newExpiryDate}, updated_at = NOW()
      WHERE id = ${tokenRecord.id};
    `;

    return newAccessToken;
  } catch (err) {
    console.error("Error retrieving Google access token:", err);
    return null;
  }
}

/**
 * Checks the Google Workspace connection status.
 */
export async function getGoogleWorkspaceStatus(): Promise<{
  connected: boolean;
  accountEmail: string | null;
  scopes: string[];
  expiresAt: string | null;
  availableAliases: string[];
}> {
  if (!DATABASE_URL) {
    return {
      connected: false,
      accountEmail: null,
      scopes: [],
      expiresAt: null,
      availableAliases: [...WORKSPACE_ALIASES],
    };
  }

  try {
    const rows = await sql`
      SELECT account_email, scope, expiry_date, is_active, updated_at
      FROM workspace_oauth_tokens
      WHERE provider = 'google' AND is_active = TRUE
      ORDER BY updated_at DESC LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const r = rows[0];
      const expiry = r.expiry_date ? new Date(Number(r.expiry_date)).toISOString() : null;
      return {
        connected: true,
        accountEmail: r.account_email,
        scopes: (r.scope || "").split(" ").filter(Boolean),
        expiresAt: expiry,
        availableAliases: [...WORKSPACE_ALIASES],
      };
    }
  } catch (err) {
    console.error("Error checking Google Workspace status:", err);
  }

  return {
    connected: false,
    accountEmail: null,
    scopes: [],
    expiresAt: null,
    availableAliases: [...WORKSPACE_ALIASES],
  };
}

/**
 * Formats an RFC 2822 email message and encodes it in URL-safe base64.
 */
function createMimeMessage(options: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
  attachments?: Array<{ filename: string; content?: string; contentType?: string }>;
}): string {
  const boundary = `__AXORKS_BOUNDARY_${Date.now().toString(16)}__`;
  const lines: string[] = [];

  lines.push(`From: ${options.from}`);
  lines.push(`To: ${options.to.join(", ")}`);
  if (options.cc && options.cc.length > 0) {
    lines.push(`Cc: ${options.cc.join(", ")}`);
  }
  if (options.bcc && options.bcc.length > 0) {
    lines.push(`Bcc: ${options.bcc.join(", ")}`);
  }
  if (options.replyTo) {
    lines.push(`Reply-To: ${options.replyTo}`);
  }
  if (options.inReplyTo) {
    lines.push(`In-Reply-To: ${options.inReplyTo}`);
  }
  if (options.references) {
    lines.push(`References: ${options.references}`);
  }

  lines.push(`Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`);
  lines.push("MIME-Version: 1.0");

  const hasAttachments = options.attachments && options.attachments.length > 0;

  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(options.bodyHtml || options.bodyText || "");

    for (const att of options.attachments!) {
      lines.push("");
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.contentType || "application/octet-stream"}; name="${att.filename}"`);
      lines.push("Content-Transfer-Encoding: base64");
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push("");
      lines.push(att.content || "");
    }

    lines.push("");
    lines.push(`--${boundary}--`);
  } else {
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(options.bodyHtml || options.bodyText || "");
  }

  const rawMime = lines.join("\r\n");

  // Encode to URL-safe base64 (RFC 4648 §5)
  return Buffer.from(rawMime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Dispatches an email using the Gmail REST API (users.messages.send).
 * Supports sending from sales@axorks.com, contact@, hello@, careers@, muhammad.mujahid@.
 */
export async function sendGmailMessage(options: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  senderAlias?: string;
  senderName?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
  attachments?: Array<{ filename: string; content?: string; contentType?: string }>;
  sentByUserId?: string;
  sentByUserName?: string;
  leadId?: string;
  isFollowup?: boolean;
}): Promise<{
  id: string;
  threadId: string;
  messageId: string;
  senderAlias: string;
}> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error(
      "Google Workspace is not connected. Please authorize muhammad.mujahid@axorks.com via OAuth first."
    );
  }

  const alias = options.senderAlias || "sales@axorks.com";
  const senderDisplayName = options.senderName || "Axorks Technologies";
  const fromHeader = `"${senderDisplayName}" <${alias}>`;

  const encodedRaw = createMimeMessage({
    from: fromHeader,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    bodyHtml: options.html,
    bodyText: options.text,
    replyTo: options.replyTo || alias,
    inReplyTo: options.inReplyTo,
    references: options.references,
    threadId: options.threadId,
    attachments: options.attachments,
  });

  const requestBody: any = { raw: encodedRaw };
  if (options.threadId) {
    requestBody.threadId = options.threadId;
  }

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      `Gmail API send error (${res.status}): ${errorJson.error?.message || res.statusText}`
    );
  }

  const gmailData = await res.json();
  const messageId = gmailData.id;
  const threadId = gmailData.threadId || messageId;

  // Persist outbound email to Neon DB
  if (DATABASE_URL) {
    try {
      await sql`
        INSERT INTO workspace_emails (
          message_id, thread_id, direction, sender_email, sender_name, sender_alias,
          recipient_email, recipient_name, to_recipients, cc_recipients, bcc_recipients,
          subject, body_html, body_text, snippet, is_read, has_attachments,
          lead_id, sent_by_user_id, sent_by_user_name, is_followup, status, provider,
          sent_at, created_at, updated_at
        ) VALUES (
          ${messageId}, ${threadId}, 'outbound', ${alias}, ${senderDisplayName}, ${alias},
          ${options.to[0] || ""}, ${options.to[0] || ""}, ${JSON.stringify(options.to)}::jsonb,
          ${JSON.stringify(options.cc || [])}::jsonb, ${JSON.stringify(options.bcc || [])}::jsonb,
          ${options.subject}, ${options.html || ""}, ${options.text || ""},
          ${(options.text || options.html || "").substring(0, 160).replace(/<[^>]*>/g, "")},
          TRUE, ${(options.attachments?.length || 0) > 0},
          ${options.leadId || null}, ${options.sentByUserId || null}, ${options.sentByUserName || "Team Member"},
          ${Boolean(options.isFollowup)}, 'sent', 'gmail',
          NOW(), NOW(), NOW()
        )
        ON CONFLICT (message_id) DO NOTHING;
      `;
    } catch (dbErr) {
      console.error("Error saving sent email to Neon DB:", dbErr);
    }
  }

  return {
    id: messageId,
    threadId,
    messageId,
    senderAlias: alias,
  };
}

/**
 * Synchronizes incoming and recent messages from the Google Workspace mailbox.
 * Discovers emails delivered to muhammad.mujahid@axorks.com and any alias (sales@, contact@, hello@, careers@).
 */
export async function syncGmailInbox(options: { maxResults?: number; query?: string } = {}): Promise<{
  syncedCount: number;
  newMessages: number;
}> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error("Google Workspace is not connected. Please connect with Google OAuth first.");
  }

  const maxResults = options.maxResults || 25;
  const q = options.query || "";

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(`Gmail API list error (${listRes.status}): ${err.error?.message || listRes.statusText}`);
  }

  const listData = await listRes.json();
  const messages: Array<{ id: string; threadId: string }> = listData.messages || [];

  let syncedCount = 0;
  let newMessages = 0;

  for (const msg of messages) {
    try {
      // Check if message already exists in DB
      if (DATABASE_URL) {
        const existing = await sql`SELECT id FROM workspace_emails WHERE message_id = ${msg.id} LIMIT 1;`;
        if (existing && existing.length > 0) {
          syncedCount++;
          continue;
        }
      }

      // Fetch full message details from Gmail
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!msgRes.ok) continue;

      const detail = await msgRes.json();
      const headers = detail.payload?.headers || [];

      const getHeader = (name: string) => {
        const h = headers.find((x: any) => x.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : "";
      };

      const fromHeader = getHeader("From");
      const toHeader = getHeader("To");
      const ccHeader = getHeader("Cc");
      const bccHeader = getHeader("Bcc");
      const subject = getHeader("Subject") || "(No Subject)";
      const dateHeader = getHeader("Date");
      const snippet = detail.snippet || "";
      const labelIds: string[] = detail.labelIds || [];

      const isOutbound = labelIds.includes("SENT");
      const isUnread = labelIds.includes("UNREAD");
      const isStarred = labelIds.includes("STARRED");

      // Extract sender name and email
      const fromMatch = fromHeader.match(/(.*?)\s*<(.+?)>/) || [null, fromHeader, fromHeader];
      const senderName = fromMatch[1]?.replace(/^"|"$/g, "").trim() || fromHeader;
      const senderEmail = fromMatch[2]?.trim() || fromHeader;

      // Extract body (HTML and text)
      let bodyHtml = "";
      let bodyText = "";

      const parseParts = (payload: any) => {
        if (!payload) return;
        if (payload.mimeType === "text/html" && payload.body?.data) {
          bodyHtml = Buffer.from(payload.body.data, "base64").toString("utf-8");
        } else if (payload.mimeType === "text/plain" && payload.body?.data) {
          bodyText = Buffer.from(payload.body.data, "base64").toString("utf-8");
        }
        if (payload.parts && Array.isArray(payload.parts)) {
          payload.parts.forEach(parseParts);
        }
      };

      parseParts(detail.payload);

      if (!bodyHtml && bodyText) {
        bodyHtml = `<p>${bodyText.replace(/\n/g, "<br/>")}</p>`;
      }

      // Determine which alias received this email
      let matchedAlias = "sales@axorks.com";
      const toCombined = `${toHeader} ${ccHeader}`.toLowerCase();
      for (const alias of WORKSPACE_ALIASES) {
        if (toCombined.includes(alias.toLowerCase())) {
          matchedAlias = alias;
          break;
        }
      }

      const toList = toHeader.split(",").map((s: string) => s.trim()).filter(Boolean);
      const ccList = ccHeader ? ccHeader.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const bccList = bccHeader ? bccHeader.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

      const dateObj = dateHeader ? new Date(dateHeader) : new Date();

      if (DATABASE_URL) {
        await sql`
          INSERT INTO workspace_emails (
            message_id, thread_id, direction, sender_email, sender_name, sender_alias,
            recipient_email, recipient_name, to_recipients, cc_recipients, bcc_recipients,
            subject, body_html, body_text, snippet, is_read, is_starred,
            status, provider, sent_at, received_at, created_at, updated_at
          ) VALUES (
            ${msg.id}, ${msg.threadId || msg.id},
            ${isOutbound ? "outbound" : "inbound"},
            ${senderEmail}, ${senderName}, ${matchedAlias},
            ${toList[0] || matchedAlias}, ${toList[0] || ""},
            ${JSON.stringify(toList)}::jsonb,
            ${JSON.stringify(ccList)}::jsonb,
            ${JSON.stringify(bccList)}::jsonb,
            ${subject}, ${bodyHtml || snippet}, ${bodyText || snippet},
            ${snippet}, ${!isUnread}, ${isStarred},
            ${isOutbound ? "sent" : "received"}, 'gmail',
            ${isOutbound ? dateObj.toISOString() : null},
            ${!isOutbound ? dateObj.toISOString() : null},
            NOW(), NOW()
          )
          ON CONFLICT (message_id) DO UPDATE SET
            is_read = EXCLUDED.is_read,
            is_starred = EXCLUDED.is_starred,
            updated_at = NOW();
        `;
      }

      syncedCount++;
      newMessages++;
    } catch (err) {
      console.error(`Error processing message ${msg.id}:`, err);
    }
  }

  return { syncedCount, newMessages };
}

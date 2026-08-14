const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const BASE_URL = "https://api.hunter.io/v2";

function getUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.append("api_key", HUNTER_API_KEY || "");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  return url.toString();
}

export async function searchDomain(domain: string) {
  if (!HUNTER_API_KEY) throw new Error("HUNTER_API_KEY not configured");
  const url = getUrl("/domain-search", { domain });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.details || "Failed to search domain");
  }
  return res.json();
}

export async function findEmail(domain: string, first_name: string, last_name: string) {
  if (!HUNTER_API_KEY) throw new Error("HUNTER_API_KEY not configured");
  const url = getUrl("/email-finder", { domain, first_name, last_name });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.details || "Failed to find email");
  }
  return res.json();
}

export async function verifyEmail(email: string) {
  if (!HUNTER_API_KEY) throw new Error("HUNTER_API_KEY not configured");
  const url = getUrl("/email-verifier", { email });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.details || "Failed to verify email");
  }
  return res.json();
}

export async function getAccountInfo() {
  if (!HUNTER_API_KEY) throw new Error("HUNTER_API_KEY not configured");
  const url = getUrl("/account");
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.details || "Failed to get account info");
  }
  return res.json();
}

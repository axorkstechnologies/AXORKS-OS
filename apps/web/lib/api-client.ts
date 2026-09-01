let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiEnvelope<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  } | null;
  errors?: Array<{ message: string }> | null;
}

async function buildRequest(endpoint: string, options: FetchOptions = {}) {
  const { params, headers, ...restOptions } = options;

  const isBrowser = typeof window !== "undefined";

  // In the browser, all Next.js API routes (/api/...) MUST be fetched from the current origin
  let targetUrl = endpoint;
  if (!isBrowser && API_BASE_URL && !endpoint.startsWith("http")) {
    targetUrl = `${API_BASE_URL}${endpoint}`;
  }

  if (params) {
    const searchParams = new URLSearchParams(params);
    targetUrl += (targetUrl.includes("?") ? "&" : "?") + searchParams.toString();
  }

  const token = getAccessToken();

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: reqHeaders,
      ...restOptions,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.error ||
        errorData?.errors?.[0]?.message ||
        errorData?.detail ||
        errorData?.message ||
        `HTTP Error ${response.status}`;
      throw new Error(message);
    }

    return response;
  } catch (err: any) {
    // If direct fetch to API_BASE_URL threw a network connection error, attempt relative fallback
    if (
      (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("fetch failed")) &&
      targetUrl !== endpoint
    ) {
      let relativeUrl = endpoint;
      if (params) {
        const searchParams = new URLSearchParams(params);
        relativeUrl += `?${searchParams.toString()}`;
      }

      const fallbackResponse = await fetch(relativeUrl, {
        headers: reqHeaders,
        ...restOptions,
      });

      if (!fallbackResponse.ok) {
        const fallbackErrorData = await fallbackResponse.json().catch(() => ({}));
        const fallbackMessage =
          fallbackErrorData?.error ||
          fallbackErrorData?.errors?.[0]?.message ||
          fallbackErrorData?.detail ||
          fallbackErrorData?.message ||
          `HTTP Error ${fallbackResponse.status}`;
        throw new Error(fallbackMessage);
      }

      return fallbackResponse;
    }
    throw err;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await buildRequest(endpoint, options);
  const json = await response.json();
  if (json && typeof json === "object" && "data" in json && json.data !== undefined) {
    return json.data;
  }
  return json;
}

/** Paginated list endpoints — returns full envelope with meta. */
export async function apiClientPaginated<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiEnvelope<T[]>> {
  const response = await buildRequest(endpoint, options);
  return response.json();
}

/** Authenticated file download — returns Blob. */
export async function apiDownload(endpoint: string): Promise<Blob> {
  const response = await buildRequest(endpoint, { method: "GET" });
  return response.blob();
}

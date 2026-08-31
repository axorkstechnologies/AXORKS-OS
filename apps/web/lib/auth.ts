import { apiClient, setAccessToken, getAccessToken } from "./api-client";
import { useAuthStore } from "@/stores/auth-store";

export { setAccessToken, getAccessToken };

export async function login(identifier: string, password: string) {
  const data = await apiClient("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, email: identifier, username: identifier, password }),
  });

  if (data?.access_token && data?.user) {
    setAccessToken(data.access_token);
    useAuthStore.getState().setAuth(data.user, data.access_token);
  }
  return data;
}

export async function logout() {
  try {
    await apiClient("/api/v1/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
    useAuthStore.getState().logout();
  }
}

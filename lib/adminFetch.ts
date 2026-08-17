"use client";

/** Retry an admin request once after refreshing an expired access token. */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  let response = await fetch(input, init);
  if (response.status !== 401 && response.status !== 403) return response;

  const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshed.ok) return response;
  response = await fetch(input, init);
  return response;
}

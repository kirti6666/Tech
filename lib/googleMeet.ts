interface GoogleMeetSpace {
  name: string;
  meetingUri: string;
  meetingCode?: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SPACES_URL = "https://meet.googleapis.com/v2/spaces";

function reusableMeetUrl(): string | null {
  const value = process.env.GOOGLE_MEET_URL?.trim() ?? "";
  return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/i.test(value)
    ? value
    : null;
}

export function isGoogleMeetConfigured(): boolean {
  return Boolean(
    reusableMeetUrl() ||
      (process.env.GOOGLE_MEET_CLIENT_ID &&
        process.env.GOOGLE_MEET_CLIENT_SECRET &&
        process.env.GOOGLE_MEET_REFRESH_TOKEN)
  );
}

async function accessToken(): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_MEET_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_MEET_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_MEET_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? "Google authorization failed.");
  }
  return data.access_token;
}

export async function createGoogleMeetSpace(): Promise<GoogleMeetSpace> {
  const fixedUrl = reusableMeetUrl();
  if (fixedUrl) {
    return {
      name: "spaces/reusable-techbro-consultation",
      meetingUri: fixedUrl,
    };
  }

  if (!isGoogleMeetConfigured()) {
    throw new Error("Google Meet is not configured.");
  }

  const token = await accessToken();
  const response = await fetch(SPACES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  const data = (await response.json()) as Partial<GoogleMeetSpace> & {
    error?: { message?: string };
  };

  if (
    !response.ok ||
    !data.name ||
    !data.meetingUri ||
    !data.meetingUri.startsWith("https://meet.google.com/")
  ) {
    throw new Error(data.error?.message ?? "Google Meet could not create a meeting link.");
  }

  return {
    name: data.name,
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
  };
}

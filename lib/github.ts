/**
 * GitHub repository access.
 *
 * Some products are delivered as a repository invitation rather than (or as
 * well as) a zip, so buyers get history and can pull fixes. That access has
 * to be revocable on refund, which is the only reason this file exists —
 * without revocation it would just be a manual admin task.
 *
 * Requires a fine-grained PAT with Administration: read/write on the
 * relevant repos, in GITHUB_TOKEN. That token can add collaborators to your
 * repositories, so treat it like a production secret: server-side only,
 * never in NEXT_PUBLIC_*.
 *
 * Every function returns a result object rather than throwing. Losing a
 * repo invite must not roll back a payment.
 */

const API = "https://api.github.com";

interface GitHubResult {
  ok: boolean;
  error?: string;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function isGitHubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

/**
 * `repo` is "owner/name". Read-only ("pull") permission is deliberate —
 * a buyer should never be able to push to your source of truth.
 */
export async function inviteCollaborator(
  repo: string,
  username: string
): Promise<GitHubResult> {
  if (!isGitHubConfigured()) {
    return { ok: false, error: "GITHUB_TOKEN is not configured" };
  }

  try {
    const response = await fetch(
      `${API}/repos/${repo}/collaborators/${encodeURIComponent(username)}`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ permission: "pull" }),
      }
    );

    // 201 = invitation created, 204 = already a collaborator. Both fine.
    if (response.status === 201 || response.status === 204) return { ok: true };

    const body = await response.text();
    return { ok: false, error: `GitHub ${response.status}: ${body.slice(0, 200)}` };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * Removes access on refund.
 *
 * Removing a collaborator does NOT cancel a pending invitation, so both are
 * handled. Miss the invitation and a refunded buyer can still accept it days
 * later — the exact hole revocation exists to close.
 */
export async function removeCollaborator(
  repo: string,
  username: string
): Promise<GitHubResult> {
  if (!isGitHubConfigured()) {
    return { ok: false, error: "GITHUB_TOKEN is not configured" };
  }

  try {
    await fetch(`${API}/repos/${repo}/collaborators/${encodeURIComponent(username)}`, {
      method: "DELETE",
      headers: headers(),
    });

    const invitesResponse = await fetch(`${API}/repos/${repo}/invitations`, {
      headers: headers(),
    });

    if (invitesResponse.ok) {
      const invitations = (await invitesResponse.json()) as {
        id: number;
        invitee: { login: string } | null;
      }[];

      const pending = invitations.find(
        (invite) =>
          invite.invitee?.login?.toLowerCase() === username.toLowerCase()
      );

      if (pending) {
        await fetch(`${API}/repos/${repo}/invitations/${pending.id}`, {
          method: "DELETE",
          headers: headers(),
        });
      }
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

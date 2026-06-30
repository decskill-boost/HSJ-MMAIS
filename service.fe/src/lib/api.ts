import type { UserProfile } from '../types/permissions';

const API_URL = import.meta.env.VITE_API_URL as string;

export async function fetchCurrentUser(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status}`);
  }

  return res.json() as Promise<UserProfile>;
}

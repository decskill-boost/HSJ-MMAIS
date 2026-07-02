import type { UserProfile } from "../types/permissions";

const API_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchCurrentUser(
  accessToken: string,
): Promise<UserProfile> {
  console.log("[api] a pedir perfil ao backend", {
    accessToken: Boolean(accessToken),
    apiUrl: API_URL,
  });

  let res: Response;
  try {
    res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    // Erro de rede (backend em baixo, CORS, DNS, etc.) - não é um token inválido
    console.error("[api] erro de rede ao contactar o backend", err);
    throw new ApiError("Network error while fetching user profile", 0);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.log("[api] falha ao buscar perfil do backend", {
      status: res.status,
      body,
    });
    throw new ApiError(
      `Failed to fetch user profile: ${res.status}`,
      res.status,
    );
  }

  const profile = (await res.json()) as UserProfile;
  console.log("[api] perfil recebido do backend", profile.email);
  return profile;
}

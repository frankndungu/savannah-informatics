import { getTokens, setTokens } from "./tokens";

const BASE = "https://dummyjson.com";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const current = getTokens();
  if (!current) return false;

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken, expiresInMins: 1 }),
  });

  if (!res.ok) {
    setTokens(null);
    return false;
  }

  const data = await res.json();
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return true;
}

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = () => {
    const current = getTokens();
    return fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        ...(current ? { Authorization: `Bearer ${current.accessToken}` } : {}),
      },
    });
  };

  let res = await send();

  if (res.status === 401 && getTokens()) {
    const ok = await refreshOnce();
    if (!ok) throw new ApiError(401, "Session expired");
    res = await send();
  }

  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`);
  return res.json();
}

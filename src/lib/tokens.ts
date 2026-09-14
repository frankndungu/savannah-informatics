type Tokens = { accessToken: string; refreshToken: string };

let tokens: Tokens | null = null;

export function getTokens() {
  return tokens;
}

export function setTokens(next: Tokens | null) {
  tokens = next;
}

let tokenExpired = false;

export function setTokenExpired(value: boolean): void {
  tokenExpired = value;
}

export function isTokenExpired(): boolean {
  return tokenExpired;
}

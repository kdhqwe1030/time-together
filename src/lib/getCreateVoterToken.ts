const ns = (shareCode: string) => ({
  tokenKey: `vt:${shareCode}`,
  nameKey: `n:${shareCode}`,
});

export function createVoterToken(shareCode: string) {
  const { tokenKey } = ns(shareCode);
  const existing = localStorage.getItem(tokenKey);
  if (existing) return existing;

  const token = crypto.randomUUID();
  localStorage.setItem(tokenKey, token);
  return token;
}

export function loadIdentity(shareCode: string) {
  const { nameKey } = ns(shareCode);
  const voterToken = createVoterToken(shareCode);
  const displayName = localStorage.getItem(nameKey) ?? "";
  return { voterToken, displayName };
}

export function saveName(shareCode: string, name: string) {
  const { nameKey } = ns(shareCode);
  localStorage.setItem(nameKey, name.trim());
}

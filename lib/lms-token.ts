export function normalizeLmsToken(value: unknown): string | null {
  if (typeof value !== "string") return null

  const token = value.replace(/\s+/g, "").trim()
  return token.length > 0 ? token : null
}

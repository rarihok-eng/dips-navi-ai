/** Client-safe cache key for page titles (no Node.js fs imports). */
export function pageTitleCacheKey(sourceUrl: string, page: number): string {
  return `${sourceUrl}#${page}`;
}

export function buildPdfPageUrl(sourceUrl: string, page: number): string {
  const base = sourceUrl.split("#")[0];
  return `${base}#page=${page}`;
}

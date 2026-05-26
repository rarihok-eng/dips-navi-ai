const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export function sanitizePdfDisplayName(displayName: string): string {
  return displayName
    .replace(INVALID_FILENAME_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function getLocalPdfBasename(
  manualSlug: string,
  displayName: string,
): string {
  const safeName = sanitizePdfDisplayName(displayName) || manualSlug;
  return `${safeName}__${manualSlug}`;
}

export function getLocalPdfFilename(
  manualSlug: string,
  displayName: string,
): string {
  return `${getLocalPdfBasename(manualSlug, displayName)}.pdf`;
}

export function matchesLocalPdfSlug(filename: string, manualSlug: string): boolean {
  if (filename === `${manualSlug}.pdf`) return true;
  return filename.endsWith(`__${manualSlug}.pdf`);
}

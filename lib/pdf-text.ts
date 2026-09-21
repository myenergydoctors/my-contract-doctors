import "server-only";

/** Independent text layer. Scans return empty text rather than invented OCR. */
export async function readPdfPageText(bytes: Uint8Array): Promise<string[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: bytes.slice(), useSystemFonts: true, useWorkerFetch: false });
  try {
    const document = await task.promise;
    const pages: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
      page.cleanup();
    }
    return pages;
  } finally { await task.destroy(); }
}

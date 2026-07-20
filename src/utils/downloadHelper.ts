/**
 * downloadHelper.ts
 *
 * Utility to force direct client-side file download bypassing browser tab rendering.
 * Programmatically creates a Blob, Object URL, temporary hidden anchor element with
 * download attribute, appends it to DOM, and triggers click().
 * Fully optimized for Desktop, iOS Safari, Android Chrome, and Webview browsers.
 */

export function triggerBlobDownload(blob: Blob, filename: string = "Executive_Performance_Report.pdf") {
  // 1. Instantiate Object URL from Blob object
  const blobUrl = URL.createObjectURL(blob);

  // 2. Create temporary invisible <a> element
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.setAttribute("download", filename);
  link.style.display = "none";

  // 3. Append temporary element to DOM
  document.body.appendChild(link);

  // 4. Programmatically trigger click event (invokes native download prompt directly)
  link.click();

  // 5. Cleanup DOM element and revoke Blob URL
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

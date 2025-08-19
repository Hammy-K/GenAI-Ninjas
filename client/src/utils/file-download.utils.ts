export class FileDownloadUtils {
  static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static generateExportFilename(
    prefix: string,
    extension: string = "csv",
  ): string {
    return `${prefix}-export-${Date.now()}.${extension}`;
  }
}

import { HtmlGamesModel } from "@/models/html-games.model";
import {
  HtmlGamesExportFormData,
  HtmlGamesExportParams,
} from "@/types/admin/html-games.types";
import { FileDownloadUtils } from "@/utils/file-download.utils";
import { useState } from "react";

export function useHtmlGamesExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportProjects = async (formData: HtmlGamesExportFormData) => {
    setIsExporting(true);
    setError(null);

    try {
      const params: HtmlGamesExportParams = {
        organization:
          formData.organization?.toLowerCase() === "all"
            ? undefined
            : formData.organization,
        from: formData.from || undefined,
        to: formData.to || undefined,
        school: formData.school?.trim() || undefined,
        name: formData.name?.trim() || undefined,
        n: formData.n ? parseInt(formData.n, 10) : undefined,
      };

      const blob = await HtmlGamesModel.exportProjects(params);

      const filename =
        FileDownloadUtils.generateExportFilename("html-projects");

      FileDownloadUtils.downloadBlob(blob, filename);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isExporting,
    error,
    exportProjects,
    clearError,
  };
}

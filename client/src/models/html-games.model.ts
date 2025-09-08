import { HtmlGamesExportParams } from "@/types/admin/html-games.types";
import Cookies from "js-cookie";

export class HtmlGamesModel {
  private static readonly BASE_URL = "/api/html-projects";

  static async exportProjects(params: HtmlGamesExportParams): Promise<Blob> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        searchParams.append(key, String(value));
      }
    });

    const adminAuth = Cookies.get("admin_token");

    const response = await fetch(`${this.BASE_URL}/export?${searchParams}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAuth}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Export failed with status ${response.status}`,
      );
    }

    return response.blob();
  }
}

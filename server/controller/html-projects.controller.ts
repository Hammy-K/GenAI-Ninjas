import type { Request, Response } from "express";
import { HtmlProjectsExportService } from "../services/html-projects.export.service";
import { CsvUtils } from "../utils/csv.utils";

export async function exportHtmlProjectsHandler(req: Request, res: Response) {
  try {
    const org =
      typeof req.query.organization === "string"
        ? req.query.organization
        : "all";

    const from =
      typeof req.query.from === "string" ? req.query.from : undefined;

    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    const school =
      typeof req.query.school === "string"
        ? req.query.school.trim()
        : undefined;

    const name =
      typeof req.query.name === "string" ? req.query.name.trim() : undefined;

    const nParam =
      typeof req.query.n === "string" ? parseInt(req.query.n, 10) : undefined;

    const topNPerStudent = Number.isFinite(nParam) && nParam! > 0 ? nParam! : 1;

    const result = await HtmlProjectsExportService.fetchExportRows({
      organization: org?.toLowerCase() === "all" ? undefined : org,
      from,
      to,
      school,
      name,
      topNPerStudent,
    });

    const rows = Array.isArray(result) ? result : ((result as any).rows ?? []);

    const csvRows = rows.map((r: any, i: number) => ({
      "#": i + 1,
      "Student Name": r.fullName,
      School: r.schoolName ?? "",
      "Phone Number": r.phoneNumber ?? "",
      "Project Link": r.projectLink,
      "Project Created At": new Date(r.projectCreatedAt).toLocaleString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
      "User ID": r.userId,
    }));

    const csv = CsvUtils.toCsv(csvRows, {
      bom: true,
      headersOrder: [
        "#",
        "Student Name",
        "School",
        "Phone Number",
        "Project Link",
        "Project Created At",
        "User ID",
      ],
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="html-projects-export-${Date.now()}.csv"`,
    );

    res.status(200).send(csv);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to export CSV", details: err?.message });
  }
}

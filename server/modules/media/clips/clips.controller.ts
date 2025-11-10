import type { Request, Response } from "express";
import multer from "multer";
import { ClipsModel } from "./clips.model";
import { normalizeLimitOffset, toOrderDir } from "../media.utils";
import type { ClipFindOptions } from "./clips.types";
import { clipsStorageUtil } from "./clips-storage.util";

export const upload = multer({ storage: multer.memoryStorage() });

export const ClipsController = {
  async createViaUpload(req: Request, res: Response) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;

      const { title, trackStudentEmail } = req.body as {
        title?: string;
        trackStudentEmail?: string;
      };

      if (!file)
        return res
          .status(400)
          .json({ ok: false, error: "يجب إرفاق ملف فيديو صالح للرفع." });

      if (!title)
        return res
          .status(400)
          .json({ ok: false, error: "عنوان الفيديو مطلوب." });

      if (!trackStudentEmail) {
        return res.status(400).json({
          ok: false,
          error: "يجب إرسال البريد الإلكتروني للطالب لإتمام العملية.",
        });
      }

      const clipUrl = await clipsStorageUtil.uploadClip(file.buffer);

      const row = await ClipsModel.create({
        trackStudentEmail,
        title,
        clipUrl,
      });

      res.status(201).json({ ok: true, data: row });
    } catch (err: any) {
      console.error("createViaUpload error:", err?.message || err);
      res.status(500).json({
        ok: false,
        error: "تعذّر رفع الفيديو. الرجاء المحاولة مرة أخرى لاحقًا.",
      });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const search = (req.query.search as string) || undefined;
      const orderBy =
        (req.query.orderBy as ClipFindOptions["orderBy"]) || "createdAt";
      const orderDirection = toOrderDir(
        req.query.orderDirection as string | undefined,
      );

      let isFeatured: boolean | undefined = undefined;

      if (typeof req.query.isFeatured === "string") {
        if (req.query.isFeatured.toLowerCase() === "true") {
          isFeatured = true;
        }
        // else if (req.query.isFeatured.toLowerCase() === "false") {
        //   isFeatured = false;
        // }
      }

      const viewerEmail =
        (req.query.viewerEmail as string | undefined)?.trim()?.toLowerCase() ||
        null;

      const { limit: lim, offset: off } = normalizeLimitOffset(limit, offset);

      const out = await ClipsModel.list({
        search,
        limit: lim,
        offset: off,
        orderBy,
        orderDirection,
        isFeatured,
        viewerEmail,
      });

      res.json({ ok: true, ...out });
    } catch (err: any) {
      console.error("clips.list error:", err?.message || err);
      res.status(500).json({
        ok: false,
        error: "تعذّر جلب البيانات. الرجاء المحاولة لاحقًا.",
      });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const viewerEmail =
        (req.query.viewerEmail as string | undefined)?.trim()?.toLowerCase() ||
        null;

      const row = await ClipsModel.findById(id, { viewerEmail });

      if (!row)
        return res
          .status(404)
          .json({ ok: false, error: "لم يتم العثور على المقطع المطلوب." });

      res.json({ ok: true, data: row });
    } catch (err: any) {
      console.error("clips.findById error:", err?.message || err);
      res
        .status(500)
        .json({ ok: false, error: "لم يتم العثور على المقطع المطلوب." });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const hard = req.query.hard === "1" || req.query.hard === "true";

      if (hard) {
        await ClipsModel.hardDelete(id);
      } else {
        await ClipsModel.softDelete(id);
      }

      res.json({ ok: true });
    } catch (err: any) {
      console.error("clips.remove error:", err?.message || err);
      res.status(500).json({
        ok: false,
        error: "تعذّر حذف المقطع. الرجاء المحاولة لاحقًا.",
      });
    }
  },
  // ADD THIS method inside `export const ClipsController = { ... }`
  async findByEmail(req: Request, res: Response) {
    try {
      const email =
        (req.query.email as string | undefined)?.trim()?.toLowerCase() || "";

      if (!email) {
        return res
          .status(400)
          .json({ ok: false, error: "يجب إرسال البريد الإلكتروني." });
      }

      const limit = req.query.limit ? Number(req.query.limit) : 1; // default latest
      const orderBy =
        (req.query.orderBy as ClipFindOptions["orderBy"]) || "createdAt";
      const orderDirection = toOrderDir(
        req.query.orderDirection as string | undefined,
      );
      const withDeleted =
        req.query.withDeleted === "1" || req.query.withDeleted === "true";

      const out = await ClipsModel.findByEmail({
        email,
        limit,
        orderBy,
        orderDirection,
        withDeleted,
      });

      res.json({ ok: true, ...out });
    } catch (err: any) {
      console.error("clips.findByEmail error:", err?.message || err);
      res.status(500).json({
        ok: false,
        error: "تعذّر جلب البيانات. الرجاء المحاولة لاحقًا.",
      });
    }
  },
};

import type { Request, Response } from "express";
import multer from "multer";
import { ClipsModel } from "./clips.model";
import { normalizeLimitOffset, toOrderDir } from "../media.utils";
import type { ClipFindOptions } from "./clips.types";
import { clipsStorageUtil } from "./clips-storage.util";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendServerError,
} from "../../../middleware/response";

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
        return sendBadRequest(
          res,
          "يجب إرفاق ملف فيديو صالح للرفع."
        );

      if (!title)
        return sendBadRequest(res, "عنوان الفيديو مطلوب.");

      if (!trackStudentEmail) {
        return sendBadRequest(
          res,
          "يجب إرسال البريد الإلكتروني للطالب لإتمام العملية."
        );
      }

      const clipUrl = await clipsStorageUtil.uploadClip(file.buffer);

      const row = await ClipsModel.create({
        trackStudentEmail,
        title,
        clipUrl,
      });

      sendCreated(res, row);
    } catch (err: any) {
      console.error("createViaUpload error:", err?.message || err);
      sendServerError(
        res,
        "تعذّر رفع الفيديو. الرجاء المحاولة مرة أخرى لاحقًا."
      );
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

      sendSuccess(res, out);
    } catch (err: any) {
      console.error("clips.list error:", err?.message || err);
      sendServerError(
        res,
        "تعذّر جلب البيانات. الرجاء المحاولة لاحقًا."
      );
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
        return sendNotFound(
          res,
          "لم يتم العثور على المقطع المطلوب."
        );

      sendSuccess(res, row);
    } catch (err: any) {
      console.error("clips.findById error:", err?.message || err);
      sendServerError(
        res,
        "لم يتم العثور على المقطع المطلوب."
      );
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

      sendSuccess(res, { message: "Clip deleted successfully" });
    } catch (err: any) {
      console.error("clips.remove error:", err?.message || err);
      sendServerError(
        res,
        "تعذّر حذف المقطع. الرجاء المحاولة لاحقًا."
      );
    }
  },
  // ADD THIS method inside `export const ClipsController = { ... }`
  async findByEmail(req: Request, res: Response) {
    try {
      const email =
        (req.query.email as string | undefined)?.trim()?.toLowerCase() || "";

      if (!email) {
        return sendBadRequest(
          res,
          "يجب إرسال البريد الإلكتروني."
        );
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

      sendSuccess(res, out);
    } catch (err: any) {
      console.error("clips.findByEmail error:", err?.message || err);
      sendServerError(
        res,
        "تعذّر جلب البيانات. الرجاء المحاولة لاحقًا."
      );
    }
  },
};

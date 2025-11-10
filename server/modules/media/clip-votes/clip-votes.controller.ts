import type { Request, Response } from "express";
import { ClipVotesModel } from "./clip-votes.model";
import type { ClipVoteType } from "./clip-votes.types";

export const ClipVotesController = {
  async toggle(req: Request, res: Response) {
    try {
      const clipId = Number(req.params.id);

      const { trackStudentEmail, type } = (req.body ?? {}) as {
        trackStudentEmail?: string;
        type?: ClipVoteType;
      };

      if (!clipId)
        return res.status(400).json({
          ok: false,
          error: "لم يتم العثور على المقطع المطلوب أو المعرّف غير صالح.",
        });

      if (!trackStudentEmail) {
        return res.status(400).json({
          ok: false,
          error: "يجب إرسال البريد الإلكتروني لإتمام العملية.",
        });
      }

      if (!type || (type !== "heart" && type !== "laugh")) {
        return res.status(400).json({
          ok: false,
          error:
            "نوع التفاعل المرسل غير صحيح. القيم المسموحة هي heart أو laugh فقط.",
        });
      }

      const out = await ClipVotesModel.toggle({
        clipId,
        trackStudentEmail,
        type,
      });

      res.json({ ok: true, ...out });
    } catch (err: any) {
      console.error("clipVotes.toggle error: ", err?.message || err);
      res.status(500).json({
        ok: false,
        error: "حدث خطأ أثناء تسجيل التفاعل. الرجاء المحاولة مرة أخرى لاحقًا.",
      });
    }
  },

  async counts(req: Request, res: Response) {
    try {
      const clipId = Number(req.params.id);

      if (!clipId)
        return res
          .status(400)
          .json({
            ok: false,
            error: "لم يتم العثور على المقطع المطلوب أو المعرّف غير صالح.",
          });

      const counts = await ClipVotesModel.getCounts(clipId);

      res.json({ ok: true, ...counts });
    } catch (err: any) {
      console.error("clipVotes.counts error:", err?.message || err);
      res.status(500).json({
        ok: false,
        error:
          "حدث خطأ أثناء جلب عدد التفاعلات. الرجاء المحاولة مرة أخرى لاحقًا.",
      });
    }
  },
};

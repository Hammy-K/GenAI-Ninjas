import { db } from "server/db";
import { and, eq, sql } from "drizzle-orm";
import { clipVotes } from "./clip-votes.schema";
import { getIsProd } from "../media.utils";
import type {
  ToggleVoteInput,
  ToggleVoteResult,
  ClipCounts,
} from "./clip-votes.types";
import { clips } from "../clips/clips.schema";

export const ClipVotesModel = {
  async toggle(input: ToggleVoteInput): Promise<ToggleVoteResult> {
    const isProd = getIsProd();

    const [clip] = await db
      .select({ id: clips.id })
      .from(clips)
      .where(and(eq(clips.id, input.clipId), eq(clips.isProd, isProd)))
      .limit(1);

    if (!clip) throw new Error("Clip not found in current environment");

    const inserted = await db
      .insert(clipVotes)
      .values({
        isProd,
        clipId: input.clipId,
        trackStudentEmail: input.trackStudentEmail,
        type: input.type,
      })
      .onConflictDoNothing({
        target: [
          clipVotes.isProd,
          clipVotes.clipId,
          clipVotes.trackStudentEmail,
          clipVotes.type,
        ],
      })
      .returning({ id: clipVotes.id });

    if (inserted.length === 0) {
      await db
        .delete(clipVotes)
        .where(
          and(
            eq(clipVotes.isProd, isProd),
            eq(clipVotes.clipId, input.clipId),
            eq(clipVotes.trackStudentEmail, input.trackStudentEmail),
            eq(clipVotes.type, input.type),
          ),
        );

      const counts = await this.getCounts(input.clipId, isProd);

      return { action: "removed", ...counts };
    }

    const counts = await this.getCounts(input.clipId, isProd);

    return { action: "added", ...counts };
  },

  async getCounts(clipId: number, isProd = getIsProd()): Promise<ClipCounts> {
    const rows = await db.execute(sql`
      SELECT
        COALESCE(rc."heartCount", 0)::int AS "heartCount",
        COALESCE(rc."laughCount", 0)::int AS "laughCount"
      FROM clip_reaction_counts rc
      WHERE rc."clipId" = ${clipId} AND rc."isProd" = ${isProd}
      LIMIT 1;
    `);

    const row = (rows as any)[0];

    return {
      heartCount: row?.heartCount ?? 0,
      laughCount: row?.laughCount ?? 0,
    };
  },
};

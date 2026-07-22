import { useEffect } from "react";
import { motion, MotionConfig } from "framer-motion";
import { CheckCircle2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { DUR, EASE_OUT } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";

/**
 * MissionComplete — the session loop's close.
 *
 * Every mission ends here rather than dumping the learner onto the dashboard with
 * no transition (GAMIFIED_UX §1). It answers the four things a completion screen
 * must: what was made, XP earned (counting up, not swapping — §5), what's next, and
 * one primary action back into the journey (§2 one-primary-action).
 *
 * Motion comes only from lib/motion.ts tokens. Reduced motion is respected via
 * `MotionConfig reducedMotion="user"` (transforms drop to cross-fades) and the
 * count-up snapping to its final value. Vertical (y) reveal is used throughout so
 * there is no RTL sign to get wrong.
 */

interface MissionCompleteProps {
  /** The mission just finished, in the same words the learner started it with. */
  missionTitle: string;
  /** XP earned this session. Counts up from 0. The block hides when 0. */
  xpEarned: number;
  /** Optional one-line description of what was made. */
  summary?: string;
  /** Link to the thing the learner just made (opens in a new tab). */
  viewUrl?: string | null;
  /** Label for the view-your-work link. */
  viewLabel?: string;
  /** One line pointing at what's next in the journey. */
  nextHint?: string;
  /** Label for the primary action. Says what happens. */
  continueLabel?: string;
  /** The one primary action — back into the journey. */
  onContinue: () => void;
}

/** Staggered rise-in — items land ~100ms apart so they read as a sequence (§4). */
function rise(index: number) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.standard, ease: EASE_OUT, delay: index * DUR.instant },
  };
}

export default function MissionComplete({
  missionTitle,
  xpEarned,
  summary,
  viewUrl,
  viewLabel = "افتح ما صنعت",
  nextHint,
  continueLabel = "الرجوع إلى الرحلة",
  onContinue,
}: MissionCompleteProps) {
  // Mission complete is the "small" celebration tier (§5): a summary moment, not a
  // full-screen interruption. celebrate() self-gates prefers-reduced-motion.
  useEffect(() => {
    celebrate("small");
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-tajawal p-6 text-center"
      >
        <div className="w-full max-w-md flex flex-col items-center gap-5">
          <motion.div {...rise(0)}>
            <CheckCircle2 className="w-20 h-20 text-primary" strokeWidth={1.5} />
          </motion.div>

          <motion.div {...rise(1)} className="space-y-1">
            <p className="text-sm text-muted-foreground">أحسنت! أكملت المهمة</p>
            <h1 className="text-2xl font-bold">{missionTitle}</h1>
          </motion.div>

          {xpEarned > 0 && (
            <motion.div
              {...rise(2)}
              className="flex flex-col items-center gap-1"
              aria-label={`ربحت ${xpEarned} نقطة خبرة`}
            >
              <AnimatedNumber
                value={xpEarned}
                animateOnMount
                from={0}
                format={(n) => `+${n}`}
                className="text-4xl font-bold text-primary"
              />
              <span className="text-sm text-muted-foreground">نقطة خبرة</span>
            </motion.div>
          )}

          {summary && (
            <motion.p {...rise(3)} className="text-base text-muted-foreground">
              {summary}
            </motion.p>
          )}

          {viewUrl && (
            <motion.div {...rise(4)} className="w-full">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(viewUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                {viewLabel}
              </Button>
            </motion.div>
          )}

          {nextHint && (
            <motion.p {...rise(5)} className="text-sm text-muted-foreground">
              {nextHint}
            </motion.p>
          )}

          <motion.div {...rise(6)} className="w-full pt-2">
            <Button className="w-full gap-2" onClick={onContinue}>
              {continueLabel}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}

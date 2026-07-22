import { Button } from "@/components/ui/button";
import { LovableButton } from "../ui/LovableButton";
import { ResetProjectControl } from "../ui/ResetProjectControl";
import { ProgressDisplay } from "./ProgressDisplay";
import { LABELS } from "../constants";
import { RotateCcw, Upload, FolderOpen } from "lucide-react";
import { AccountCard } from "./AccountCard";

interface FloatingActionsPanelProps {
  progress: any;
  promptLink?: string;
  onOpenLovable: () => void;
  onReset: () => void;
  onSubmitProject: () => void;
  onViewSubmissions: () => void;
  resetLabel: string;
  submitLabel: string;
}

export function FloatingActionsPanel({
  progress,
  promptLink,
  onOpenLovable,
  onReset,
  onSubmitProject,
  onViewSubmissions,
}: FloatingActionsPanelProps) {
  return (
    <aside
      className="w-80 bg-background border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-6 sticky top-6"
      aria-label="لوحة الإجراءات والتقدم"
    >
      {/* Progress */}
      <section aria-labelledby="progress-title">
        <h2
          id="progress-title"
          className="text-lg font-semibold text-foreground mb-3 text-center"
        >
          خطوات المشروع
        </h2>
        <ProgressDisplay progress={progress} />
      </section>

      {/* Quick actions */}
      <section
        aria-labelledby="quick-actions-title"
        className="pt-4 border-t border-gray-100"
      >
        <h2
          id="quick-actions-title"
          className="text-sm font-semibold text-foreground mb-3 text-center"
        >
          اطلع بفكرتك مع بنجي و بعدين:
        </h2>
        <div className="grid gap-2">
          <LovableButton
            promptLink={promptLink}
            onOpen={onOpenLovable}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          />
        </div>
      </section>

      {/* Submission */}
      {/* <section
        aria-labelledby="submission-title"
        className="pt-4 border-t border-gray-100"
      > */}
      {/* <h2
          id="submission-title"
          className="text-sm font-semibold text-foreground mb-3 text-center"
        >
          سلم مشروعك
        </h2> */}

      {/* <div className="grid gap-2"> */}
      {/* <Button
            type="button"
            onClick={onSubmitProject}
            className="w-full gap-2 bg-primary hover:bg-primary text-white"
          >
            <Upload className="w-4 h-4" />
            {LABELS.submitProject}
          </Button> */}

      {/* <Button
            type="button"
            variant="outline"
            onClick={onViewSubmissions}
            className="w-full gap-2 text-foreground border-border bg-card hover:text-white"
          >
            <FolderOpen className="w-4 h-4" />
            عرض المشاريع
          </Button>
        </div>
      </section> */}

      <section
        aria-labelledby="restart"
        className="pt-4 border-t border-gray-100"
      >
        <ResetProjectControl onReset={onReset} label={LABELS.restart} />
      </section>

      <AccountCard />
    </aside>
  );
}

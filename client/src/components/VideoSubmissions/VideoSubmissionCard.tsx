import { ExternalLink, GraduationCap, School, Calendar } from "lucide-react";

type VideoSubmission = {
  id: number;
  projectName: string;
  link: string;
  submittedAt: string;
  studentName: string;
  grade: string;
  school: string;
};

type Props = { 
  submission: VideoSubmission;
};

export default function VideoSubmissionCard({ submission }: Props) {
  const openProject = () => {
    window.open(submission.link, "_blank", "noopener,noreferrer");
  };

  const onKeyActivate: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProject();
    }
  };

  // Format the submission date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProject}
      onKeyDown={onKeyActivate}
      className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer border border-gray-200"
      aria-label={`فتح مشروع: ${submission.projectName}`}
      data-testid={`video-card-${submission.id}`}
    >
      {/* Header with project name and external link icon */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800 truncate flex-1" data-testid={`project-name-${submission.id}`}>
            {submission.projectName}
          </h3>
          <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
        </div>
      </div>

      {/* Student information */}
      <div className="p-4 space-y-3">
        {/* Student name */}
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-green-600" />
          <span className="font-medium text-gray-800" data-testid={`student-name-${submission.id}`}>
            {submission.studentName}
          </span>
        </div>

        {/* Grade */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">📚</span>
          </div>
          <span className="text-gray-600" data-testid={`grade-${submission.id}`}>
            {submission.grade}
          </span>
        </div>

        {/* School */}
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-purple-600" />
          <span className="text-gray-600" data-testid={`school-${submission.id}`}>
            {submission.school}
          </span>
        </div>

        {/* Submission date */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500" data-testid={`date-${submission.id}`}>
            {formatDate(submission.submittedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
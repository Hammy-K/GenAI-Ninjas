import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoSubmissionCard from "./VideoSubmissionCard";
import { FolderOpen } from "lucide-react";

type VideoSubmission = {
  id: number;
  projectName: string;
  link: string;
  submittedAt: string;
  studentName: string;
  grade: string;
  school: string;
};

async function fetchVideoSubmissions(): Promise<VideoSubmission[]> {
  const response = await fetch('/api/video-submissions/gallery');
  if (!response.ok) {
    throw new Error('Failed to fetch video submissions');
  }
  return response.json();
}

export default function VideoSubmissionsList() {
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['video-submissions'],
    queryFn: fetchVideoSubmissions
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2">جار التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">حدث خطأ في تحميل المشاريع</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا توجد مشاريع فيديو متاحة حاليا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <VideoSubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </div>
  );
}
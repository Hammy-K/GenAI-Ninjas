import VideoSubmissionsList from "@/components/VideoSubmissions/VideoSubmissionsList";

export default function VideoSubmissionsPage() {
  return (
    <div
      className="px-48 mx-auto bg-background text-foreground font-tajawal"
      dir="rtl"
    >
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center mb-2">📹 مشاريع الفيديو</h1>
        <p className="text-lg text-center text-muted-foreground mb-8">
          استعرض مشاريع الفيديو المقدمة من الطلاب
        </p>
      </div>
      
      <VideoSubmissionsList />
    </div>
  );
}
export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="h-5 w-40 bg-gray-200 rounded" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-8 w-[220px] bg-gray-200 rounded" />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
        >
          <div className="h-10 w-2/3 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

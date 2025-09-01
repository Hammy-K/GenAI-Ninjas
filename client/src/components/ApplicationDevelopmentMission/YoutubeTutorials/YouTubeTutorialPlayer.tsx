type Props = {
  videoId: string;
  title?: string;
  className?: string;
};

export default function YouTubeTutorialPlayer({
  videoId,
  title = "Tutorial",
  className,
}: Props) {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <div
      className={`w-full aspect-video rounded-xl overflow-hidden shadow ${className ?? ""}`}
    >
      <iframe
        title={title}
        src={src}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="w-full h-full border-0"
      />
    </div>
  );
}

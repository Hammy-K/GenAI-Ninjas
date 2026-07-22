type Props = {
  error: string;
  onRetry: () => void;
  onEdit: () => void;
};

export function ErrorView({ error, onRetry, onEdit }: Props) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-right text-sm text-red-800">{error}</p>

      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={onEdit}
          className="rounded-md border border-border px-3 py-2 bg-white text-sm"
        >
          تعديل البرومبت
        </button>

        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 text-white px-3 py-2 text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

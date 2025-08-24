import { useMutation } from "@tanstack/react-query";

export type TrainingFormPayload = {
  schoolId?: number | null;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  city?: string;
  note?: string;
};

async function submitTrainingInterest(payload: TrainingFormPayload) {
  const res = await fetch("/api/genai-school-training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(err?.message || "تعذر إرسال النموذج");
  }

  return res.json();
}

export function useGenaiTrainingSubmit() {
  return useMutation({ mutationFn: submitTrainingInterest });
}

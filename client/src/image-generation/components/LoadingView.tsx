import { motion } from "framer-motion";

export function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 rounded-full border-4 border-t-purple-600 border-gray-200"
      />

      <p className="mt-4 text-center text-sm text-gray-700" aria-live="polite">
        جاري توليد الصورة — قد يستغرق الأمر بضع ثوانٍ إلى دقيقة. شكراً لصبرك!
      </p>
    </div>
  );
}

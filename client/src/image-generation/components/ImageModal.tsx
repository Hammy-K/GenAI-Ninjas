import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  src: string | null;
  onClose: () => void;
};

export function ImageModal({ open, src, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [display, setDisplay] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !src) {
      setNatural(null);
      setDisplay(null);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setNatural({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => {
      setNatural(null);
      setDisplay(null);
    };
  }, [open, src]);

  useEffect(() => {
    if (!natural) return;
    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0,
    );
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
    );
    const maxW = vw * 0.9;
    const maxH = vh * 0.9;
    const scale = Math.min(1, maxW / natural.w, maxH / natural.h);
    const w = Math.round(natural.w * scale);
    const h = Math.round(natural.h * scale);
    setDisplay({ w, h });
  }, [natural]);

  if (!open || !src) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) => {
        // Close when click is outside the modal content
        const target = e.target as Node | null;
        if (modalRef.current && target && !modalRef.current.contains(target)) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        ref={modalRef}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        style={{
          width: display ? `${display.w}px` : "min(90vw, 1200px)",
          height: display ? `${display.h}px` : "min(90vh, 800px)",
        }}
        className="relative rounded-md overflow-hidden shadow-xl z-10 bg-transparent"
        onMouseDown={(e) => {
          // keep clicks inside modal from bubbling to backdrop handler
          e.stopPropagation();
        }}
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-1 shadow"
        >
          <X size={18} />
        </button>

        <div className="w-full h-full flex items-center justify-center bg-transparent">
          <img
            src={src}
            alt="enlarged"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

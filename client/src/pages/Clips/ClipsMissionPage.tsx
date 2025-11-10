import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileVideo,
  X,
  Database,
  Loader2,
} from "lucide-react";
import { useUploadClip } from "./useUploadClip";
import { useGoogleAuth } from "@/google-auth/useGoogleAuth";
import { Button } from "@/components/ui/button";
import GoogleLogo from "@/assets/google-logo.png";
import ClipsHeaderLogos from "./clips-submissions/components/ClipsHeaderLogos";
import { useMyLatestClip } from "./clips-submissions/clips.hooks";

const schema = z.object({
  title: z
    .string({ required_error: "العنوان مطلوب" })
    .trim()
    .min(2, "الحد الأدنى لحروف العنوان 2"),
  file: z
    .custom<File>((v) => v instanceof File && v.size > 0, {
      message: "الرجاء اختيار ملف الفيديو",
    })
    .refine((file) => {
      if (!(file instanceof File)) return false;
      const allowed = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-m4v",
      ];
      return allowed.includes(file.type || "video/mp4");
    }, "صيغة الفيديو المسموحة: mp4 / webm / mov / m4v")
    .refine((file) => {
      if (!(file instanceof File)) return false;
      const MAX = 200 * 1024 * 1024; // 200MB
      return file.size <= MAX;
    }, "حجم الفيديو يجب ألا يتجاوز 200MB"),
});

type FormValues = z.infer<typeof schema>;

const LOADING_MESSAGES = [
  "جارٍ رفع الفيديو… حضّر البوبكورن 🍿",
  "نفحص الملف… الجودة مهمة 🎬",
  "نرسل للسحابة… تقريبًا خلّصنا ☁️",
  "نلمّع المعرض… وُش بيطلع اليوم؟ ✨",
];

function LoadingSubmitButton({ isPending }: { isPending: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setIdx(0);
      return;
    }
    const id = setInterval(
      () => setIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      1600,
    );
    return () => clearInterval(id);
  }, [isPending]);

  const label = isPending ? LOADING_MESSAGES[idx] : "رفع الفيديو";

  return (
    <button
      type="submit"
      className={`w-full px-6 py-2.5 rounded-md font-medium text-white transition
        bg-purple-600 hover:bg-purple-700 ${isPending ? "opacity-80" : ""}`}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

export default function ClipsMissionPage() {
  const { email, loading: authLoading, signInWithGoogle } = useGoogleAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", file: undefined as any },
    mode: "onBlur",
  });

  const {
    mutateAsync: uploadClip,
    isPending,
    data,
    isSuccess,
    isError,
  } = useUploadClip();

  // Decide: banner or form
  const {
    data: myClip,
    isLoading: mineLoading,
    isError: mineError,
  } = useMyLatestClip(email);

  // showForm = true → render the form; false → render the green banner
  const [showForm, setShowForm] = useState(false);

  // Once we know the “previous clip” state, choose initial view:
  // - if previous exists → show banner
  // - if none or error → show form
  useEffect(() => {
    if (authLoading || !email) return;
    if (mineLoading) return; // wait until it resolves
    const hasPrev = !!myClip && !mineError;
    setShowForm(!hasPrev);
  }, [authLoading, email, mineLoading, myClip, mineError]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await uploadClip({
      title: values.title.trim(),
      trackStudentEmail: email ?? "",
      file: values.file!,
    });

    if (res.ok) {
      reset({ title: "", file: undefined as any });
      // After successful submit you can keep showing the form,
      // or switch back to banner by refetching and letting the effect run.
      // Up to you—keeping form feels smoother.
    }
  });

  const file = watch("file");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-gray-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري التحميل…
        </span>
      </div>
    );
  }

  if (!email) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#f5f2e8] flex items-center justify-center px-4"
      >
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl shadow-sm bg-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M15 10.5V7a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H13a2 2 0 0 0 2-2v-3.5l5 3.5V7l-5 3.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحبًا بك في مهمة المقاطع
                </h1>
                <p className="mt-1 text-gray-600 text-sm">
                  سجّل دخولك للمتابعة ورفع مقطعك أو التصويت في المعرض.
                </p>
              </div>

              <Button
                onClick={signInWithGoogle}
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 transition"
              >
                <img
                  src={GoogleLogo}
                  alt="Google logo"
                  className="h-5 w-5"
                  loading="lazy"
                  decoding="async"
                />
                <span className="text-lg">تسجيل الدخول بواسطة Google</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function goToSubmissions() {
    window.location.assign("/missions/clips/submissions");
  }

  function triggerResubmit() {
    setShowForm(true); // swap from banner → form
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  // While we’re deciding (myClip loading), show a neutral spinner instead of banner/form
  if (mineLoading) {
    return (
      <div dir="rtl" className="min-h-screen font-tajawal bg-[#f5f2e8]">
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="py-8">
            <ClipsHeaderLogos />
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-8 mt-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 text-gray-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التحميل…
            </span>
          </div>
        </div>
      </div>
    );
  }

  const showBanner = !mineError && !!myClip && !showForm;

  return (
    <div dir="rtl" className="min-h-screen font-tajawal bg-[#f5f2e8]">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="py-8">
          <ClipsHeaderLogos />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 mt-0">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex sm:justify-start justify-center">
              <Button
                variant="default"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                onClick={goToSubmissions}
              >
                <Database className="h-4 w-4" />
                <span>عرض جميع المقاطع</span>
              </Button>
            </div>

            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                رفع فيديو المهمة 🎥
              </h1>
              <p className="text-gray-600">
                ارفع الفيديو بعنوانه لعرضه في المعرض
              </p>
            </div>
          </div>

          {/* Either green banner or the form */}
          {showBanner ? (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between gap-3">
              <div className="truncate">
                تم تسليم مقطع سابق بعنوان{" "}
                <strong className="truncate">{myClip!.title}</strong>
              </div>
              <div className="flex-shrink-0">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={triggerResubmit}
                >
                  إرسال مرة أخرى
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Success / Error of upload */}
              {isSuccess && (data?.ok ?? false) && (
                <div className="mb-4 p-2 rounded-md bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم رفع الفيديو بنجاح.</span>
                </div>
              )}
              {isError || (data && !data.ok) ? (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>
                    {isError
                      ? "حدث خطأ أثناء الرفع. حاول مرة أخرى."
                      : "فشل الرفع: " + (data as any)?.error}
                  </span>
                </div>
              ) : null}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان الفيديو
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: مشروعي النهائي"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملف الفيديو
                  </label>

                  {!file ? (
                    <label className="w-full h-32 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center text-center">
                      <div className="flex flex-col items-center gap-2 px-4">
                        <UploadCloud className="w-6 h-6 text-gray-500" />
                        <div className="text-sm text-gray-700 font-medium">
                          اضغط هنا لاختيار ملف الفيديو
                        </div>
                        <div className="text-xs text-gray-500">
                          mp4 / webm / mov / m4v — حتى 200MB
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setValue("file", f, { shouldValidate: true });
                        }}
                      />
                    </label>
                  ) : (
                    <div className="w-full h-36 rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileVideo className="w-6 h-6 text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setValue("file", undefined as any, {
                            shouldValidate: true,
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                      >
                        <X className="w-4 h-4" />
                        إزالة الملف
                      </button>
                    </div>
                  )}

                  {errors.file && (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.file.message as string}
                    </p>
                  )}
                </div>

                <div className="w-full flex justify-center">
                  <div className="w-full max-w-xs">
                    <LoadingSubmitButton isPending={isPending} />
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   CheckCircle2,
//   AlertCircle,
//   UploadCloud,
//   FileVideo,
//   X,
//   Database,
// } from "lucide-react";
// import { useUploadClip } from "./useUploadClip";
// import { useGoogleAuth } from "@/google-auth/useGoogleAuth";
// import { Button } from "@/components/ui/button";
// import GoogleLogo from "@/assets/google-logo.png";
// import ClipsHeaderLogos from "./clips-submissions/components/ClipsHeaderLogos";

// const schema = z.object({
//   title: z
//     .string({ required_error: "العنوان مطلوب" })
//     .trim()
//     .min(2, "الحد الأدنى لحروف العنوان 2"),
//   file: z
//     .custom<File>((v) => v instanceof File && v.size > 0, {
//       message: "الرجاء اختيار ملف الفيديو",
//     })
//     .refine((file) => {
//       if (!(file instanceof File)) return false;
//       const allowed = [
//         "video/mp4",
//         "video/webm",
//         "video/quicktime",
//         "video/x-m4v",
//       ];
//       return allowed.includes(file.type || "video/mp4");
//     }, "صيغة الفيديو المسموحة: mp4 / webm / mov / m4v")
//     .refine((file) => {
//       if (!(file instanceof File)) return false;
//       const MAX = 200 * 1024 * 1024; // 200MB
//       return file.size <= MAX;
//     }, "حجم الفيديو يجب ألا يتجاوز 200MB"),
// });

// type FormValues = z.infer<typeof schema>;

// const LOADING_MESSAGES = [
//   "جارٍ رفع الفيديو… حضّر البوبكورن 🍿",
//   "نفحص الملف… الجودة مهمة 🎬",
//   "نرسل للسحابة… تقريبًا خلّصنا ☁️",
//   "نلمّع المعرض… وُش بيطلع اليوم؟ ✨",
// ];

// function LoadingSubmitButton({ isPending }: { isPending: boolean }) {
//   const [idx, setIdx] = useState(0);

//   useEffect(() => {
//     if (!isPending) {
//       setIdx(0);
//       return;
//     }
//     const id = setInterval(
//       () => setIdx((i) => (i + 1) % LOADING_MESSAGES.length),
//       1600,
//     );
//     return () => clearInterval(id);
//   }, [isPending]);

//   const label = isPending ? LOADING_MESSAGES[idx] : "رفع الفيديو";

//   return (
//     <button
//       type="submit"
//       className={`w-full px-6 py-2.5 rounded-md font-medium text-white transition
//         bg-purple-600 hover:bg-purple-700 ${isPending ? "opacity-80" : ""}`}
//     >
//       {label}
//     </button>
//   );
// }

// export default function ClipsMissionPage() {
//   const { email, loading: authLoading, signInWithGoogle } = useGoogleAuth();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch,
//   } = useForm<FormValues>({
//     resolver: zodResolver(schema),
//     defaultValues: { title: "", file: undefined as any },
//     mode: "onBlur",
//   });

//   const {
//     mutateAsync: uploadClip,
//     isPending,
//     data,
//     isSuccess,
//     isError,
//   } = useUploadClip();

//   const onSubmit = handleSubmit(async (values) => {
//     const res = await uploadClip({
//       title: values.title.trim(),
//       trackStudentEmail: email ?? "",
//       file: values.file!,
//     });

//     if (res.ok) {
//       reset({ title: "", file: undefined as any });
//     }
//   });

//   const file = watch("file");

//   if (authLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         جاري التحميل…
//       </div>
//     );
//   }

//   if (!email) {
//     return (
//       <div
//         dir="rtl"
//         className="min-h-screen bg-[#f5f2e8] flex items-center justify-center px-4"
//       >
//         <div className="w-full max-w-md">
//           <div className="overflow-hidden rounded-2xl shadow-sm bg-white">
//             <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />
//             <div className="p-6 sm:p-8">
//               <div className="text-center mb-6">
//                 <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
//                   {/* simple camera/play glyph */}
//                   <svg
//                     className="h-6 w-6 text-purple-600"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                   >
//                     <path
//                       d="M15 10.5V7a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H13a2 2 0 0 0 2-2v-3.5l5 3.5V7l-5 3.5Z"
//                       stroke="currentColor"
//                       strokeWidth="1.5"
//                     />
//                   </svg>
//                 </div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   مرحبًا بك في مهمة المقاطع
//                 </h1>
//                 <p className="mt-1 text-gray-600 text-sm">
//                   سجّل دخولك للمتابعة ورفع مقطعك أو التصويت في المعرض.
//                 </p>
//               </div>

//               <Button
//                 onClick={signInWithGoogle}
//                 className="w-full inline-flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 transition"
//               >
//                 <img
//                   src={GoogleLogo}
//                   alt="Google logo"
//                   className="h-5 w-5"
//                   loading="lazy"
//                   decoding="async"
//                 />
//                 <span className="text-lg">تسجيل الدخول بواسطة Google</span>
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   function goToSubmissions() {
//     window.location.assign("/missions/clips/submissions");
//   }

//   return (
//     <div dir="rtl" className="min-h-screen font-tajawal bg-[#f5f2e8]">
//       <div className="max-w-2xl mx-auto px-4 pb-8">
//         <div className="py-8">
//           <ClipsHeaderLogos />
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 mt-0">
//           <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//             <div className="flex sm:justify-start justify-center">
//               <Button
//                 variant="default"
//                 className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
//                 onClick={goToSubmissions}
//               >
//                 <Database className="h-4 w-4" />
//                 <span>عرض جميع المقاطع</span>
//               </Button>
//             </div>

//             <div className="text-right">
//               <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
//                 رفع فيديو المهمة 🎥
//               </h1>
//               <p className="text-gray-600">
//                 ارفع الفيديو بعنوانه لعرضه في المعرض
//               </p>
//             </div>
//           </div>

//           {isSuccess && (data?.ok ?? false) && (
//             <div className="mb-4 p-2 rounded-md bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
//               <CheckCircle2 className="w-5 h-5" />
//               <span>تم رفع الفيديو بنجاح! 👏</span>
//             </div>
//           )}
//           {isError || (data && !data.ok) ? (
//             <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
//               <AlertCircle className="w-5 h-5" />
//               <span>
//                 {isError
//                   ? "حدث خطأ أثناء الرفع. حاول مرة أخرى."
//                   : "فشل الرفع: " + (data as any)?.error}
//               </span>
//             </div>
//           ) : null}

//           <form onSubmit={onSubmit} className="space-y-5">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 عنوان الفيديو
//               </label>
//               <input
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 placeholder="مثال: مشروعي النهائي"
//                 {...register("title")}
//               />
//               {errors.title && (
//                 <p className="mt-1 text-xs text-red-600">
//                   {errors.title.message}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 ملف الفيديو
//               </label>

//               {!file ? (
//                 <label className="w-full h-32 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center text-center">
//                   <div className="flex flex-col items-center gap-2 px-4">
//                     <UploadCloud className="w-6 h-6 text-gray-500" />
//                     <div className="text-sm text-gray-700 font-medium">
//                       اضغط هنا لاختيار ملف الفيديو
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       mp4 / webm / mov / m4v — حتى 200MB
//                     </div>
//                   </div>
//                   <input
//                     type="file"
//                     accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
//                     className="hidden"
//                     onChange={(e) => {
//                       const f = e.target.files?.[0];
//                       if (f) setValue("file", f, { shouldValidate: true });
//                     }}
//                   />
//                 </label>
//               ) : (
//                 <div className="w-full h-36 rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
//                   <div className="flex items-center gap-3 min-w-0">
//                     <FileVideo className="w-6 h-6 text-purple-600 shrink-0" />
//                     <div className="min-w-0">
//                       <div className="text-sm font-medium text-gray-800 truncate">
//                         {file.name}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {(file.size / (1024 * 1024)).toFixed(1)} MB
//                       </div>
//                     </div>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setValue("file", undefined as any, {
//                         shouldValidate: true,
//                       })
//                     }
//                     className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
//                   >
//                     <X className="w-4 h-4" />
//                     إزالة الملف
//                   </button>
//                 </div>
//               )}

//               {errors.file && (
//                 <p className="mt-2 text-xs text-red-600">
//                   {errors.file.message as string}
//                 </p>
//               )}
//             </div>

//             <div className="w-full flex justify-center">
//               <div className="w-full max-w-xs">
//                 <LoadingSubmitButton isPending={isPending} />
//               </div>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

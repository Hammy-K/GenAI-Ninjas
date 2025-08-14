// export default function DiscoveryMission() {
//   const { xp } = useQuest();

//   const session1Flow = [
//     "عرض مباشر/تقديم — أظهر مثالاً في 5-10 دقائق",
//     "الطلاب يطرحون فكرة تطبيقهم (5 دقائق)",
//     "استخدام الذكاء الاصطناعي للبناء ← اختبار ← تعديل الألوان والنصوص والصور (20-25 دقيقة)",
//     "مشاركة سريعة مع الأقران، التسليم، والتصويت (5 دقائق)",
//     "[ديسكورد] احتفال بالمشاركات والفائزين على ديسكورد في المساء"
//   ];

//   const session2Flow = [
//     "الموجز والمثال (5 دقائق)",
//     "عصف ذهني للأزواج (5 دقائق)",
//     "البناء والاختبار (25 دقيقة)",
//     "عروض سريعة — اعرض أول 10 تطبيقات مرسلة (10 دقائق)",
//     "[ديسكورد] احتفال بالمشاركات والفائزين على ديسكورد في المساء"
//   ];

//   const session1Themes = [
//     "مولد الأسماء المضحكة — أدخل اسمك ← احصل على اسم مضحك",
//     "خبير النصائح — أدخل مشكلتك ← احصل على نصيحة حكيمة",
//     "محول المزاج — أدخل مزاجك ← احصل على لون/موسيقى",
//     "مولد التشجيع — أدخل اسمك ← احصل على رسالة تحفيزية"
//   ];

//   const session2Themes = [
//     "مخطط الإجازة الحالمة — أدخل الموقع + الميزانية ← احصل على خطة",
//     "مولد الأشرار — أدخل الاسم + الوجبة الخفيفة المفضلة ← احصل على سيرة الشرير",
//     "مطابق الحيوانات الأليفة — أدخل الاسم + المزاج ← احصل على صورة حيوان"
//   ];

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: '#f5f2e8' }}>
//       <Header xp={xp} />

//       <div className="max-w-4xl mx-auto px-6 py-12">
//         {/* Back Button */}
//         <button 
//           onClick={() => window.history.back()}
//           className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           العودة إلى مهام تطوير التطبيقات
//         </button>

//         {/* Hero Section */}
//         <div className="text-center mb-12">
//           <div className="flex justify-center items-center gap-3 mb-6">
//             <div className="p-3 bg-green-100 rounded-full">
//               <Lightbulb className="w-8 h-8 text-green-600" />
//             </div>
//             <h1 className="text-4xl font-bold text-gray-800">مرحلة الاكتشاف</h1>
//             <span className="text-2xl">🚀</span>
//           </div>

//           <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
//             <strong>أعط كل طالب لحظة فورية من "لقد صنعت هذا!"</strong><br />
//             ابدأ رحلتك في بناء التطبيقات مع تحديات ممتعة وسريعة تعطيك الثقة والإثارة للمتابعة.
//           </p>

//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
//             <Clock className="w-4 h-4" />
//             <span>الأسبوع الثاني - جلستان</span>
//           </div>
//         </div>

//         {/* Sessions Grid */}
//         <div className="space-y-8">
//           {/* Session 1 */}
//           <div>
//             <SessionCard
//               icon={Code}
//               title="الجلسة الأولى — تطبيقك الأول"
//               goal="أعط كل طالب لحظة فورية من 'لقد صنعت هذا!'"
//               concept="مدخل واحد ← مخرج ممتع بنقرة واحدة"
//               flow={session1Flow}
//               duration="45"
//               color="#10B981"
//             />
//             <div className="mt-4">
//               <ExampleThemes themes={session1Themes} />
//             </div>

//             {/* Engagement Booster */}
//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <Trophy className="w-5 h-5 text-yellow-600" />
//                 <h4 className="font-semibold text-yellow-800">محفز الإشراك:</h4>
//               </div>
//               <p className="text-yellow-700">الفائزون يحصلون على XP إضافية وشارات</p>
//               <p className="text-sm text-yellow-600 mt-1">
//                 <em>الأكثر إبداعاً، الأكثر فائدة، الأكثر متعة</em>
//               </p>
//             </div>
//           </div>

//           {/* Session 2 */}
//           <div>
//             <SessionCard
//               icon={Users}
//               title="الجلسة الثانية — هاكاثون مصغر (أزواج)"
//               goal="بناء شيء معاً، أكثر تعقيداً قليلاً من الجلسة الأولى"
//               concept="مدخلات متعددة + مخرج منسق (يمكن خلط النص والصور)"
//               flow={session2Flow}
//               duration="45"
//               color="#3B82F6"
//             />
//             <div className="mt-4">
//               <ExampleThemes themes={session2Themes} />
//             </div>

//             {/* Challenge Brief */}
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <Target className="w-5 h-5 text-blue-600" />
//                 <h4 className="font-semibold text-blue-800">موجز التحدي:</h4>
//               </div>
//               <p className="text-blue-700">
//                 "في أزواج، اصنعوا تطبيقاً يأخذ على الأقل مدخلين مختلفين من المستخدم 
//                 وينشئ شيئاً مضحكاً أو مفيداً أو مفاجئاً."
//               </p>
//             </div>

//             {/* Engagement Booster */}
//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <Trophy className="w-5 h-5 text-yellow-600" />
//                 <h4 className="font-semibold text-yellow-800">محفز الإشراك:</h4>
//               </div>
//               <p className="text-yellow-700">الفائزون يحصلون على XP إضافية وشارات</p>
//               <p className="text-sm text-yellow-600 mt-1">
//                 <em>الأكثر إبداعاً، الأكثر فائدة، الأكثر متعة</em>
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Key Takeaways */}
//         <div className="mt-12 bg-white rounded-xl p-8 shadow-md">
//           <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">النقاط الرئيسية من مرحلة الاكتشاف</h2>
//           <div className="grid md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-green-600">ما ستتعلمه:</h3>
//               <ul className="space-y-2 text-gray-600">
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   كيفية تحويل فكرة بسيطة إلى تطبيق يعمل
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   استخدام الذكاء الاصطناعي لبناء التطبيقات
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   اختبار وتحسين تطبيقك
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   العمل بروح الفريق
//                 </li>
//               </ul>
//             </div>
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-blue-600">المهارات المكتسبة:</h3>
//               <ul className="space-y-2 text-gray-600">
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                   التفكير الإبداعي في حل المشاكل
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                   أساسيات تفاعل المستخدم
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                   سرعة النماذج الأولية
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                   تقديم المشاريع بثقة
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
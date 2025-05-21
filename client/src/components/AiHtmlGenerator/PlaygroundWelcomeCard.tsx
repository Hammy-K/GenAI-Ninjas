export const PlaygroundWelcomeCard = (
  <div className="flex flex-col items-center justify-center h-full p-4 bg-neutral-50">
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold mb-2">
        مُنشئ الألعاب بالذكاء الاصطناعي 🎮
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        استخدم الدردشة اللي على اليمين، ووصّف لي فكرة لعبة بسيطة تبغى تصمّمها،
        وأنا أطلع لك كود HTML جاهز للعب هنا!
      </p>
    </div>
    <div className="max-w-2xl bg-white rounded-lg p-6 shadow-md border-2 border-purple-300">
      <h3 className="text-2xl font-bold mb-3 text-purple-700">
        تقريبًا كل الألعاب اللي كسرت الدنيا مبنية على شغلة وحدة:
      </h3>

      <p className="text-xl mb-4 font-bold text-gray-800">
        حركة بسيطة تعيدها كل مرة — وتصير أحلى وأصعب كل شوي!
      </p>

      <div className="space-y-2 my-4">
        <div className="flex items-center">
          <span className="text-2xl ml-2">🏃‍♂️</span>
          <span>تقفز فوق الحواجز (ماريو)</span>
        </div>
        <div className="flex items-center">
          <span className="text-2xl ml-2">🎯</span>
          <span>تمسك الفواكه وهي تطيح (فروت نينجا)</span>
        </div>
        <div className="flex items-center">
          <span className="text-2xl ml-2">🚀</span>
          <span>تحاول تعيش أطول وقت ممكن (فلابي بيرد)</span>
        </div>
      </div>

      <p className="text-xl font-bold text-purple-700 my-3">
        حركة وحدة + تحدي = إدمان! 🔥
      </p>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-gray-800 font-semibold">
          <span className="inline-block ml-2">👉</span>
          لما تفكر بلعبتك، اسأل نفسك:
        </p>
        <p className="text-gray-800 font-bold">
          "وش الحركة الرئيسية اللي بتكون ممتعة؟"
        </p>
      </div>
    </div>
  </div>
);

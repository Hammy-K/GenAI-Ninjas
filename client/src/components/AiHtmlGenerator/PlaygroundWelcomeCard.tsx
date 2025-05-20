export const PlaygroundWelcomeCard = (
  <div className="flex flex-col h-full w-full items-center justify-center p-10  bg-white">
    <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-10 space-y-8 transition-all hover:shadow-2xl duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-purple-800 tracking-tight">
          🎮 مُنشئ الألعاب بالذكاء الاصطناعي
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          استخدم الدردشة اللي على اليمين، ووصّف لي فكرة لعبة بسيطة تبغى تصمّمها،
          وأنا أطلع لك كود HTML جاهز للعب هنا!
        </p>
      </div>

      {/* Idea Breakdown */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-purple-700">
          كل الألعاب القوية تبدأ بفكرة بسيطة 👇
        </h2>

        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-2xl mr-2">🏃‍♂️</span>
            <span className="text-gray-800">تقفز فوق الحواجز (ماريو)</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-2">🎯</span>
            <span className="text-gray-800">
              تمسك الفواكه وهي تطيح (فروت نينجا)
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-2">🚀</span>
            <span className="text-gray-800">
              تحاول تعيش أطول وقت ممكن (فلابي بيرد)
            </span>
          </li>
        </ul>
      </div>

      {/* Core Insight */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-inner">
        <p className="text-lg font-bold text-yellow-700">
          حركة وحدة + تحدي = إدمان! 🔥
        </p>
      </div>

      {/* Prompt for Action */}
      <div className="bg-gray-100 rounded-xl p-5 text-center space-y-2">
        <p className="text-gray-800 font-semibold text-lg">
          👉 لما تفكر بلعبتك، اسأل نفسك:
        </p>
        <p className="text-gray-900 text-xl font-bold">
          "وش الحركة الرئيسية اللي بتكون ممتعة؟"
        </p>
      </div>
    </div>
  </div>
);

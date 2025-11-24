import { useState, useEffect } from "react";

interface LottoBall {
  number: number;
  color: string;
}

const LottoGenerator = () => {
  const [generatedNumbers, setGeneratedNumbers] = useState([] as LottoBall[]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [savedSets, setSavedSets] = useState([] as LottoBall[][]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 쿠키에서 저장된 번호 불러오기
  useEffect(() => {
    const loadSavedSets = () => {
      try {
        const cookies = document.cookie.split(";");
        const lottoDataCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("lottoSets=")
        );

        if (lottoDataCookie) {
          const lottoData = lottoDataCookie.split("=")[1];
          const decodedData = decodeURIComponent(lottoData);
          const parsedSets = JSON.parse(decodedData);
          setSavedSets(parsedSets);
        }
      } catch (error) {
        console.error("쿠키 로드 실패:", error);
      }
    };

    loadSavedSets();
  }, []);

  // 쿠키에 번호 세트 저장하기
  const saveToCookie = (sets: LottoBall[][]) => {
    try {
      const jsonData = JSON.stringify(sets);
      const encodedData = encodeURIComponent(jsonData);
      const date = new Date();
      date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expires = `expires=${date.toUTCString()}`;

      document.cookie = `lottoSets=${encodedData}; ${expires}; path=/; SameSite=Lax`;
    } catch (error) {
      console.error("쿠키 저장 실패:", error);
    }
  };

  // 공 색상 결정 함수
  const getBallColor = (num: number): string => {
    if (num <= 10) return "from-yellow-400 to-orange-500";
    if (num <= 20) return "from-blue-400 to-blue-600";
    if (num <= 30) return "from-red-400 to-red-600";
    if (num <= 40) return "from-gray-400 to-gray-600";
    return "from-green-400 to-green-600";
  };

  // 토스트 알림 표시
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 번호 세트가 이미 저장되었는지 확인
  const isDuplicateSet = (newSet: LottoBall[], existingSets: LottoBall[][]) => {
    return existingSets.some((existingSet) => {
      const existingNumbers = existingSet.map((ball) => ball.number).sort();
      const newNumbers = newSet.map((ball) => ball.number).sort();
      return JSON.stringify(existingNumbers) === JSON.stringify(newNumbers);
    });
  };

  // 로또 번호 생성
  const generateNumbers = () => {
    setIsSpinning(true);
    setShowConfetti(false);

    const tempAnimation = setInterval(() => {
      const tempNumbers: LottoBall[] = [];
      for (let i = 0; i < 6; i++) {
        const num = Math.floor(Math.random() * 45) + 1;
        tempNumbers.push({
          number: num,
          color: getBallColor(num),
        });
      }
      setGeneratedNumbers(tempNumbers);
    }, 100);

    setTimeout(() => {
      clearInterval(tempAnimation);
      const numbers: number[] = [];
      while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }

      numbers.sort((a, b) => a - b);
      const finalNumbers = numbers.map((num) => ({
        number: num,
        color: getBallColor(num),
      }));

      setGeneratedNumbers(finalNumbers);
      setIsSpinning(false);
      setShowConfetti(true);
    }, 2000);
  };

  // 번호 세트 저장
  const saveNumbers = () => {
    if (generatedNumbers.length === 6) {
      if (isDuplicateSet(generatedNumbers, savedSets)) {
        showToastMessage("⚠️ 이미 저장된 번호입니다!");
        return;
      }

      const newSets = [...savedSets, generatedNumbers];
      setSavedSets(newSets);
      saveToCookie(newSets);
      showToastMessage("✅ 번호가 저장되었습니다!");
    }
  };

  // 저장된 번호 모두 삭제
  const clearAllSets = () => {
    setSavedSets([]);
    document.cookie =
      "lottoSets=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setShowDeleteConfirm(false);
    showToastMessage("🗑️ 모든 번호가 삭제되었습니다!");
  };

  // 로또 용지 이미지 생성 및 다운로드
  const downloadAsImage = () => {
    console.log("이미지 저장 시작"); // 디버깅용

    if (savedSets.length === 0) {
      showToastMessage("❌ 저장된 번호가 없습니다!");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas context를 가져올 수 없습니다");
      showToastMessage("❌ 이미지 생성 실패");
      return;
    }

    // 캔버스 크기 설정
    canvas.width = 600;
    const gameHeight = 140;
    const headerHeight = 150;
    const footerHeight = 120;
    canvas.height = headerHeight + savedSets.length * gameHeight + footerHeight;

    // 배경
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 테두리
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 로또 헤더
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(20, 20, canvas.width - 40, 80);

    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("로또 6/45", canvas.width / 2, 70);

    // 날짜
    const today = new Date();
    ctx.font = "16px Arial";
    ctx.fillStyle = "#333333";
    ctx.fillText(
      `발행일: ${today.getFullYear()}.${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`,
      canvas.width / 2,
      120
    );

    // 각 게임 그리기
    savedSets.forEach((set, index) => {
      const gameY = headerHeight + index * gameHeight;

      // 구분선
      ctx.strokeStyle = "#CCCCCC";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, gameY);
      ctx.lineTo(canvas.width - 20, gameY);
      ctx.stroke();

      // 게임 레이블
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(40, gameY + 20, 40, 40);

      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(String.fromCharCode(65 + index), 60, gameY + 47);

      // 번호 배경
      ctx.fillStyle = "#F5F5F5";
      ctx.fillRect(100, gameY + 15, 380, 50);

      // 번호 그리기
      const sortedNumbers = set
        .map((ball) => ball.number)
        .sort((a, b) => a - b);
      sortedNumbers.forEach((num, numIndex) => {
        const xPos = 110 + numIndex * 60;
        const yPos = gameY + 40;

        ctx.beginPath();
        ctx.arc(xPos + 20, yPos, 20, 0, Math.PI * 2);

        // 번호별 색상
        if (num <= 10) ctx.fillStyle = "#FFA500";
        else if (num <= 20) ctx.fillStyle = "#4169E1";
        else if (num <= 30) ctx.fillStyle = "#DC143C";
        else if (num <= 40) ctx.fillStyle = "#808080";
        else ctx.fillStyle = "#32CD32";

        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num.toString(), xPos + 20, yPos);
      });

      // 자동 표시
      ctx.fillStyle = "#666666";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("자동", 500, gameY + 45);

      // 바코드 장식
      ctx.fillStyle = "#000000";
      for (let i = 0; i < 20; i++) {
        const barWidth = Math.random() * 3 + 1;
        ctx.fillRect(100 + i * 15, gameY + 80, barWidth, 25);
      }
    });

    // 하단
    const bottomY = canvas.height - footerHeight + 20;

    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, bottomY);
    ctx.lineTo(canvas.width - 20, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#666666";
    ctx.textAlign = "center";
    ctx.fillText(
      "* 본 용지는 실제 로또 용지가 아닙니다.",
      canvas.width / 2,
      bottomY + 50
    );

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("♣ 행운을 빕니다 ♣", canvas.width / 2, bottomY + 80);

    // 이미지 다운로드
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `로또_${today.getFullYear()}${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}_${
          savedSets.length
        }게임.png`;
        document.body.appendChild(a); // 이 줄 추가
        a.click();
        document.body.removeChild(a); // 이 줄 추가
        URL.revokeObjectURL(url);
        showToastMessage("📥 로또 용지가 다운로드되었습니다!");
      } else {
        console.error("Blob 생성 실패");
        showToastMessage("❌ 이미지 생성 실패");
      }
    }, "image/png"); // MIME 타입 명시
  };

  // Confetti 컴포넌트
  const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          <div
            className={`w-2 h-2 ${
              [
                "bg-yellow-400",
                "bg-red-500",
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
              ][Math.floor(Math.random() * 5)]
            } rounded-full`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 헤더 */}
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 animate-bounce-slow">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600">
              🎰 행운의 로또 🎰
            </span>
          </h1>
          <p className="text-xl text-white/80 font-medium">
            당신의 행운을 시험해보세요!
          </p>
          {savedSets.length > 0 && (
            <p className="text-sm text-white/60 mt-2">
              📊 저장된 번호: {savedSets.length}개 세트
            </p>
          )}
        </header>
        {/* 메인 카드 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 relative">
            {showConfetti && <Confetti />}

            {/* 생성된 번호 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                생성된 번호
              </h2>
              <div className="flex justify-center gap-4 flex-wrap">
                {generatedNumbers.length > 0 ? (
                  generatedNumbers.map((ball, index) => (
                    <div
                      key={index}
                      className={`relative ${
                        isSpinning ? "animate-spin-slow" : "animate-bounce-in"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${ball.color} flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform`}
                      >
                        <span className="text-white font-bold text-xl">
                          {ball.number}
                        </span>
                      </div>
                      <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${ball.color} blur-md opacity-50 -z-10`}
                      ></div>
                    </div>
                  ))
                ) : (
                  <div className="text-white/50 text-lg">
                    번호를 생성해주세요!
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={generateNumbers}
                disabled={isSpinning}
                className={`px-8 py-4 rounded-full font-bold text-lg transform transition-all ${
                  isSpinning
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 hover:scale-105 active:scale-95 shadow-lg"
                } text-white`}
              >
                {isSpinning ? "생성 중..." : "🎲 번호 생성하기"}
              </button>

              {generatedNumbers.length === 6 && !isSpinning && (
                <button
                  onClick={saveNumbers}
                  className={`px-6 py-4 rounded-full font-bold text-lg transform hover:scale-105 active:scale-95 transition-all shadow-lg ${
                    isDuplicateSet(generatedNumbers, savedSets)
                      ? "bg-gray-500 cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                  } text-white`}
                  disabled={isDuplicateSet(generatedNumbers, savedSets)}
                >
                  {isDuplicateSet(generatedNumbers, savedSets)
                    ? "⚠️ 이미 저장됨"
                    : "💾 저장하기"}
                </button>
              )}
            </div>

            {/* 저장된 번호 */}
            {savedSets.length > 0 && (
              <div className="mt-8 p-6 bg-white/5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    저장된 번호 세트
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadAsImage}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 transition-all text-sm font-semibold"
                    >
                      📷 이미지 저장
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm font-semibold"
                    >
                      🗑️ 전체 삭제
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {savedSets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="flex gap-2 items-center bg-white/5 p-3 rounded-lg"
                    >
                      <span className="text-white/70 text-sm min-w-[40px]">
                        #{setIndex + 1}
                      </span>
                      <div className="flex gap-2">
                        {set.map((ball, ballIndex) => (
                          <div
                            key={ballIndex}
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${ball.color} flex items-center justify-center shadow-md`}
                          >
                            <span className="text-white font-semibold text-sm">
                              {ball.number}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-4 text-center">
                  💾 번호는 30일간 브라우저에 저장됩니다
                </p>
              </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-purple-900 to-pink-800 p-6 rounded-2xl shadow-2xl border border-white/20 max-w-sm mx-4">
                  <h4 className="text-xl font-bold text-white mb-4">
                    정말 삭제하시겠습니까?
                  </h4>
                  <p className="text-white/80 mb-6">
                    저장된 모든 번호 세트가 삭제됩니다. 이 작업은 되돌릴 수
                    없습니다.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={clearAllSets}
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all font-semibold"
                    >
                      삭제하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 토스트 알림 */}
            {showToast && (
              <div className="fixed top-4 right-4 z-50 animate-slide-in">
                <div className="bg-gradient-to-r from-purple-800 to-pink-700 text-white px-6 py-3 rounded-lg shadow-lg border border-white/20 backdrop-blur">
                  <p className="font-semibold">{toastMessage}</p>
                </div>
              </div>
            )}
          </div>
          {/** 
          <div className="mt-8 space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
              <p className="text-white/50 text-sm mb-2">광고</p>
              <div className="h-24 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white/70">광고 영역 (728x90)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <p className="text-white/50 text-sm mb-2">광고</p>
                <div className="h-60 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white/70">광고 영역 (300x250)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                <p className="text-white/50 text-sm mb-2">광고</p>
                <div className="h-60 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white/70">광고 영역 (300x250)</span>
                </div>
              </div>
            </div>
          </div>
          */}
        </div>
        {/* 푸터 */}
        <footer className="mt-12 text-center text-white/60">
          <p>
            © made by j!yeon 로또 번호 만들기. 이 사이트는 재미를 위해
            만들어졌습니다. 실제 당첨을 보장하지 않습니다. 그러나 실제 당첨되면
            좋긴 할 것 같습니다. 물론 제가요.
          </p>
        </footer>
      </div>

      {/* 커스텀 스타일 */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }

        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }

        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LottoGenerator;

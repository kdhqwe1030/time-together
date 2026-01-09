"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const fullText = "우리 언제 만날까?";

  const [vp, setVp] = useState({ w: 0, h: 0 }); // 뷰포트 사이즈 추적

  useEffect(() => {
    const onResize = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 세로로 긴 정도(0~1). 1에 가까울수록 “긴 폰”
  const tallT = useMemo(() => {
    if (!vp.w || !vp.h) return 0;
    const aspect = vp.h / vp.w; // 예: 아이폰 미니/프로맥스 등
    // 1.7 이하면 0, 2.3 이상이면 1로 수렴(원하는대로 조절 가능)
    const t = (aspect - 1.7) / 0.6;
    return Math.min(Math.max(t, 0), 1);
  }, [vp]);

  // 타이핑 효과
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 150);
    return () => clearInterval(typingInterval);
  }, []);

  // 스크롤 이벤트
  useEffect(() => {
    const el = document.getElementById("hero-section");
    if (!el) return;

    const onScroll = () => {
      const start = el.offsetTop;
      const height = el.offsetHeight;
      const y = window.scrollY;
      const p = Math.min(Math.max((y - start) / height, 0), 1);
      setProgress(p);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const imageBoxVh = 45 + tallT * 20; //“긴 폰”일수록 이미지 박스 높이를 키움 - 45dvh ~ 65dvh 사이로 보간

  // 연출 값(기존 + 긴 폰 보정)
  const imageScale = 1 + progress * 0.5 + tallT * 0.12; // 긴 폰일수록 살짝 더 확대
  const imageTranslateY = -(progress * 30);
  const textOpacity = progress >= 0.5 ? 0 : 1;
  const buttonOpacity = progress >= 0.2 ? 0 : 1;

  return (
    <div
      id="hero-section"
      className="relative w-full bg-surface overflow-hidden "
      style={{ height: "100dvh" }}
    >
      {/* 상단 텍스트 */}
      <div
        className="fixed z-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
        style={{ top: "8rem", opacity: textOpacity }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          {typedText || "\u00A0"}
          {showCursor && (
            <span className="inline-block w-0.5 h-10 md:h-16 bg-gray-900 ml-1 animate-blink align-bottom" />
          )}
        </h1>
        <p className="text-lg md:text-xl text-gray-700 leading-relaxed animate-fade-in">
          함께하는 시간을 더욱 특별하게
          <br />
          모임 일정을 쉽고 간편하게 조율하세요
        </p>
      </div>

      {/* 시작하기 버튼 - 중간에 배치 */}
      <div
        className="fixed z-10 left-1/2 -translate-x-1/2 animate-fade-in"
        style={{
          top: "85%",
          opacity: buttonOpacity,
        }}
      >
        <button
          onClick={() => router.push("/create")}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-lg font-semibold hover:bg-primary-hover transition-colors shadow-lg"
        >
          모임 일정 만들기
        </button>
      </div>

      {/* 하단 이미지: "높이" 기준으로 크게 잡고, cover로 채움 */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className="w-full max-w-2xl"
          style={{
            height: `${imageBoxVh}dvh`,
            transform: `translateY(${imageTranslateY}%) scale(${imageScale})`,
            transformOrigin: "center bottom",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/background.webp"
              alt="Time Together Hero Image"
              fill
              priority
              className="object-cover object-bottom"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

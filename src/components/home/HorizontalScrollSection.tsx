"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFadeIn } from "@/src/hooks/useFadeIn";

type PhoneItem = { src: string; alt?: string };

type Props = {
  kicker?: string;
  title: string;
  desc?: string;
  phones: PhoneItem[];
  isGray?: boolean;
};

export default function HorizontalScrollSection({
  kicker,
  title,
  desc,
  phones,
  isGray = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [sectionHeight, setSectionHeight] = useState(0);
  const [x, setX] = useState(0);
  const [sidePad, setSidePad] = useState(0);
  const [maxX, setMaxX] = useState(0);

  // Fade-in 효과
  const { ref: fadeInRef, isVisible } = useFadeIn({ threshold: 0.4 });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    );
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const firstCard = track.querySelector<HTMLElement>(
        "[data-phone-card='true']"
      );
      const viewW = viewport.clientWidth;
      const cardW =
        firstCard?.getBoundingClientRect().width ?? Math.min(360, viewW);

      const pad = Math.max(8, Math.floor((viewW - cardW) / 2));

      // 핵심: state 기다리지 말고 DOM에 즉시 적용
      track.style.paddingLeft = `${pad}px`;
      track.style.paddingRight = `${pad}px`;
      setSidePad(pad);

      // padding 적용된 상태에서 scrollWidth 측정
      const newMaxX = Math.max(0, track.scrollWidth - viewW);
      setMaxX(newMaxX);

      const vh = window.innerHeight;
      setSectionHeight(vh + newMaxX);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [phones.length]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();

        // 가로 이동량만큼만 세로 스크롤하면 끝
        const usable = Math.max(1, maxX);
        const progress = Math.min(Math.max(-rect.top / usable, 0), 1);

        setX(progress * maxX);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxX, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full ${isGray ? "bg-none" : "bg-surface"} `}
      style={{ height: sectionHeight ? `${sectionHeight}px` : "100dvh" }}
    >
      <div className="sticky top-0 h-dvh overflow-hidden ">
        <div
          ref={fadeInRef}
          className={`mx-auto w-full max-w-2xl px-6 pt-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {kicker ? (
            <div className="text-sm font-semibold text-primary">{kicker}</div>
          ) : null}
          <h2 className="mt-2 text-2xl md:text-5xl font-extrabold text-text leading-tight">
            {title}
          </h2>
          {desc ? (
            <p className="mt-4 text-base md:text-lg text-muted leading-relaxed whitespace-pre-line">
              {desc}
            </p>
          ) : null}
        </div>

        <div ref={viewportRef} className="mx-auto w-full max-w-2xl">
          <div
            ref={trackRef}
            className="flex items-center gap-10 will-change-transform"
            style={{
              paddingLeft: sidePad,
              paddingRight: sidePad,
              transform: prefersReducedMotion
                ? undefined
                : `translateX(${-x}px)`,
            }}
          >
            {phones.map((p, idx) => (
              <div
                key={`${p.src}-${idx}`}
                data-phone-card="true"
                className="
                  relative shrink-0
                  w-[72vw] max-w-90
                  aspect-9/19
                "
              >
                <Image
                  src={p.src}
                  alt={p.alt ?? `phone-${idx + 1}`}
                  fill
                  priority={idx === 0}
                  className="object-contain"
                  sizes="(max-width: 768px) 72vw, 360px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

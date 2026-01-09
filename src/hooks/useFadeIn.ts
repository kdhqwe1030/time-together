import { useEffect, useRef, useState } from "react";

type UseFadeInOptions = {
  threshold?: number; // 0~1, 요소가 얼마나 보일 때 트리거할지
  rootMargin?: string; // 예: "0px 0px -100px 0px"
  triggerOnce?: boolean; // 한 번만 트리거할지 여부
};

export function useFadeIn(options: UseFadeInOptions = {}) {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

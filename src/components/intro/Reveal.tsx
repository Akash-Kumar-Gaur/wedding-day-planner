// Isolated on purpose: this is the extension point for scroll-triggered animation.
// Swapping this internals for framer-motion's `motion.div` + `whileInView` later
// won't require touching any call site.
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Start visible so SSR / IO failures never leave the page blank.
  // After mount we only hide below-fold blocks that will be revealed on scroll.
  const [inView, setInView] = useState(true);
  const [enableTransition, setEnableTransition] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    // If already in (or near) the viewport, keep visible; otherwise hide until scroll.
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (alreadyVisible) {
      setInView(true);
    } else {
      setInView(false);
      // Enable transition only when we intentionally hide, so above-fold
      // content doesn't flash from invisible → visible on first paint.
      setEnableTransition(true);
    }

    io.observe(el);

    // Safety net: never leave a section stranded at opacity 0.
    const fallback = window.setTimeout(() => setInView(true), 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${enableTransition ? "transition-all duration-700 ease-out" : ""} ${
        inView ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

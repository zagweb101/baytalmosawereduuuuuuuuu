"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export function CinematicHero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--mouse-x", `${x * 24}px`);
      hero.style.setProperty("--mouse-y", `${y * 24}px`);
    };

    hero.addEventListener("mousemove", handleMove);
    return () => hero.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="cinematic-hero relative min-h-[88vh] flex items-center overflow-hidden"
      aria-label="القسم الرئيسي"
    >
      <div className="cinematic-hero__orb cinematic-hero__orb--purple" aria-hidden />
      <div className="cinematic-hero__orb cinematic-hero__orb--magenta" aria-hidden />
      <div className="cinematic-hero__orb cinematic-hero__orb--accent" aria-hidden />
      <div className="cinematic-hero__grid" aria-hidden />
      <div className="cinematic-hero__grain" aria-hidden />
      <div className="cinematic-hero__vignette" aria-hidden />

      <div className="container relative z-10 mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal delay={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-brand-accent-light" />
              <span>أكاديمية بيت المصور — منذ 2018</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              نصنع مصوّري
              <span className="brand-gradient-text block mt-2 pb-1">
                الجيل القادم
              </span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              منصة تعليمية احترافية في التصوير الفوتوغرافي والفيديو — دورات
              من ورش بيت المصور الحقيقية، بإضاءة استوديو وخبرة مدربين معتمدين
            </p>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="btn-shimmer w-full sm:w-auto min-w-[200px] shadow-lg shadow-brand-magenta/25"
                >
                  <BookOpen className="h-5 w-5" />
                  تصفّح الدورات
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto min-w-[200px] border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/40"
                >
                  <GraduationCap className="h-5 w-5" />
                  ابدأ مجاناً
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={480}>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-white/50">
              {["+5,000 متدرب", "+500 ورشة", "+10 سنوات خبرة"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-accent-light" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="cinematic-hero__scroll-hint" aria-hidden>
        <span className="cinematic-hero__scroll-line" />
      </div>
    </section>
  );
}

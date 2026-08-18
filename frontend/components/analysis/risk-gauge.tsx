"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState } from "react";

import { SEVERITY_META } from "@/components/analysis/severity";
import type { RiskLevel } from "@/types/contract";

interface RiskGaugeProps {
  level: RiskLevel;
  /** Render at full value immediately (no sweep animation). */
  static?: boolean;
}

/**
 * Hand-rolled SVG semicircle gauge. The arc sweeps from 0 to the level's
 * position on mount (framer-motion pathLength), and the numeric index counts
 * up alongside it. Honors prefers-reduced-motion.
 */
export function RiskGauge({ level, static: isStatic = false }: RiskGaugeProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const meta = SEVERITY_META[level] ?? SEVERITY_META.low;
  const target = meta.gaugeValue;
  const instant = isStatic || reduceMotion;

  const [displayValue, setDisplayValue] = useState(instant ? target : 0);

  useEffect(() => {
    if (instant) {
      setDisplayValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, instant]);

  // Semicircle from (20,100) to (180,100) with radius 80.
  const arcPath = "M 20 100 A 80 80 0 0 1 180 100";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 116"
        className="w-full max-w-60"
        role="img"
        aria-label={`Overall risk level: ${meta.label}, ${target} out of 100`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--risk-low)" />
            <stop offset="45%" stopColor="var(--risk-medium)" />
            <stop offset="75%" stopColor="var(--risk-high)" />
            <stop offset="100%" stopColor="var(--risk-critical)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Value arc — sweeps on mount */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          initial={{ pathLength: instant ? target / 100 : 0 }}
          animate={{ pathLength: target / 100 }}
          transition={
            instant
              ? { duration: 0 }
              : { duration: 1.2, ease: "easeOut" }
          }
        />

        {/* Tick marks at 25/50/75 */}
        {[0.25, 0.5, 0.75].map((t) => {
          const angle = Math.PI * (1 - t);
          const x1 = 100 + Math.cos(angle) * 92;
          const y1 = 100 - Math.sin(angle) * 92;
          const x2 = 100 + Math.cos(angle) * 98;
          const y2 = 100 - Math.sin(angle) * 98;
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--border)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        <text
          x="100"
          y="86"
          textAnchor="middle"
          className="fill-foreground font-display text-3xl font-semibold"
        >
          {displayValue}
        </text>
        <text
          x="100"
          y="106"
          textAnchor="middle"
          className="fill-muted-foreground text-[9px] font-medium tracking-[0.2em] uppercase"
        >
          Risk index / 100
        </text>
      </svg>

      <p className={`mt-2 font-display text-xl font-semibold capitalize ${meta.textClass}`}>
        {meta.label} risk
      </p>
      <p className="mt-1 max-w-52 text-center text-xs text-muted-foreground">
        {meta.blurb}
      </p>
    </div>
  );
}

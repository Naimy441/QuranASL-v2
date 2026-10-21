"use client";

import { motion, useInView, useReducedMotion, type TargetAndTransition, type Transition, type Variant } from "framer-motion";
import React from "react";

type PresetType = "fade-in-blur" | "fade" | "slide" | "scale";
type PerType = "char" | "word" | "line";

interface TextEffectProps {
  children: string;
  per?: PerType;
  preset?: PresetType;
  delay?: number;
  className?: string;
  segmentWrapperClassName?: string;
  trigger?: boolean;
  once?: boolean;
}

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  visible: (custom: { delay?: number; stagger?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.stagger ?? 0.05,
      delayChildren: custom.delay ?? 0,
    },
  }),
};

const defaultPresets: Record<
  PresetType,
  { hidden: Variant; visible: Variant }
> = {
  "fade-in-blur": {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      y: 16,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transitionEnd: {
        filter: "none",
      },
      transition: {
        y: { type: "spring", stiffness: 150, damping: 25 },
        opacity: { duration: 0.35, ease: "easeOut" },
        filter: { duration: 0.35, ease: "easeOut" },
      },
    },
  },
  fade: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  },
};

export function TextEffect({
  children,
  per = "word",
  preset = "fade-in-blur",
  delay = 0,
  className = "",
  segmentWrapperClassName = "",
  trigger,
  once = true,
}: TextEffectProps) {
  const containerRef = React.useRef<HTMLSpanElement>(null);
  const [hasMounted, setHasMounted] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isInView = useInView(containerRef, {
    once,
    amount: 0.2,
    margin: "0px 0px -40px 0px",
  });

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const segments = React.useMemo(() => {
    if (per === "char") return children.split("");
    if (per === "word") return children.split(" ");
    return children.split("\n");
  }, [children, per]);

  const stagger = per === "char" ? 0.03 : 0.08;
  const baseVariants = defaultPresets[preset];
  const itemVariants = React.useMemo(() => {
    if (shouldReduceMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, filter: "none", y: 0, transition: { duration: 0.2 } },
      };
    }
    return baseVariants;
  }, [shouldReduceMotion, baseVariants]);

  const shouldAnimate = trigger !== undefined ? trigger : isInView;
  const activeState = hasMounted && shouldAnimate ? "visible" : "hidden";

  return (
    <motion.span
      ref={containerRef}
      initial="hidden"
      animate={activeState}
      aria-label={children}
      custom={{ delay, stagger }}
      variants={defaultContainerVariants}
      className={`inline-block ${className}`}
    >
      <span className="sr-only">{children}</span>
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          variants={itemVariants}
          className={`inline-block whitespace-pre ${segmentWrapperClassName}`}
        >
          {segment}
          {per === "word" && index < segments.length - 1 && " "}
        </motion.span>
      ))}
    </motion.span>
  );
}

export type { PresetType, PerType, TextEffectProps };

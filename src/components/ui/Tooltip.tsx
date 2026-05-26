"use client";

import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, position = "top", delay = 200, className = "inline-block" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-900",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-900",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-900",
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onTouchStart={showTooltip}
      onTouchEnd={() => {
        setTimeout(hideTooltip, 1500);
      }}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 bg-slate-900/95 border border-white/10 backdrop-blur-md rounded-xl shadow-xl pointer-events-none w-max max-w-[200px] text-center leading-normal transition-all duration-150 animate-fade-in ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
export default Tooltip;

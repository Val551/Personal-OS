"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

interface Props
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange" | "value"
  > {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}

/**
 * Textarea that grows with its content so the page (not the textarea) is
 * what scrolls. Avoids the "trapped scrollbar inside a 560px box" problem
 * the editor used to have.
 */
export const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function AutoGrowTextarea(
    { value, onChange, minRows = 2, className, ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const resize = () => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    useLayoutEffect(() => {
      resize();
    }, [value]);

    useEffect(() => {
      // Re-measure when fonts finish loading (initial render can be off by
      // a line if the webfont swaps in late).
      const handle = window.setTimeout(resize, 50);
      return () => window.clearTimeout(handle);
    }, []);

    return (
      <textarea
        ref={innerRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent focus:outline-none",
          className,
        )}
        {...rest}
      />
    );
  },
);

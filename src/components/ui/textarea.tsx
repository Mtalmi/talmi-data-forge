import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[10px] border px-3.5 py-2.5 text-sm ring-offset-background transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        "bg-white/[0.03] border-white/[0.08] placeholder:text-slate-400/40",
        "hover:border-white/[0.12]",
        "focus-visible:outline-none focus-visible:border-[rgba(253,185,19,0.3)] focus-visible:shadow-[0_0_0_3px_rgba(253,185,19,0.06)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.15)] text-[#D4A843]",
        secondary: "border-[rgba(156,163,175,0.3)] bg-[rgba(156,163,175,0.15)] text-[#9CA3AF]",
        destructive: "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-[#EF4444]",
        outline: "text-foreground border-current/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 11,
          fontWeight: 400,
          borderRadius: 4,
          padding: '3px 8px',
          ...style,
        }}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#D4A843] text-white font-semibold hover:bg-[#C49A3C] border-none shadow-none",
        destructive: "bg-[#EF4444] text-white font-semibold hover:bg-red-600 border-none",
        outline: "bg-transparent text-[#D4A843] border border-[#D4A843] hover:bg-[rgba(212,168,67,0.1)]",
        secondary: "bg-transparent text-[#D4A843] border border-[#D4A843] hover:bg-[rgba(212,168,67,0.1)]",
        ghost: "bg-transparent text-[#9CA3AF] border-none hover:text-white hover:bg-white/[0.05]",
        link: "text-[#D4A843] underline-offset-4 hover:underline bg-transparent border-none",
        whatsapp: "bg-[#25D366] text-white font-semibold hover:bg-[#1FAE52] border-none",
      },
      size: {
        default: "h-10 min-h-[44px] px-5 py-2",
        sm: "h-9 min-h-[40px] rounded-md px-3.5",
        lg: "h-11 min-h-[44px] rounded-md px-8",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 12,
          letterSpacing: '0.5px',
          borderRadius: 6,
          ...style,
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

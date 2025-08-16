import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
          {
            // Variants
            "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950": variant === "default",
            "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800": variant === "primary",
            "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300": variant === "secondary",
            "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100": variant === "outline",
            "text-gray-900 hover:bg-gray-100 active:bg-gray-200": variant === "ghost",
            // Sizes - increased for better mobile touch targets (minimum 44px)
            "h-10 px-3 text-sm min-h-[44px]": size === "sm",
            "h-11 px-4 py-2 min-h-[44px]": size === "md",
            "h-12 px-8 text-lg min-h-[44px]": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
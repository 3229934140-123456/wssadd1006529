import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "bg-white rounded-2xl shadow-card border border-gray-100/80",
          "transition-all duration-200",
          hoverable || onClick
            ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200 active:translate-y-0"
            : "",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

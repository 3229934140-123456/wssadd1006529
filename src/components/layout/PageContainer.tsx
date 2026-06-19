import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "min-h-screen bg-gradient-to-b from-gray-50 to-white",
          className
        )}
        {...props}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    );
  }
);

PageContainer.displayName = "PageContainer";

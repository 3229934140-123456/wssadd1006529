import { HTMLAttributes, forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type TagColor = "default" | "primary" | "success" | "warning" | "danger";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  onRemove?: () => void;
  color?: TagColor;
}

const colorStyles: Record<TagColor, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ label, onRemove, color = "default", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          colorStyles[color],
          className
        )}
        {...props}
      >
        {label}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-0.5 -mr-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = "Tag";

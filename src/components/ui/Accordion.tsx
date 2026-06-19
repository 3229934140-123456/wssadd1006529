import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  title: ReactNode;
  content: ReactNode;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number;
  className?: string;
}

export function Accordion({ items, defaultOpenIndex, className }: AccordionProps) {
  const [openStates, setOpenStates] = useState<boolean[]>(() => {
    const initial = items.map((item) => item.isOpen ?? false);
    if (defaultOpenIndex !== undefined && defaultOpenIndex >= 0 && defaultOpenIndex < items.length) {
      initial[defaultOpenIndex] = true;
    }
    return initial;
  });

  const toggle = (index: number) => {
    const item = items[index];
    if (item.onToggle) {
      const willOpen = !(item.isOpen ?? openStates[index]);
      item.onToggle(willOpen);
    }
    if (item.isOpen === undefined) {
      setOpenStates((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    }
  };

  return (
    <div className={cn("divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden", className)}>
      {items.map((item, index) => {
        const isOpen = item.isOpen ?? openStates[index];
        return (
          <div key={index}>
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{item.title}</span>
              <ChevronDown
                size={18}
                className={cn(
                  "text-gray-400 transition-transform duration-200 shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 pt-0 text-gray-600 text-sm leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

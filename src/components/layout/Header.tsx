import { Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  sceneName?: string;
  onBackToScenes?: () => void;
  className?: string;
}

export function Header({ sceneName, onBackToScenes, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-button">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            日清对账训练营
          </span>
        </div>

        <div className="flex items-center gap-3">
          {sceneName && (
            <>
              <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                {sceneName}
              </span>
              {onBackToScenes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToScenes}
                  className="gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>返回场景列表</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

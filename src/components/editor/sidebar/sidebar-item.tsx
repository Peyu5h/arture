import type { LucideIcon } from "lucide-react";
import { ny } from "~/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={ny(
        "group relative flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <div className="relative z-10">
        <Icon
          className={ny(
            "size-5 shrink-0 transition-all duration-200",
            isActive
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </div>

      <span
        className={ny(
          "relative z-10 text-[10px] font-medium transition-all duration-200",
          isActive
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
};

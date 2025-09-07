import type { LucideIcon } from "lucide-react";

import { ny } from "~/lib/utils";
import { Button } from "~/components/ui/button";

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
    <Button
      variant="ghost"
      onClick={onClick}
      className={ny(
        "group relative flex h-[70px] w-full flex-col items-center justify-center overflow-hidden rounded-xl px-3 py-4 transition-all duration-300",
        isActive
          ? "from-primary/90 via-primary to-primary/80 text-primary-foreground shadow-primary/25 border-primary/20 border bg-gradient-to-br shadow-lg"
          : "hover:from-accent/50 hover:to-accent/30 hover:bg-gradient-to-br hover:shadow-sm",
        isActive &&
          "hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:bg-gradient-to-br",
      )}
    >
      {isActive && (
        <div className="from-primary/20 to-primary/10 absolute inset-0 animate-pulse bg-gradient-to-br via-transparent" />
      )}

      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      )}

      <div className={ny("relative z-10 transition-all duration-300")}>
        <Icon
          className={ny(
            "size-6 shrink-0 stroke-2 transition-all duration-300",
            isActive
              ? "text-primary-foreground drop-shadow-sm"
              : "text-muted-foreground group-hover:text-accent-foreground",
          )}
        />
      </div>
      <span
        className={ny(
          "relative z-10 mt-3 text-xs font-medium transition-all duration-300",
          isActive
            ? "text-primary-foreground font-semibold drop-shadow-sm"
            : "text-muted-foreground group-hover:text-accent-foreground",
        )}
      >
        {label}
      </span>
    </Button>
  );
};

import { LucideIcon } from "lucide-react";
import { ny } from "~/lib/utils";

interface ToolSidebarHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export const ToolSidebarHeader = ({
  title,
  description,
  icon: Icon,
  iconClassName,
}: ToolSidebarHeaderProps) => {
  return (
    <div className="border-border bg-card border-b">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <Icon className={ny("text-primary size-5", iconClassName)} />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <p className="text-muted-foreground text-xs">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

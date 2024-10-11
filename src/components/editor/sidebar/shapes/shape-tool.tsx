import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

import { ny } from "~/lib/utils";

interface ShapeToolProps {
  onClick: () => void;
  icon: LucideIcon | IconType;
  iconClassName?: string;
}

export const ShapeTool = ({
  onClick,
  icon: Icon,
  iconClassName,
}: ShapeToolProps) => {
  return (
    <button onClick={onClick} className="aspect-square rounded-md border p-5">
      <Icon className={ny("h-full w-full", iconClassName)} />
    </button>
  );
};

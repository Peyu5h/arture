"use client";
import { usePusherPresence, PresenceUser } from "~/hooks/usePusherPresence";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ny } from "~/lib/utils";
import { authClient } from "~/lib/auth-client";

interface PresenceAvatarsProps {
  projectId: string | undefined;
  maxVisible?: number;
}

// gets initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// generates consistent color based on user id
const getUserColor = (id: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-amber-500",
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
};

export const PresenceAvatars = ({
  projectId,
  maxVisible = 5,
}: PresenceAvatarsProps) => {
  const { users } = usePusherPresence(projectId);
  const { data: session } = authClient.useSession();

  console.log("[PresenceAvatars] Render - users:", users, "session user id:", session?.user?.id);

  // filter out current user - only show other viewers
  const otherUsers = users.filter((user) => user.id !== session?.user?.id);
  console.log("[PresenceAvatars] otherUsers after filter:", otherUsers);

  // if no other users, don't show anything
  if (otherUsers.length === 0) {
    console.log("[PresenceAvatars] No other users, returning null");
    return null;
  }

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = otherUsers.length - maxVisible;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user, index) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div
                className={ny(
                  "ring-background relative rounded-full ring-2 transition-transform hover:z-10 hover:scale-110",
                )}
                style={{ zIndex: visibleUsers.length - index }}
              >
                <Avatar className="size-8 cursor-pointer">
                  {user.avatar && !user.isAnonymous ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback
                    className={ny(
                      "text-xs font-medium text-white",
                      getUserColor(user.id),
                    )}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {/* online indicator */}
                <span className="ring-background absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-sm font-medium">{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="ring-background relative z-0 rounded-full ring-2">
                <Avatar className="size-8 cursor-pointer">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-sm font-medium">{hiddenCount} more</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

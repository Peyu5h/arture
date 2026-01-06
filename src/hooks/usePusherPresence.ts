import { useEffect, useState, useRef } from "react";
import Pusher, { PresenceChannel, Members } from "pusher-js";
import { authClient } from "~/lib/auth-client";

export interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isAnonymous: boolean;
}

interface PusherPresenceState {
  users: PresenceUser[];
  isConnected: boolean;
  error: string | null;
}

let pusherInstance: Pusher | null = null;

// get or create pusher instance
const getPusher = (): Pusher | null => {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster: "ap2",
      authEndpoint: "/api/pusher/auth",
      authTransport: "ajax",
      auth: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    });
  }

  return pusherInstance;
};

export const usePusherPresence = (projectId: string | undefined) => {
  console.log("[Pusher] Hook called with projectId:", projectId);
  const [state, setState] = useState<PusherPresenceState>({
    users: [],
    isConnected: false,
    error: null,
  });
  const channelRef = useRef<PresenceChannel | null>(null);
  const { data: session } = authClient.useSession();
  console.log("[Pusher] Hook state - users:", state.users.length, "isConnected:", state.isConnected);

  useEffect(() => {
    console.log("[Pusher] useEffect triggered, projectId:", projectId);
    if (!projectId) {
      console.log("[Pusher] No projectId, skipping");
      return;
    }

    const pusher = getPusher();
    if (!pusher) {
      console.log("[Pusher] No pusher instance available");
      return;
    }
    console.log("[Pusher] Got pusher instance");

    const channelName = `presence-project-${projectId}`;

    try {
      const channel = pusher.subscribe(channelName) as PresenceChannel;
      channelRef.current = channel;

      const updateUsers = (members: Members) => {
        const users: PresenceUser[] = [];
        members.each((member: { id: string; info: any }) => {
          users.push({
            id: member.id,
            name:
              member.info?.name ||
              `Anonymous ${member.info?.anonymousNumber || ""}`,
            email: member.info?.email,
            avatar: member.info?.avatar,
            isAnonymous: member.info?.isAnonymous ?? true,
          });
        });
        console.log("[Pusher] Updated users:", users);
        setState((prev) => ({
          ...prev,
          users,
          isConnected: true,
          error: null,
        }));
      };

      channel.bind("pusher:subscription_succeeded", (members: Members) => {
        console.log("[Pusher] Subscription succeeded, members count:", members.count);
        updateUsers(members);
      });

      channel.bind("pusher:member_added", () => {
        if (channel.members) {
          updateUsers(channel.members);
        }
      });

      channel.bind("pusher:member_removed", () => {
        if (channel.members) {
          updateUsers(channel.members);
        }
      });

      channel.bind("pusher:subscription_error", (error: any) => {
        console.error("Pusher subscription error:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to connect",
          isConnected: false,
        }));
      });

      return () => {
        if (channelRef.current) {
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
        setState({ users: [], isConnected: false, error: null });
      };
    } catch (err) {
      console.error("Pusher setup error:", err);
      return;
    }
  }, [projectId, session?.user]);

  return state;
};

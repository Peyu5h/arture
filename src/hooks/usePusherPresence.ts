import { useEffect, useState, useRef, useCallback } from "react";
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
  const [state, setState] = useState<PusherPresenceState>({
    users: [],
    isConnected: false,
    error: null,
  });
  const channelRef = useRef<PresenceChannel | null>(null);
  const { data: session } = authClient.useSession();

  // use stable user id instead of full session object
  const userId = session?.user?.id;

  const updateUsers = useCallback((members: Members) => {
    const users: PresenceUser[] = [];
    members.each((member: { id: string; info: Record<string, unknown> }) => {
      users.push({
        id: member.id,
        name:
          (member.info?.name as string) ||
          `Anonymous ${member.info?.anonymousNumber || ""}`,
        email: member.info?.email as string | undefined,
        avatar: member.info?.avatar as string | undefined,
        isAnonymous: (member.info?.isAnonymous as boolean) ?? true,
      });
    });
    setState((prev) => ({
      ...prev,
      users,
      isConnected: true,
      error: null,
    }));
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const pusher = getPusher();
    if (!pusher) {
      return;
    }

    const channelName = `presence-project-${projectId}`;

    try {
      const channel = pusher.subscribe(channelName) as PresenceChannel;
      channelRef.current = channel;

      channel.bind("pusher:subscription_succeeded", (members: Members) => {
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

      channel.bind("pusher:subscription_error", (error: unknown) => {
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
  }, [projectId, userId, updateUsers]);

  return state;
};

import { nanoid } from "nanoid";

// session states
export type SessionState =
  | "created"
  | "connecting"
  | "streaming"
  | "completed"
  | "error"
  | "timeout";

// streaming event types
export type StreamEventType =
  | "session_start"
  | "chunk"
  | "action"
  | "tool_call"
  | "tool_result"
  | "message"
  | "error"
  | "complete"
  | "heartbeat";

// streaming event payload
export interface StreamEvent {
  id: string;
  type: StreamEventType;
  sessionId: string;
  timestamp: number;
  data: unknown;
  sequence: number;
}

// action event data
export interface ActionEventData {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  description?: string;
  status: "pending" | "executing" | "complete" | "error";
}

// tool call event data
export interface ToolCallEventData {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "calling" | "complete" | "error";
  output?: unknown;
  error?: string;
}

// message event data
export interface MessageEventData {
  content: string;
  isPartial: boolean;
  role: "assistant" | "system";
}

// session metadata
export interface SessionMetadata {
  userId: string;
  conversationId?: string;
  projectId?: string;
  model?: string;
  startedAt: number;
  lastActivityAt: number;
}

// session data structure
export interface StreamingSession {
  id: string;
  state: SessionState;
  metadata: SessionMetadata;
  events: StreamEvent[];
  currentMessage: string;
  actions: ActionEventData[];
  error?: string;
}

// session config
export interface SessionConfig {
  timeoutMs: number;
  heartbeatIntervalMs: number;
  maxRetries: number;
  bufferSize: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMs: 120000,
  heartbeatIntervalMs: 15000,
  maxRetries: 3,
  bufferSize: 100,
};

// session store for in-memory tracking
const sessions = new Map<string, StreamingSession>();

// generates unique session id
export function generateSessionId(): string {
  return `sess_${nanoid(16)}`;
}

// generates unique event id
export function generateEventId(): string {
  return `evt_${nanoid(12)}`;
}

// creates a new streaming session
export function createSession(
  userId: string,
  conversationId?: string,
  projectId?: string,
): StreamingSession {
  const session: StreamingSession = {
    id: generateSessionId(),
    state: "created",
    metadata: {
      userId,
      conversationId,
      projectId,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    },
    events: [],
    currentMessage: "",
    actions: [],
  };

  sessions.set(session.id, session);
  return session;
}

// gets session by id
export function getSession(sessionId: string): StreamingSession | undefined {
  return sessions.get(sessionId);
}

// updates session state
export function updateSessionState(
  sessionId: string,
  state: SessionState,
  error?: string,
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.state = state;
    session.metadata.lastActivityAt = Date.now();
    if (error) session.error = error;
  }
}

// adds event to session
export function addSessionEvent(
  sessionId: string,
  type: StreamEventType,
  data: unknown,
): StreamEvent | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const event: StreamEvent = {
    id: generateEventId(),
    type,
    sessionId,
    timestamp: Date.now(),
    data,
    sequence: session.events.length,
  };

  session.events.push(event);
  session.metadata.lastActivityAt = Date.now();

  // trim events if buffer exceeded
  if (session.events.length > DEFAULT_SESSION_CONFIG.bufferSize) {
    session.events = session.events.slice(-DEFAULT_SESSION_CONFIG.bufferSize);
  }

  return event;
}

// appends message chunk
export function appendMessage(sessionId: string, chunk: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.currentMessage += chunk;
    session.metadata.lastActivityAt = Date.now();
  }
}

// adds action to session
export function addAction(
  sessionId: string,
  action: ActionEventData,
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.actions.push(action);
    session.metadata.lastActivityAt = Date.now();
  }
}

// updates action status
export function updateActionStatus(
  sessionId: string,
  actionId: string,
  status: ActionEventData["status"],
): void {
  const session = sessions.get(sessionId);
  if (session) {
    const action = session.actions.find((a) => a.id === actionId);
    if (action) {
      action.status = status;
      session.metadata.lastActivityAt = Date.now();
    }
  }
}

// cleans up session
export function cleanupSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// gets all events since sequence
export function getEventsSince(
  sessionId: string,
  sinceSequence: number,
): StreamEvent[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return session.events.filter((e) => e.sequence > sinceSequence);
}

// cleanup stale sessions (call periodically)
export function cleanupStaleSessions(maxAgeMs: number = 3600000): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.metadata.lastActivityAt > maxAgeMs) {
      sessions.delete(id);
    }
  }
}

// formats event for sse
export function formatSSEEvent(event: StreamEvent): string {
  const data = JSON.stringify({
    type: event.type,
    id: event.id,
    sequence: event.sequence,
    timestamp: event.timestamp,
    data: event.data,
  });
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${data}\n\n`;
}

// formats heartbeat for sse
export function formatSSEHeartbeat(sessionId: string): string {
  return `event: heartbeat\ndata: ${JSON.stringify({ sessionId, timestamp: Date.now() })}\n\n`;
}

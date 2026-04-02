"use client";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const USERNAME_KEY = "chat-demo-username";
const ACTIVE_MS = 5000;
const PRESENCE_INTERVAL_MS = 2000;
const TYPING_IDLE_MS = 2000;
const TYPING_DEBOUNCE_MS = 350;

const ADJECTIVES = [
  "Neon",
  "Quiet",
  "Swift",
  "Cosmic",
  "Silver",
  "Amber",
  "Velvet",
  "Arctic",
];

function pickUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = Math.floor(Math.random() * 900) + 100;
  return `${adj}${n}`;
}

function useStableUsername(): string {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let u = localStorage.getItem(USERNAME_KEY);
    if (!u) {
      u = pickUsername();
      localStorage.setItem(USERNAME_KEY, u);
    }
    setUsername(u);
  }, []);

  return username;
}

export function ChatRoom() {
  const username = useStableUsername();
  const messages = useQuery(api.messages.getMessages, {});
  const presenceRows = useQuery(api.presence.getPresence, {
    activeWithinMs: ACTIVE_MS,
  });

  const sendMessageBase = useMutation(api.messages.sendMessage);
  const sendMessage = useMemo(
    () =>
      sendMessageBase.withOptimisticUpdate((localStore, args) => {
        const existing = localStore.getQuery(api.messages.getMessages, {});
        if (existing === undefined) return;
        const trimmed = args.body.trim();
        if (!trimmed) return;
        const optimisticId =
          `jh7optimistic_${Date.now()}` as Id<"messages">;
        localStore.setQuery(api.messages.getMessages, {}, [
          ...existing,
          {
            _id: optimisticId,
            _creationTime: Date.now(),
            body: trimmed,
            user: args.user,
            createdAt: Date.now(),
          },
        ]);
      }),
    [sendMessageBase],
  );

  const updatePresence = useMutation(api.presence.updatePresence);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const flushTypingTrue = useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    typingDebounceRef.current = setTimeout(() => {
      void updatePresence({ user: username, typing: true });
      typingDebounceRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  }, [updatePresence, username]);

  const clearTypingServer = useCallback(() => {
    typingRef.current = false;
    void updatePresence({ user: username, typing: false });
  }, [updatePresence, username]);

  useEffect(() => {
    if (!username) return;
    void updatePresence({ user: username, typing: false });
  }, [username, updatePresence]);

  useEffect(() => {
    if (!username) return;
    const id = setInterval(() => {
      void updatePresence({
        user: username,
        typing: typingRef.current,
      });
    }, PRESENCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [username, updatePresence]);

  useEffect(() => {
    return () => {
      if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, []);

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!username) return;

    if (value.length === 0) {
      typingRef.current = false;
      if (typingIdleTimerRef.current) {
        clearTimeout(typingIdleTimerRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      void updatePresence({ user: username, typing: false });
      return;
    }

    typingRef.current = true;
    flushTypingTrue();

    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
    }
    typingIdleTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      void updatePresence({ user: username, typing: false });
      typingIdleTimerRef.current = null;
    }, TYPING_IDLE_MS);
  };

  const submit = async () => {
    if (!username) return;
    const body = draft.trim();
    if (!body) return;
    typingRef.current = false;
    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
    setDraft("");
    void updatePresence({ user: username, typing: false });
    await sendMessage({ body, user: username });
  };

  const onlineUsers = useMemo(() => {
    if (!presenceRows) return [];
    return presenceRows.map((p) => p.user);
  }, [presenceRows]);

  const typists = useMemo(() => {
    if (!presenceRows || !username) return [];
    return presenceRows
      .filter((p) => p.typing && p.user !== username)
      .map((p) => p.user);
  }, [presenceRows, username]);

  const typingLabel = useMemo(() => {
    if (typists.length === 0) return null;
    if (typists.length === 1) return `${typists[0]} is typing…`;
    if (typists.length === 2) return `${typists[0]} and ${typists[1]} are typing…`;
    return `${typists.slice(0, -1).join(", ")} and ${
      typists[typists.length - 1]
    } are typing…`;
  }, [typists]);

  if (!username) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500 text-sm">
        Preparing session…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col gap-4 px-3 py-6 md:flex-row md:px-4">
      <aside className="shrink-0 md:w-56">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Online
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Active in last {ACTIVE_MS / 1000}s
          </p>
          <ul className="mt-4 space-y-2">
            {onlineUsers.length === 0 ? (
              <li className="text-sm text-zinc-500">No one here yet</li>
            ) : (
              onlineUsers.map((u) => (
                <li key={u} className="flex items-center gap-2 text-sm">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-200">
                    {u.slice(0, 1).toUpperCase()}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-zinc-900 bg-emerald-400" />
                  </span>
                  <span
                    className={
                      u === username ? "text-emerald-200/90" : "text-zinc-300"
                    }
                  >
                    {u}
                    {u === username ? " (you)" : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <p className="mt-4 px-1 text-[11px] leading-relaxed text-zinc-600">
          Username is random and stored locally as{" "}
          <code className="text-zinc-400">{USERNAME_KEY}</code>.
        </p>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/30 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md">
        <header className="border-b border-zinc-800/80 px-5 py-4">
          <h1 className="text-lg font-medium tracking-tight text-zinc-100">
            Realtime room
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Convex subscriptions · presence · typing
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
          <div className="flex flex-col gap-3">
            {messages === undefined ? (
              <p className="text-center text-sm text-zinc-500">
                Loading messages…
              </p>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                Say hello — messages sync live to everyone.
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.article
                    layout
                    key={m._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-800/60 bg-zinc-950/60 px-4 py-3"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-zinc-400">
                        {m.user}
                      </span>
                      <time
                        className="text-[10px] tabular-nums text-zinc-600"
                        dateTime={new Date(m.createdAt).toISOString()}
                      >
                        {new Date(m.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-100">
                      {m.body}
                    </p>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="border-t border-zinc-800/80 p-3 md:p-4">
          <div className="mb-2 min-h-[1.25rem] px-1">
            <AnimatePresence mode="wait">
              {typingLabel ? (
                <motion.p
                  key={typingLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  className="text-xs italic text-zinc-500"
                >
                  {typingLabel}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Write a message…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/40"
            />
            <button
              type="button"
              onClick={() => void submit()}
              className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white active:scale-[0.98]"
            >
              Send
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

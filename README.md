# Realtime Chat · Next.js + Convex

Production-style demo: live messages, online presence (5s heartbeat window), and typing indicators. Stack: **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Convex**, **Framer Motion** (message and typing animations). Deployable on **Vercel** with your Convex cloud deployment.

## Prerequisites

- Node.js 18+
- A [Convex](https://www.convex.dev/) account (free tier is enough)

## Install

```bash
npm install
```

## Convex setup

1. From the project root, start Convex (first run will sign you in and create/link a project):

   ```bash
   npx convex dev
   ```

2. This command will:

   - Create or select a Convex project
   - Push `convex/schema.ts`, `convex/messages.ts`, and `convex/presence.ts`
   - Regenerate `convex/_generated/*`
   - Write `NEXT_PUBLIC_CONVEX_URL` (and related vars) to `.env.local`

3. Keep `npx convex dev` running in one terminal while you develop so functions stay synced, **or** run it whenever you change Convex code.

## Run the Next.js app

In a **second** terminal:

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:3000`). Open two browser windows to see realtime messages, presence, and typing.

## Vercel

1. Push the repo to GitHub and import the project in Vercel.
2. Set the environment variable **`NEXT_PUBLIC_CONVEX_URL`** in Vercel to the same value as in your local `.env.local` (from the Convex dashboard for your deployment).
3. Deploy. Run `npx convex deploy` for production Convex backend when you are ready to ship server-side changes.

## Features

| Feature            | Behavior |
|--------------------|----------|
| Username           | Random adjective + number, stored in `localStorage` under `chat-demo-username` |
| Messages           | `useQuery` + `sendMessage` mutation; optimistic append via `withOptimisticUpdate` |
| Presence           | `updatePresence` every **2s** and on typing changes; `getPresence` shows users active within **5s** |
| Typing             | Debounced **350ms** `typing: true`; idle **2s** sets `typing: false` |
| Stale presence rows | Removed in `updatePresence` when `lastSeen` is older than **60s** (DB cleanup) |

## Project layout

- `src/app/` — App Router UI, `ConvexClientProvider`, `page.tsx`
- `src/components/chat/ChatRoom.tsx` — main chat experience
- `convex/schema.ts` — `messages` + `presence` tables
- `convex/messages.ts` — `sendMessage`, `getMessages`
- `convex/presence.ts` — `updatePresence`, `getPresence`

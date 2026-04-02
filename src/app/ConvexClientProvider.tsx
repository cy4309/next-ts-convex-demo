"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(
    () => (url ? new ConvexReactClient(url) : null),
    [url],
  );

  if (!client) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-400 px-6 text-center text-sm leading-relaxed">
        <div className="max-w-md space-y-3">
          <p className="text-zinc-200 font-medium">Convex URL 尚未設定</p>
          <p>
            在專案根目錄執行{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-100">
              npx convex dev
            </code>{" "}
            ，依提示登入後會寫入{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-100">
              .env.local
            </code>{" "}
            的{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-100">
              NEXT_PUBLIC_CONVEX_URL
            </code>
            。
          </p>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

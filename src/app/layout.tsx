import type { Metadata } from "next";
import "@/assets/styles/globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "Realtime Chat · Convex",
  description: "Next.js realtime chat demo with Convex presence and typing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <ConvexClientProvider>
          <main className="mx-auto w-full min-h-dvh">{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wallet";
import { DemoProvider } from "./demo-context";
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <MotionConfig reducedMotion="user">
          <DemoProvider>{children}</DemoProvider>
        </MotionConfig>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

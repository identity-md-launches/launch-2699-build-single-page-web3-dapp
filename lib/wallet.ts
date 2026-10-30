import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors/coinbaseWallet";
import { injected } from "wagmi/connectors/injected";
import { baseSepolia } from "wagmi/chains";
// Wallet connection is optional. Every PLEA operation stays in the mock adapter.
// No contract is deployed or implied; no signatures or transactions are requested.
export const chain = baseSepolia;
export const config = createConfig({
  chains: [chain],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({ appName: "PLEA — Make your case." }),
  ],
  transports: { [chain.id]: http("https://sepolia.base.org") },
});

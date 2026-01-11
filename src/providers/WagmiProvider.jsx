import { wagmiConfig } from "../config/wagmi.js";
import { WagmiProvider as WagmiWagmiProvider } from "wagmi";

export function WagmiProvider({ children }) {
  return (
    <WagmiWagmiProvider config={wagmiConfig}>{children}</WagmiWagmiProvider>
  );
}

import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http } from "wagmi";
import { chainConfig } from "./chain";

export const wagmiConfig = createConfig({
  chains: [chainConfig.chain],
  transports: {
    [chainConfig.chain.id]: http(),
  },
  connectors: [miniAppConnector()],
});

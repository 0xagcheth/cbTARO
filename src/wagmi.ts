import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

/**
 * Wagmi configuration for cbTARO
 * Uses Farcaster Mini App connector for wallet connection in Farcaster/Base apps
 * According to: https://miniapps.farcaster.xyz/docs/guides/wallets
 */
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ],
})

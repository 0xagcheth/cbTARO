import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

/**
 * Wagmi configuration for cbTARO
 * Uses only Farcaster Mini App connector (canonical pattern)
 * 
 * According to:
 * - https://miniapps.farcaster.xyz/docs/guides/wallets
 */
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector() // Only connector: Farcaster Mini App
  ],
})

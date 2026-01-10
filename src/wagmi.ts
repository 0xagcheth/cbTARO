import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

/**
 * Wagmi configuration for cbTARO
 * Multi-environment support:
 * - Farcaster app: miniAppConnector() (primary)
 * - Base app: miniAppConnector() (primary)
 * - Browser: injected() (MetaMask/Coinbase fallback)
 * 
 * According to:
 * - https://miniapps.farcaster.xyz/docs/guides/wallets
 * - https://www.base.org/build/mini-apps
 */
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector(), // Primary: Farcaster & Base apps
    injected() // Fallback: Browser (MetaMask, Coinbase Wallet, etc.)
  ],
})

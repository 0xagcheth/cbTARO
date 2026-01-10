# Farcaster Mini Apps Wallet Implementation

## Overview

This document describes the implementation of Farcaster Mini Apps wallet integration for cbTARO, following the official guide at https://miniapps.farcaster.xyz/docs/guides/wallets.

## Payment Configuration

### Recipient Address
```
0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6
```

### Pricing (Hardcoded Constants)
- **3-card spread**: 0.0001 ETH
- **Custom spread**: 0.001 ETH
- **1-card spread**: Free (no payment required)

## Architecture

### Tech Stack
- **Wagmi v2**: React Hooks for Ethereum
- **Viem v2**: Low-level Ethereum interface
- **@tanstack/react-query v5**: Async state management for Wagmi
- **@farcaster/miniapp-wagmi-connector v1.1.0**: Farcaster-specific wallet connector

### Configuration Files

#### `src/wagmi.ts`
```typescript
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ],
})
```

#### `src/main.jsx`
```javascript
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './wagmi'

const queryClient = new QueryClient()

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Payment Flow

### 1. User Interaction
- User clicks on a paid spread option (3-card or custom)
- App checks if wallet is connected via `useAccount()` hook

### 2. Wallet Connection
```javascript
const { address, isConnected, chainId } = useAccount();
const { connect, connectors } = useConnect();

// Connect wallet if not connected
if (!isConnected) {
  connect({ connector: connectors[0] }); // Farcaster connector
}
```

### 3. Network Verification
```javascript
const { switchChain } = useSwitchChain();
const BASE_CHAIN_ID = 8453;

// Ensure user is on Base network
if (currentChainId !== BASE_CHAIN_ID) {
  await switchChain({ chainId: BASE_CHAIN_ID });
}
```

### 4. Payment Execution
```javascript
const { sendTransaction } = useSendTransaction();

// Send ETH transfer
sendTransaction({
  to: RECEIVER_ADDRESS,
  value: parseEther(amountETH), // "0.0001" or "0.001"
});
```

### 5. Transaction Handling
```javascript
const { isPending, isSuccess, error, data } = useSendTransaction();

useEffect(() => {
  if (isSuccess && data) {
    // Mark spread as paid for this session
    setPaidSpreads(prev => ({
      ...prev,
      [selectedSpread]: true
    }));
    
    // Start spread animation
    startSpreadAnimation(selectedSpread);
  } else if (error) {
    // Handle error
    console.error('Transaction failed:', error.message);
  }
}, [isSuccess, error, data]);
```

## Double-Charging Prevention

### Session-Based Tracking
```javascript
const [paidSpreads, setPaidSpreads] = useState({
  THREE: false,
  CUSTOM: false
});

// Before sending payment, check if already paid
if (paidSpreads.THREE) {
  console.log('Already paid for THREE spread in this session');
  await startSpreadAnimation('THREE');
  return;
}
```

### How It Works
1. When user pays for a spread, `paidSpreads[spreadType]` is set to `true`
2. If user tries to access the same spread again in the same session, payment is skipped
3. Spread animation starts directly without charging again
4. State resets when user refreshes the page (new session)

## Non-Farcaster Compatibility

### Environment Detection
```javascript
const isInMiniApp = window.isInMiniApp || false;
```

### Graceful Degradation
1. **In Farcaster/Base App**:
   - Uses Farcaster Mini App connector
   - Seamless wallet connection
   - Full payment functionality

2. **In Regular Browser**:
   - Shows informational message: "For best experience, open in Farcaster or Base app"
   - Free tarot reading (1-card) works normally
   - Paid spreads require MetaMask or compatible wallet
   - No crashes or errors

### UI Messages
```javascript
{!isInMiniApp && !isConnected && (
  <div className="wallet-error-message">
    💡 For best experience, open in Farcaster or Base app. 
    Free tarot reading works everywhere!
  </div>
)}
```

## Error Handling

### Connection Errors
- `no_provider`: Wallet provider not found
- `connection_failed`: Failed to connect wallet
- `not_connected`: User not connected when trying to pay

### Transaction Errors
- `wrong_chain`: User on wrong network (auto-switches to Base)
- `payment_failed`: Transaction failed or rejected
- User rejection: Graceful handling with informative alert

### UI Feedback
All errors display as styled messages instead of browser alerts:
```javascript
{walletError === 'payment_failed' && (
  <div className="wallet-error-message error">
    Payment failed. Please try again.
  </div>
)}
```

## UI Enhancements

### Spread Labels
- Single card: "Free"
- Three cards: "0.0001 ETH"
- Custom reading: "0.001 ETH"

### Price Display
Custom reading modal shows: "Custom Reading: 0.001 ETH"

## Files Changed

### Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.28.0",
    "wagmi": "^2.12.0",
    "viem": "^2.21.0",
    "@farcaster/miniapp-wagmi-connector": "^1.1.0"
  }
}
```

### Configuration
- `src/wagmi.ts`: New file - Wagmi configuration
- `src/main.jsx`: Wrapped app in providers
- `vite.config.js`: Already configured with `base: '/cbTARO/'`

### Application Logic
- `src/App.jsx`:
  - Replaced ethers.js with Wagmi hooks
  - Updated payment amounts (0.0001 → 0.0001, 0.0005 → 0.001)
  - Added session-based paid tracking
  - Added environment detection
  - Added UI labels and messages
  - Improved error handling

## Testing Checklist

### Local Development
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts dev server
- [ ] App loads at `http://localhost:5173/cbTARO/`
- [ ] Free 1-card reading works
- [ ] Paid spreads show correct pricing

### Production Build
- [ ] `npm run build` completes without errors
- [ ] `dist/` folder contains built assets
- [ ] `npm run preview` serves production build correctly
- [ ] Assets load without 404 errors

### Deployment
- [ ] GitHub Pages deployment succeeds
- [ ] App loads at `https://0xagcheth.github.io/cbTARO/`
- [ ] All assets load (no 404 for images/sounds)
- [ ] Manifest accessible at `https://0xagcheth.github.io/.well-known/farcaster.json`

### Farcaster Mini App
- [ ] App opens in Farcaster mobile app
- [ ] Wallet connects automatically or with one tap
- [ ] 3-card spread charges 0.0001 ETH
- [ ] Custom spread charges 0.001 ETH
- [ ] Transaction completes and spread reveals
- [ ] No double-charging when accessing same spread twice
- [ ] No "Ready not called" warning

### Browser Compatibility
- [ ] App works in Chrome/Safari/Firefox
- [ ] Free reading works without wallet
- [ ] Paid spreads prompt for MetaMask
- [ ] No crashes when wallet not available
- [ ] Informational message displays for non-Farcaster users

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Troubleshooting

### "No matching version found for @farcaster/miniapp-wagmi-connector@0.1.0"
**Solution**: Version 0.1.0 doesn't exist. Use `^1.1.0` instead.

### "Ready not called" in Farcaster
**Solution**: Ensure `@farcaster/miniapp-sdk` is properly initialized in `src/main.jsx` and `sdk.actions.ready()` is called after React renders.

### Assets 404 on GitHub Pages
**Solution**: Verify `vite.config.js` has `base: '/cbTARO/'` and rebuild.

### Wrong network error
**Solution**: App auto-switches to Base (8453). If it fails, user needs to manually switch in wallet.

### Payment not triggering spread
**Solution**: Check browser console for transaction errors. Ensure sufficient ETH balance on Base network.

## Security Considerations

1. **Recipient Address**: Hardcoded and immutable in source code
2. **Payment Amounts**: Hardcoded constants, not user-editable
3. **Session Tracking**: Client-side only, resets on page refresh
4. **No Backend**: All payments are direct on-chain transfers
5. **No Private Keys**: Wallet connection via Farcaster SDK or MetaMask

## Future Enhancements

- [ ] Add transaction history display
- [ ] Implement persistent paid tracking (localStorage or backend)
- [ ] Add receipt/proof of payment
- [ ] Support multiple payment tokens (USDC, etc.)
- [ ] Add refund mechanism for failed spreads
- [ ] Implement subscription model for unlimited readings

---

**Implementation Date**: January 2026  
**Farcaster Guide Version**: Latest (as of implementation)  
**Wagmi Version**: 2.12.0  
**Connector Version**: 1.1.0

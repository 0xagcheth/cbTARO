# cbTARO - Farcaster Mini App

Mystical tarot readings powered by AI on the Base network, designed as a Farcaster Mini App.

## 🚀 Live Demo
[https://0xagcheth.github.io/cbTARO/](https://0xagcheth.github.io/cbTARO/)

## 📱 Farcaster Hosted Manifest Setup

### Manifest File Location

The Farcaster manifest file is located at:
- **Repository**: `.well-known/farcaster.json`
- **Deployed URL**: `https://0xagcheth.github.io/.well-known/farcaster.json`

### Current Manifest Configuration

The manifest file uses the `frame` structure with the following configuration:
- **Name**: cbTARO
- **Version**: 1
- **Home URL**: `https://0xagcheth.github.io/cbTARO/`
- **Icon URL**: `https://0xagcheth.github.io/cbTARO/i.png`
- **Image URL**: `https://0xagcheth.github.io/cbTARO/f.png`
- **Button Title**: "Open Taro"
- **Splash Image URL**: `https://0xagcheth.github.io/cbTARO/s.png`
- **Splash Background Color**: `#0b1020`
- **Subtitle**: "Onchain TARO"
- **Description**: "A mystical onchain taro experience. Draw cards, share results, and explore meanings directly inside Farcaster."
- **Primary Category**: entertainment
- **Tags**: taro, crypto, onchain, mystic
- **Tagline**: "Draw your fate onchain"
- **OG Title**: "cbTARO — Onchain Taro Reading"
- **Account Association**: Configured with FID 21051

### Verifying Manifest Accessibility

To verify that the manifest is accessible:

1. **Open in browser**:
   ```
   https://0xagcheth.github.io/.well-known/farcaster.json
   ```

2. **Expected result**: You should see valid JSON (not 404 or HTML error page)

3. **Check JSON validity**: The response should be a valid JSON object with the `frame` structure:
   ```json
   {
     "frame": {
       "name": "cbTARO",
       "version": "1",
       "iconUrl": "https://0xagcheth.github.io/cbTARO/i.png",
       "homeUrl": "https://0xagcheth.github.io/cbTARO/",
       "imageUrl": "https://0xagcheth.github.io/cbTARO/f.png",
       "buttonTitle": "Open Taro",
       "splashImageUrl": "https://0xagcheth.github.io/cbTARO/s.png",
       "splashBackgroundColor": "#0b1020"
     },
     "accountAssociation": {
       "header": "...",
       "payload": "...",
       "signature": "..."
     }
   }
   ```

### Farcaster Developers Portal Configuration

When setting up the Mini App in Farcaster Developers → Hosted Manifests:

1. **Domain**: `0xagcheth.github.io`
   - This is the domain where the manifest file is hosted
   - Farcaster will look for the manifest at `https://0xagcheth.github.io/.well-known/farcaster.json`

2. **Home URL**: `https://0xagcheth.github.io/cbTARO/`
   - This is the URL where your Mini App is hosted
   - Should match the `homeUrl` in the manifest file

3. **Webhook URL**: Leave empty (not required for basic setup)

4. **App Name**: `cbTARO`
   - Should match the `name` field in the manifest

5. **Icon**: The icon will be automatically read from `iconUrl` in the manifest
   - Current: `https://0xagcheth.github.io/cbTARO/i.png`

6. **Splash Image**: The splash image will be automatically read from `splashImageUrl` in the manifest
   - Current: `https://0xagcheth.github.io/cbTARO/s.png`

### Deployment Notes

The manifest file is automatically deployed via GitHub Actions:
- The main deployment workflow (`.github/workflows/deploy.yml`) handles both the app and `.well-known` deployment
- The workflow creates a deployment structure with:
  - `cbTARO/` - Your Mini App (from Vite build output)
  - `.well-known/` - Farcaster manifest file (in root of GitHub Pages)
- When you push changes to `main` branch, both the app and manifest are deployed together

### Troubleshooting

If you see "Invalid farcaster.json" error in Farcaster:

1. **Check file accessibility**: Open `https://0xagcheth.github.io/.well-known/farcaster.json` in a browser
2. **Verify JSON validity**: Use a JSON validator to ensure the file is valid JSON
3. **Check URLs**: Ensure all URLs in the manifest are absolute and accessible
4. **Check file encoding**: The file should be UTF-8 encoded
5. **Verify deployment**: Check GitHub Actions logs to ensure the file was deployed successfully

## 📋 Farcaster Mini App Checklist

### ✅ Completed Setup

- [x] **Mini App Embed Meta Tags**
  - Added `meta name="fc:miniapp"` with JSON embed data
  - Added legacy `meta property="fc:frame"` for backward compatibility
  - JSON contains version="1", imageUrl (3:2 ratio), button with launch_frame action

- [x] **Manifest File**
  - Created `/.well-known/farcaster.json` with miniapp object
  - Includes accountAssociation (needs real values), miniapp config
  - All URLs point to correct GitHub Pages domain

- [x] **Farcaster SDK Integration**
  - Added `@farcaster/frame-sdk@0.0.32` via CDN
  - Multiple SDK name detection (`window.farcaster`, `window.farcasterSDK`, `window.sdk`, `window.FarcasterSDK`)
  - Comprehensive ready() call with multiple fallback mechanisms
  - Global script for immediate SDK detection
  - React component backup check
  - Detailed console logging for debugging
  - Graceful fallback for non-Farcaster environments

- [x] **Open Graph Tags**
  - Added og:title, og:description, og:image, og:url, og:type
  - Ensures proper sharing outside Farcaster

### 🔧 Required Assets

Before deployment, ensure these assets exist and are accessible:

- [ ] **Hero Image (1200x630)**: `Assets/imagine/b.png` - Used for manifest and OG
- [ ] **Icon (1024x1024, PNG without alpha)**: `Assets/imagine/cr.png` - Used for manifest icon
- [ ] **Splash Image (200x200)**: `Assets/imagine/cr.png` - Used for loading splash

### 🔐 Account Association Setup

The `accountAssociation` in `.well-known/farcaster.json` needs real values:

1. **Domain**: Must be `0xagcheth.github.io` (FQDN where manifest is hosted)
2. **FID**: Your Farcaster user ID (e.g., 11861 for @0xagcheth)
3. **Custody/Auth**: Use Warpcast developer tools or farcaster.xyz custody to generate

Replace placeholders in `.well-known/farcaster.json`:
```json
{
  "accountAssociation": {
    "header": "<PASTE_REAL_BASE64_HEADER>",
    "payload": "<PASTE_REAL_BASE64_PAYLOAD>",
    "signature": "<PASTE_REAL_BASE64_SIGNATURE>"
  }
}
```

### 🧪 Testing Checklist

- [ ] **Embed Test**: Share link in Warpcast - should show rich embed with image and "Start" button
- [ ] **Launch Test**: Click button - should open mini app with splash screen
- [ ] **Ready Test**: App should hide splash after loading (no "Ready not called" error)
- [ ] **Mobile WebView Test**: UI should display correctly in Farcaster mobile app without cropping/scaling issues
- [ ] **Safe Area Test**: Content should not be hidden behind notches/home indicators
- [ ] **Manifest Test**: `https://0xagcheth.github.io/.well-known/farcaster.json` returns valid JSON
- [ ] **HTTPS Test**: All URLs use HTTPS, no mixed content warnings

### 📱 Mobile WebView Fixes Applied

- [x] **Dynamic Viewport Height**: Replaced `100vh` with `calc(var(--vh, 1vh) * 100)` and JavaScript calculation
- [x] **Background Attachment**: Changed from `fixed` to `scroll` for WebView compatibility
- [x] **Safe Area Padding**: Added `env(safe-area-inset-*)` padding to body and fixed elements
- [x] **Orientation Handling**: Added resize/orientationchange listeners for viewport updates
- [x] **Debug Logging**: Added viewport size logging when `?debug=1` parameter is present

**Debug URL**: `https://0xagcheth.github.io/cbTARO/?debug=1` (check console for viewport info)

### 📱 Features

- **1 Card Reading**: Free daily tarot card
- **3 Card Reading**: 0.0001 ETH per reading (paid spreads)
- **Custom Reading**: 0.001 ETH per reading (paid spreads)
- **Share on Farcaster**: Generate images and share readings
- **Usage Tracking**: CSV export for admin wallet
- **Wallet Integration**: Seamless wallet connection via Farcaster Mini App SDK

### 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Web3**: Wagmi v2 + Viem + @tanstack/react-query
- **Wallet Connector**: @farcaster/miniapp-wagmi-connector
- **Blockchain**: Base network (Chain ID: 8453)
- **Payments**: Native ETH transfers
- **Hosting**: GitHub Pages
- **Mini App**: Farcaster Frame SDK
- **Analytics**: Cloudflare Worker + D1 Database

### 💰 Wallet & Payments Implementation

This app implements Farcaster Mini Apps wallet integration following the official guide at [https://miniapps.farcaster.xyz/docs/guides/wallets](https://miniapps.farcaster.xyz/docs/guides/wallets).

#### Payment Configuration

**Recipient Address**: `0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6`

**Pricing** (hardcoded constants):
- 3-card spread: **0.0001 ETH**
- Custom spread: **0.001 ETH**

#### Implementation Details

1. **Wagmi + Farcaster Connector**:
   - Uses `wagmi` v2 with `@farcaster/miniapp-wagmi-connector`
   - Configured for Base chain (8453)
   - Wrapped in `QueryClientProvider` + `WagmiProvider`

2. **Payment Flow**:
   - User clicks paid spread → checks wallet connection
   - If not connected → prompts to connect
   - Sends ETH transfer to recipient address
   - On transaction hash → marks spread as paid for session
   - Prevents double-charging via session-based `paidSpreads` state
   - Starts spread animation after successful payment

3. **Non-Farcaster Compatibility**:
   - Works outside Farcaster (regular browser)
   - Shows informational message: "For best experience, open in Farcaster or Base app"
   - Free tarot reading (1-card) works everywhere
   - Paid spreads require wallet connection (MetaMask or similar in browser)

4. **Error Handling**:
   - Graceful handling of rejected transactions
   - Network switching (auto-switch to Base if wrong chain)
   - Clear UI messages instead of alerts
   - No crashes outside Farcaster environment

#### Files Changed

- `package.json`: Added `@tanstack/react-query`, updated `@farcaster/miniapp-wagmi-connector` to `^1.1.0`
- `src/wagmi.ts`: Wagmi config with Base chain and Farcaster connector
- `src/main.jsx`: Wrapped app in `QueryClientProvider` + `WagmiProvider`
- `src/App.jsx`:
  - Replaced ethers.js wallet logic with Wagmi hooks
  - Updated payment amounts (0.0001 ETH for THREE, 0.001 ETH for CUSTOM)
  - Added session-based `paidSpreads` tracking
  - Added `isInMiniApp` detection
  - Added UI labels for spread pricing
  - Added informational message for non-Farcaster users

### 🚀 Deployment

#### Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:5173/cbTARO/
```

#### Build & Deploy to GitHub Pages

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

#### Deployment Checklist

1. ✅ Update accountAssociation with real values in `.well-known/farcaster.json`
2. ✅ Ensure all assets exist at correct URLs
3. ✅ Verify `vite.config.js` has `base: '/cbTARO/'`
4. ✅ Run `npm run build` and check `dist/` output
5. ✅ Deploy to GitHub Pages via `npm run deploy` or GitHub Actions
6. ✅ Test manifest accessibility: `https://0xagcheth.github.io/.well-known/farcaster.json`
7. ✅ Test app loads without 404 for assets: `https://0xagcheth.github.io/cbTARO/`
8. ✅ Share link in Farcaster to test embed and wallet connection

### 📊 Analytics Setup (Cloudflare Worker + D1)

The app tracks user statistics by FID using Cloudflare Worker and D1 database.

#### Backend Setup

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Create D1 Database**:
   ```bash
   cd worker
   wrangler d1 create cbtaro-stats
   ```
   Copy the `database_id` from the output.

4. **Update `wrangler.toml`**:
   - Replace `YOUR_DATABASE_ID_HERE` with the actual database ID from step 3.

5. **Apply Migrations**:
   ```bash
   wrangler d1 migrations apply cbtaro-stats
   ```

6. **Deploy Worker**:
   ```bash
   wrangler deploy
   ```
   Copy the worker URL (e.g., `https://cbtaro-analytics.your-subdomain.workers.dev`).

#### Frontend Configuration

1. **Set Environment Variable**:
   Create `.env` file or set in build environment:
   ```
   VITE_ANALYTICS_API_BASE=https://cbtaro-analytics.your-subdomain.workers.dev
   ```

2. **Rebuild Frontend**:
   ```bash
   npm run build
   ```

#### Analytics Features

- **User Statistics**: Tracks readings by FID (not device)
- **Daily Streak**: Calculated with 01:00 UTC cutoff
- **Reading Counts**: Total and per-type (one/three/custom)
- **Timestamps**: First seen, last seen
- **Wallet Tracking**: Optional wallet address association

See `worker/README.md` for detailed API documentation.

### 🔧 Debug Mode

To debug mobile layout issues, add `?debug=1` to the URL:

```
https://0xagcheth.github.io/cbTARO/?debug=1
```

This will:
- Show red outlines around ALL containers to identify layout cutters
- Display viewport size in top-right corner
- Log detailed viewport and safe area information to console
- Color-code different container types:
  - 🔴 Red: Root containers
  - 🟠 Orange: Main containers
  - 🟣 Purple: Modals/overlays
  - 🔵 Blue: Tables
  - 🟢 Green: Cards
  - 🟡 Yellow: Options/buttons

### 📚 Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz)
- [Farcaster Developer Docs](https://docs.farcaster.xyz/)
- [Mini App SDK Reference](https://miniapps.farcaster.xyz/docs/sdk)
- [Wallet Integration Guide](https://miniapps.farcaster.xyz/docs/guides/ethereum-wallet)

### 📖 Project Documentation

- `README.md` - Main project documentation
- `WALLET_IMPLEMENTATION.md` - Wallet & payments technical details
- `FARCASTER_MINIAPP_GUIDE.md` - **Complete Farcaster Mini Apps integration guide** (Russian)
- `worker/README.md` - Analytics backend documentation

---

Built with ❤️ for the Farcaster ecosystem

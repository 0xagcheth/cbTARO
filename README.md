# cbTARO - Farcaster Mini App

Mystical tarot readings powered by AI on the Base network, designed as a Farcaster Mini App.

## 🚀 Live Demo
[https://0xagcheth.github.io/cbTARO/](https://0xagcheth.github.io/cbTARO/)

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
- **3 Card Reading**: 0.0001 ETH per reading
- **Custom Reading**: 0.0005 ETH per reading
- **Share on Farcaster**: Generate images and share readings
- **Usage Tracking**: CSV export for admin wallet

### 🛠️ Tech Stack

- **Frontend**: React 18 + Babel (CDN)
- **Web3**: Ethers.js v5
- **Blockchain**: Base network
- **Payments**: USDC ERC-20
- **Hosting**: GitHub Pages
- **Mini App**: Farcaster Frame SDK
- **Analytics**: Cloudflare Worker + D1 Database

### 🚀 Deployment

1. Update accountAssociation with real values
2. Ensure all assets exist at correct URLs
3. Deploy to GitHub Pages
4. Test manifest accessibility: `https://0xagcheth.github.io/.well-known/farcaster.json`
5. Share link in Farcaster to test embed

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

- [Farcaster Mini Apps Spec](https://miniapps.farcaster.xyz/specification)
- [Farcaster Developer Docs](https://docs.farcaster.xyz/)
- [Frame SDK](https://github.com/farcasterxyz/frame-sdk)

---

Built with ❤️ for the Farcaster ecosystem

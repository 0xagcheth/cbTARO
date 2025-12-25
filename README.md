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
  - Added `@farcaster/frame-sdk` via CDN
  - Implemented `ready()` call when UI loads
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
- [ ] **Ready Test**: App should hide splash after loading
- [ ] **Manifest Test**: `https://0xagcheth.github.io/.well-known/farcaster.json` returns valid JSON
- [ ] **HTTPS Test**: All URLs use HTTPS, no mixed content warnings

### 📱 Features

- **1 Card Reading**: Free daily tarot card
- **3 Card Reading**: 0.01 USDC (one-time unlock)
- **Custom Reading**: 1.00 USDC per reading
- **Share on Farcaster**: Generate images and share readings
- **Usage Tracking**: CSV export for admin wallet

### 🛠️ Tech Stack

- **Frontend**: React 18 + Babel (CDN)
- **Web3**: Ethers.js v5
- **Blockchain**: Base network
- **Payments**: USDC ERC-20
- **Hosting**: GitHub Pages
- **Mini App**: Farcaster Frame SDK

### 🚀 Deployment

1. Update accountAssociation with real values
2. Ensure all assets exist at correct URLs
3. Deploy to GitHub Pages
4. Test manifest accessibility: `https://0xagcheth.github.io/.well-known/farcaster.json`
5. Share link in Farcaster to test embed

### 📚 Resources

- [Farcaster Mini Apps Spec](https://miniapps.farcaster.xyz/specification)
- [Farcaster Developer Docs](https://docs.farcaster.xyz/)
- [Frame SDK](https://github.com/farcasterxyz/frame-sdk)

---

Built with ❤️ for the Farcaster ecosystem

/**
 * Share text utility
 * Guarantees that share URL is always at the end of share text
 */

const APP_URL = "https://0xagcheth.github.io/cbTARO/";
const BASE_SHARE = "https://0xagcheth.github.io/cbTARO/share";

/**
 * Builds share text with share URL guaranteed at the end
 * @param {string} baseText - Base text to share
 * @returns {string} - Final text with share URL at the end (with cache-bust)
 */
export function buildShareText(baseText) {
  // Trim whitespace
  let text = (baseText || "").trim();
  
  // If empty, use default message
  if (!text) {
    text = "My Taro Reading ✨";
  }
  
  // Remove old URLs if they exist anywhere in the text
  const appUrlPattern = new RegExp(APP_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const shareUrlPattern = new RegExp(BASE_SHARE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  text = text.replace(appUrlPattern, '').replace(shareUrlPattern, '').trim();
  
  // Remove trailing newlines and whitespace
  text = text.replace(/\n+$/, '').trim();
  
  // Ensure share link is at the end with proper formatting
  // Add empty line before link if text doesn't end with newline
  if (!text.endsWith('\n')) {
    text += '\n';
  } else {
    // If ends with newline, ensure single newline before link
    text = text.replace(/\n+$/, '\n');
  }
  
  // Cache-bust parameter: v=Date.now() forces embed refresh (prevents caching)
  // This ensures Farcaster always fetches fresh meta tags for embed preview
  const shareUrl = `${BASE_SHARE}?v=${Date.now()}`;
  
  // Append shareUrl without any trailing space - ensure clean concatenation
  // IMPORTANT: shareUrl must be the very last characters, no trailing whitespace
  text += shareUrl;
  
  // Final trimEnd() to remove any accidental trailing spaces/newlines
  // This ensures shareUrl is the absolute last characters
  return text.trimEnd();
}

/**
 * Share cast using Farcaster Mini App SDK or fallback methods
 * @param {Object} options - Share options
 * @param {string} options.text - Text to share (will be processed by buildShareText)
 * @param {Array<string>} [options.embeds] - Optional embeds (URLs)
 * @returns {Promise<boolean>} - Success status
 */
export async function shareCast({ text, embeds = [] }) {
  // buildShareText ensures share URL (with cache-bust) is at the end of text
  const finalText = buildShareText(text);
  
  // Extract shareUrl from finalText (it's at the end)
  // Cache-bust parameter ensures fresh embed fetch
  const shareUrlMatch = finalText.match(/https:\/\/0xagcheth\.github\.io\/cbTARO\/share\?v=\d+/);
  const shareUrl = shareUrlMatch ? shareUrlMatch[0] : `${BASE_SHARE}?v=${Date.now()}`;
  
  // Remove old URLs from embeds, but keep other embeds (like card images)
  const finalEmbeds = embeds.filter(embed => 
    !embed.includes(APP_URL) && !embed.includes(BASE_SHARE)
  );
  // Add shareUrl as embed to ensure embed card rendering
  // finalText already contains shareUrl at the end, but embeds ensures preview
  finalEmbeds.push(shareUrl);
  
  try {
    // Try Farcaster Mini App SDK first
    const sdk = window.miniAppSDK || window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
    const isInMiniApp = window.isInMiniApp || (sdk && sdk.isInMiniApp && sdk.isInMiniApp());
    
    if (isInMiniApp && sdk?.actions?.composeCast) {
      try {
        await sdk.actions.composeCast({
          text: finalText,  // shareUrl is already in text (from buildShareText)
          embeds: finalEmbeds  // shareUrl in embeds ensures embed card rendering
        });
        if (import.meta.env.DEV) {
          console.debug('Shared via Farcaster Mini App SDK');
        }
        return true;
      } catch (error) {
        console.warn('Failed to share via SDK, trying fallback:', error);
      }
    }
    
    // Fallback: navigator.share
    if (navigator.share) {
      try {
        // finalText already contains APP_URL at the end (from buildShareText)
        // navigator.share will use text field, url is optional and may duplicate
        await navigator.share({
          text: finalText
        });
        if (import.meta.env.DEV) {
          console.debug('Shared via navigator.share');
        }
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('navigator.share failed, trying clipboard:', error);
        } else {
          // User cancelled, don't try clipboard
          return false;
        }
      }
    }
    
    // Final fallback: clipboard
    try {
      // finalText already contains APP_URL at the end (from buildShareText)
      await navigator.clipboard.writeText(finalText);
      if (import.meta.env.DEV) {
        console.debug('Copied to clipboard');
      }
      // Show user feedback
      if (typeof window !== 'undefined' && window.alert) {
        alert('Copied to clipboard!');
      }
      return true;
    } catch (error) {
      console.error('All share methods failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
}


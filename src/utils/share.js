/**
 * Share text utility
 * Guarantees that app link is always at the end of share text
 */

const APP_URL = "https://0xagcheth.github.io/cbTARO/";

/**
 * Builds share text with app link guaranteed at the end
 * @param {string} baseText - Base text to share
 * @returns {string} - Final text with app link at the end
 */
export function buildShareText(baseText) {
  // Trim whitespace
  let text = (baseText || "").trim();
  
  // If empty, use default message
  if (!text) {
    text = "My Taro Reading ✨";
  }
  
  // Remove app URL if it exists anywhere in the text
  const urlPattern = new RegExp(APP_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  text = text.replace(urlPattern, '').trim();
  
  // Remove trailing newlines and whitespace
  text = text.replace(/\n+$/, '').trim();
  
  // Ensure app link is at the end with proper formatting
  // Add empty line before link if text doesn't end with newline
  if (!text.endsWith('\n')) {
    text += '\n\n';
  } else {
    // If ends with newline, ensure double newline before link
    text = text.replace(/\n+$/, '\n\n');
  }
  
  text += APP_URL;
  
  return text;
}

/**
 * Share cast using Farcaster Mini App SDK or fallback methods
 * @param {Object} options - Share options
 * @param {string} options.text - Text to share (will be processed by buildShareText)
 * @param {Array<string>} [options.embeds] - Optional embeds (URLs)
 * @returns {Promise<boolean>} - Success status
 */
export async function shareCast({ text, embeds = [] }) {
  const finalText = buildShareText(text);
  const finalEmbeds = [APP_URL, ...embeds].filter(Boolean);
  
  try {
    // Try Farcaster Mini App SDK first
    const sdk = window.miniAppSDK || window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
    const isInMiniApp = window.isInMiniApp || (sdk && sdk.isInMiniApp && sdk.isInMiniApp());
    
    if (isInMiniApp && sdk?.actions?.composeCast) {
      try {
        await sdk.actions.composeCast({
          text: finalText,
          embeds: finalEmbeds
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
        await navigator.share({
          text: finalText,
          url: APP_URL
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
      await navigator.clipboard.writeText(`${finalText}\n${APP_URL}`);
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


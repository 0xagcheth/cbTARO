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


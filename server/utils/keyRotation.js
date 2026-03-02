/**
 * Gemini API Key Rotation Utility
 * 
 * Manages multiple API keys to increase rate limits (RPM) and daily quotas (RPD)
 * for the Free Tier of Google Gemini.
 */

// Load all available keys from environment variables
const getAvailableKeys = () => {
    const keys = [];
    
    // Add primary key
    if (process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }
    
    // Add additional keys (up to 10)
    for (let i = 2; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key && key.trim()) {
            keys.push(key.trim());
        }
    }
    
    return keys;
};

let currentKeyIndex = 0;
let apiKeys = getAvailableKeys();

/**
 * Get the next available API key in a round-robin fashion.
 * If keys have changed in .env, it refreshes the list.
 */
const getNextKey = () => {
    // Refresh list in case keys were added dynamically (or for initial load)
    const freshKeys = getAvailableKeys();
    
    // Update our internal list if it changed
    if (freshKeys.length !== apiKeys.length) {
        apiKeys = freshKeys;
    }

    if (apiKeys.length === 0) {
        console.error('❌ No Gemini API keys found in environment variables!');
        return null;
    }

    const key = apiKeys[currentKeyIndex];
    
    // Log rotation for visibility (optional, good for debugging)
    // console.log(`🔄 Using Gemini API Key ${currentKeyIndex + 1} of ${apiKeys.length}`);
    
    // Move to next key for next request
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    return key;
};

/**
 * Get total number of configured keys
 */
const getKeyCount = () => {
    return getAvailableKeys().length;
};

module.exports = {
    getNextKey,
    getKeyCount
};

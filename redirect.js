// database-redirect.js - Cloudflare KV fallback for Render
const fs = require('fs');
const path = require('path');

const CF_WORKER_URL = 'https://id.crysnovax.link';
const USE_CLOUDFLARE = process.env.RENDER === 'true';

// Original fs functions
const originalReadFile = fs.readFileSync;
const originalWriteFile = fs.writeFileSync;
const originalReadDir = fs.readdirSync;
const originalExists = fs.existsSync;

// Cache for Cloudflare data
const kvCache = new Map();

async function loadFromCloudflare(key) {
    try {
        const response = await fetch(`${CF_WORKER_URL}/db/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });
        const result = await response.json();
        if (result.success && result.data) {
            kvCache.set(key, result.data);
            return result.data;
        }
        return null;
    } catch (err) {
        console.log(`⚠️ Cloudflare load failed for ${key}:`, err.message);
        return null;
    }
}

async function saveToCloudflare(key, data) {
    try {
        const response = await fetch(`${CF_WORKER_URL}/db/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, data: data })
        });
        const result = await response.json();
        if (result.success) {
            kvCache.set(key, data);
        }
        return result.success;
    } catch (err) {
        console.log(`⚠️ Cloudflare save failed for ${key}:`, err.message);
        return false;
    }
}

// Override fs functions only on Render
if (USE_CLOUDFLARE) {
    console.log('☁️ Using Cloudflare KV for database storage (Render mode)');
    
    // Override readFileSync for database files
    fs.readFileSync = function(filePath, encoding) {
        const fileStr = String(filePath);
        if (fileStr.includes('database/') && fileStr.endsWith('.json')) {
            const key = path.basename(fileStr, '.json');
            
            // Check cache first
            if (kvCache.has(key)) {
                return kvCache.get(key);
            }
            
            // Try to load from Cloudflare (sync wrapper)
            let result = null;
            loadFromCloudflare(key).then(data => {
                if (data) result = data;
            });
            
            // Wait a bit for async (hacky but works)
            const start = Date.now();
            while (!result && Date.now() - start < 100) {
                require('deasync').runLoopOnce();
            }
            
            if (result) {
                return result;
            }
        }
        return originalReadFile.call(fs, filePath, encoding);
    };
    
    // Override writeFileSync for database files
    fs.writeFileSync = function(filePath, data, encoding) {
        const fileStr = String(filePath);
        if (fileStr.includes('database/') && fileStr.endsWith('.json')) {
            const key = path.basename(fileStr, '.json');
            const dataStr = typeof data === 'string' ? data : data.toString();
            
            // Save to Cloudflare (async, don't wait)
            saveToCloudflare(key, dataStr);
            
            // Update cache
            kvCache.set(key, dataStr);
        }
        return originalWriteFile.call(fs, filePath, data, encoding);
    };
    
    // Ensure local database directory exists (for compatibility)
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database', { recursive: true });
    }
} else {
    console.log('💾 Using local database storage (non-Render mode)');
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database', { recursive: true });
    }
}

module.exports = { USE_CLOUDFLARE };

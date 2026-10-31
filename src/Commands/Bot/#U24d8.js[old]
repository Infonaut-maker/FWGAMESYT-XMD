/**
 * menu.js — CODY AI Menu Command
 * Fixed: Gets user name and number from message object
 */

const { getByCategory, getAll } = require('../../Plugin/crysCmd');
const os = require('os');

const DIVIDER = '⿻ ⿻ ⿻ ⿻ ⿻ ⿻ ⿻ ⿻ ⿻ ⿻';
const READMORE = '\u200E'.repeat(515);

const CATEGORY_ICONS = {
    'ai': 'ಠ_ಠ',
    'search': '❔',
    'admin': '🜲',
    'anime': '㋛',
    'audio': '𝄞',
    'bot': '⚉',
    'converter': '℘',
    'core': '𓀀',
    'documents': '𓂃✍︎',
    'downloader': '⎙',
    'economy': '𓃼',
    'fun': 'ಥ⁠‿⁠ಥ',
    'games': '◈',
    'group': '⃝⃘̉̉̉━⋆',
    'media': '( ͡❛ ₃ ͡❛)',
    'media-editor': '✐',
    'overlays': '彡',
    'owner': '𓋎⚇',
    'quiz': '◈',
    'reaction': '◈',
    'system': '◈',
    'tools': '⎔',
    'utils': '❂'
};

function getCategoryIcon(cat) {
    return CATEGORY_ICONS[cat.toLowerCase()] || '◈';
}

function formatUptime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function getStorage() {
    try {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
        const totalGB = (total / 1024 / 1024 / 1024).toFixed(1);
        const percent = Math.floor((used / total) * 100);
        return `${usedGB}/${totalGB}GB (${percent}%)`;
    } catch {
        return 'N/A';
    }
}

// Function to get user name from message
async function getUserName(sock, m) {
    try {
        // Try to get from pushName first
        if (m.pushName) return m.pushName;
        
        // Try from sender
        const sender = m.sender || m.key?.remoteJid;
        if (sender) {
            // Try from store contacts
            if (sock.store?.contacts?.get) {
                const contact = sock.store.contacts.get(sender);
                if (contact?.notify) return contact.notify;
                if (contact?.name) return contact.name;
            }
            // Try from global contacts
            if (global.contacts && global.contacts[sender]) {
                if (global.contacts[sender].notify) return global.contacts[sender].notify;
                if (global.contacts[sender].name) return global.contacts[sender].name;
            }
        }
        return 'User';
    } catch {
        return 'User';
    }
}

// Function to get user number from message
function getUserNumber(m) {
    try {
        let jid = m.sender || m.key?.remoteJid || m.from;
        if (jid) {
            // Extract number from JID (remove @s.whatsapp.net or @g.us)
            let number = jid.split('@')[0];
            // Remove any non-digit characters
            number = number.replace(/\D/g, '');
            if (number && number.length >= 10) return number;
        }
        return 'Unknown';
    } catch {
        return 'Unknown';
    }
}

module.exports = {
    name: 'menu',
    alias: ['help', 'list'],
    desc: 'Show CODY AI menu with all commands',
    category: 'Bot',
    reactions: { start: '💬', success: '✨' },
    execute: async (sock, m, { prefix, config }) => {
        
        // Get user info directly from message
        const userName = await getUserName(sock, m);
        const userNum = getUserNumber(m);
        
        const botName = config.settings?.title || '_*✦ CODY AI*_';
        const uptimeMin = Math.floor(process.uptime() / 60);
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const storage = getStorage();
        
        // Get categories and commands
        const categories = getByCategory() || {};
        
        // Count unique commands (without aliases)
        let totalCmds = 0;
        const allCommands = getAll();
        if (allCommands && typeof allCommands.forEach === 'function') {
            const uniqueNames = new Set();
            allCommands.forEach((cmd, key) => {
                const originalName = cmd.cmd || cmd.name || key;
                if (!cmd.aliasOf && !uniqueNames.has(originalName)) {
                    uniqueNames.add(originalName);
                    totalCmds++;
                }
            });
        } else if (allCommands && typeof allCommands.size === 'number') {
            totalCmds = allCommands.size;
        }
        
        // Build menu text
        let text = '';
        text += `⌘ ══〔 *${botName}* 〕══ ⌘\n`;
        text += `${DIVIDER}\n\n`;
        text += `𒆜 ✦ *Hello, ${userName}*\n`;
        text += `❏◦ Number  · ⇆ ${userNum}\n`;
        text += `❏◦ Prefix  ·  ⇆ [ ${prefix} ]\n`;
        text += `❏◦ Cmds    · ⇆ ${totalCmds} commands\n`;
        text += `❏◦ Uptime  · ⇆ ${formatUptime(uptimeMin)}\n`;
        text += `❏◦ Time    · ⇆ ${time}\n`;
        text += `❏◦ RAM     · ⇆ ${storage}\n`;
        text += `${DIVIDER}\n`;
        text += READMORE;
        
        // List commands by category
        for (const [catName, cmds] of Object.entries(categories)) {
            if (!cmds || cmds.length === 0) continue;
            const icon = getCategoryIcon(catName);
            text += `\n𒆜 ◈ *${catName.toUpperCase()}* ${icon}\n`;
            const seen = new Set();
            for (const cmd of cmds) {
                const cmdName = cmd.cmd || cmd.name;
                if (!cmdName) continue;
                if (cmd.aliasOf) continue;
                if (seen.has(cmdName.toLowerCase())) continue;
                seen.add(cmdName.toLowerCase());
                text += `❏◦ ➫ ${prefix}${cmdName}\n`;
            }
        }
        
        text += `\n⌘ ══〔 ☠︎︎ 𝗖𝗢𝗗𝗬 ⋆ 𝗔𝗜 〕══ ⌘`;
        
        // Get fresh config each execution (not cached) so changes apply without restart
        const freshConfig = require('../../../settings/config');
        const thumbUrl = freshConfig.thumbUrl || 'https://cdn.crysnovax.link/files/1778529162616-eca99707-7b11-453a-802a-e85a9d1c2395.jpeg';
        
        // Detect if thumbUrl is a GIF/video by file extension
        const isGif = /\.(mp4|gif|webm|mov)$/i.test(thumbUrl);
        
        const messagePayload = {
            caption: text,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                participant: '0@s.whatsapp.net',
                remoteJid: '0@s.whatsapp.net'
            }
        };
        
        if (isGif) {
            messagePayload.video = { url: thumbUrl };
            messagePayload.gifPlayback = true;
        } else {
            messagePayload.image = { url: thumbUrl };
        }
        
        await sock.sendMessage(m.chat, messagePayload);
    }
};

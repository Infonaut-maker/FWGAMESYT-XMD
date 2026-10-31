/**
 * ping.js — CODY AI Ping Command
 * Shows bot response latency
 */

module.exports = {
    name: 'ping',
    alias: ['pong', 'latency'],
    desc: 'Check bot response time',
    category: 'Bot',
    reactions: { start: '🏷️', success: '📡' },
    execute: async (sock, m, { reply, edit }) => {
        
        const start = Date.now();
        
        // Send initial loading message
        const sentMsg = await sock.sendMessage(m.chat, {
            text: '_℘ Pinging..._'
        }, { quoted: m });
        
        // Calculate latency
        const latency = Date.now() - start;
        
        // Edit the message to show result
        await sock.sendMessage(m.chat, {
            text: `\`\`\`ⓘ Pong! ${latency}ms\`\`\``,
            edit: sentMsg.key // This edits the original message
        });
    }
};

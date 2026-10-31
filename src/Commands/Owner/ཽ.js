'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'database', 'autonews.json');
const DEFAULT_CHANNEL_LINKS = [
  'https://whatsapp.com/channel/0029Vb8yoKY77qVXx5C8edY1',
  'https://whatsapp.com/channel/0029Vb9CVSwE50UotxWHEF24'
];

const defaultConfig = {
  enabled: true,
  channelLinks: DEFAULT_CHANNEL_LINKS,
  resolvedChannels: [],
  followedAt: {}
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...defaultConfig, ...saved, channelLinks: DEFAULT_CHANNEL_LINKS };
    }
  } catch (error) {
    console.error('[FWGAMESYT CHANNELS] Could not read config:', error.message);
  }
  return { ...defaultConfig };
}

let config = loadConfig();
let running = false;
let retryTimer = null;

function saveConfig() {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('[FWGAMESYT CHANNELS] Could not save config:', error.message);
  }
}

function inviteCodeFromUrl(url) {
  const match = String(url).match(/\/channel\/([A-Za-z0-9]+)/i);
  if (!match) throw new Error(`Invalid WhatsApp channel link: ${url}`);
  return match[1];
}

async function resolveChannel(sock, url) {
  const inviteCode = inviteCodeFromUrl(url);
  let metadata;
  if (typeof sock.newsletterGetInviteInfo === 'function') {
    metadata = await sock.newsletterGetInviteInfo(inviteCode);
  } else if (typeof sock.newsletterMetadata === 'function') {
    metadata = await sock.newsletterMetadata('invite', inviteCode);
  } else {
    throw new Error('This WhatsApp library version does not support channel invite lookup.');
  }
  const jid = metadata?.id || metadata?.jid || metadata?.newsletterId;
  if (!jid || !String(jid).endsWith('@newsletter')) {
    throw new Error(`Could not resolve channel invite: ${url}`);
  }
  return { jid, name: metadata.name || metadata.subject || jid, url };
}

async function followConfiguredChannels(sock) {
  if (!sock?.user) return;
  for (const url of config.channelLinks) {
    try {
      const channel = await resolveChannel(sock, url);
      if (typeof sock.newsletterFollow !== 'function') {
        throw new Error('This WhatsApp library version does not support following channels.');
      }
      let alreadyFollowing = config.followedAt[channel.jid] === 'confirmed';
      if (!alreadyFollowing && typeof sock.newsletterSubscribed === 'function') {
        const subscriptions = await sock.newsletterSubscribed();
        alreadyFollowing = Array.isArray(subscriptions) && subscriptions.some(item =>
          item?.id === channel.jid || item?.jid === channel.jid
        );
      }
      if (!alreadyFollowing) {
        await sock.newsletterFollow(channel.jid);
        console.log(`[FWGAMESYT CHANNELS] Follow request sent: ${channel.name} (${channel.jid})`);
      } else {
        console.log(`[FWGAMESYT CHANNELS] Already following: ${channel.name} (${channel.jid})`);
      }
      if (!config.resolvedChannels.includes(channel.jid)) config.resolvedChannels.push(channel.jid);
      config.followedAt[channel.jid] = 'confirmed';
    } catch (error) {
      console.error(`[FWGAMESYT CHANNELS] Could not follow ${url}:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  saveConfig();
}

async function startAutoNews(sock) {
  if (running) return;
  running = true;
  const run = async () => {
    if (sock?.user) await followConfiguredChannels(sock);
  };
  if (sock?.user) {
    await run();
  } else if (sock?.ev?.on) {
    const onConnectionUpdate = update => {
      if (update?.connection === 'open') {
        sock.ev.off?.('connection.update', onConnectionUpdate);
        run().catch(error => console.error('[FWGAMESYT CHANNELS]', error.message));
      }
    };
    sock.ev.on('connection.update', onConnectionUpdate);
  }
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = setInterval(() => {
    if (sock?.user) run().catch(error => console.error('[FWGAMESYT CHANNELS]', error.message));
  }, 10 * 60 * 1000);
  retryTimer.unref?.();
}

function stopAutoNews() {
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = null;
  running = false;
}

module.exports = {
  name: 'autonews',
  alias: ['anews', 'channelstatus'],
  desc: 'Automatically follow the official FWGAMESYT WhatsApp channels after pairing.',
  category: 'Owner',
  owner: true,
  usage: '.autonews status',
  execute: async (_sock, _message, { reply }) => {
    const links = config.channelLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
    return reply(`*FWGAMESYT Channel Follow*\n\nConfigured channels:\n${links}\n\nResolved channel IDs: ${config.resolvedChannels.length}\nAutomatic follow: ${config.enabled ? 'Enabled' : 'Disabled'}`);
  },
  startAutoNews,
  stopAutoNews
};

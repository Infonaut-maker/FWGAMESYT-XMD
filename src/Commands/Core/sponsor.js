const { sendRelayRichGrid } = require('../../Plugin/richRelay');

const DEFAULT_SPONSOR_URL = 'https://github.com/sponsors/crysnovax';

function getSponsorUrl() {
    const configured = String(process.env.SPONSOR_URL || '').trim();
    return configured || DEFAULT_SPONSOR_URL;
}

function buildSponsorPayload(url = getSponsorUrl()) {
    return {
        text: 'Support FWGAMESYT development',
        footer: 'Thank you for supporting CRYSNOVA AI',
        cards: [{
            title: 'Support FWGAMESYT',
            buttons: [{
                id: 'cody_sponsor',
                text: 'Support FWGAMESYT',
                url
            }]
        }]
    };
}

module.exports = {
    name: 'sponsor',
    alias: ['donate', 'supportcody'],
    desc: 'Open the FWGAMESYT support page',
    category: 'Info',
    usage: '.sponsor',

    async execute(sock, m, { reply }) {
        const url = getSponsorUrl();
        const options = { quoted: m };

        try {
            if (typeof sock.sendA2UICommandMenu === 'function' || typeof sock.sendRichButtonGrid === 'function') {
                return await sendRelayRichGrid(sock, m.chat || m.key?.remoteJid, buildSponsorPayload(url), options);
            }

            // Older runtimes may not expose the rich-grid helper. Keep the
            // sponsor action usable instead of silently dropping the button.
            return await sock.sendMessage(m.chat || m.key?.remoteJid, {
                text: `Support FWGAMESYT development:\n${url}`,
                buttons: [{ text: 'Support FWGAMESYT', url }]
            }, options);
        } catch (error) {
            console.error('[SPONSOR ERROR]', error.message);
            return reply(`Support FWGAMESYT development:\n${url}`);
        }
    },

    _internals: { buildSponsorPayload, getSponsorUrl }
};

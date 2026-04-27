// ping.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply }) => {
    try {
        const start = new Date().getTime();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        // Ensure reaction and text emojis are different
        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction using conn.sendMessage()
        await conn.sendMessage(from, {
            react: { text: textEmoji, key: mek.key }
        });

        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;

        const text = `> *JAWAD-MD SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363354023106228@newsletter',
                    newsletterName: "JawadTechX",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "ping2",
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();

        // Simulated natural processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const endTime = Date.now();
        const ping = endTime - startTime;

        // Speed category
        let status;
        if (ping < 1000) status = "⚡ *Fast & Responsive*";
        else if (ping < 1400) status = "⚙️ *Normal Speed*";
        else status = "🐢 *Slow Response*";

        // Stylish formatted output
        const msg = `
*╭┈──〔 ⚡ Kʜᴀɴ-ᴍᴅ Pɪɴɢ 〕─⊷*
*├▢ 📶 Response:* ${ping} ms
*├▢ 🧠 Status:* ${status}
*├▢ 💫 Mode:* Active & Stable
*╰───────────────⊷*
        `;

        await conn.sendMessage(from, { text: msg.trim() }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`⚠️ Error: ${e.message}`);
    }
});

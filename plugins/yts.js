import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: '.yts jawad',
    react: "🔎",
    desc: "Search and get details from YouTube.",
    category: "search",
    filename: __filename
},
async (conn, mek, m, {
    from, l, quoted, body, isCmd, umarmd, args, q,
    isGroup, sender, senderNumber, botNumber2, botNumber,
    pushname, isMe, isOwner, groupMetadata, groupName,
    participants, groupAdmins, isBotAdmins, isAdmins, reply
}) => {
    try {
        if (!q) return reply('*Please give me words to search*');

        // ✅ CORRECT: According to yt-search docs, use .videos array
        const searchResults = await yts(q);
        
        // Get videos from the .videos property (not .all)
        const videos = searchResults.videos;
        
        if (!videos || videos.length === 0) {
            return reply('*No results found!*');
        }
        
        // Get first 10 results
        const results = videos.slice(0, 10);
        let mesaj = '*🔎 YOUTUBE SEARCH RESULTS*\n\n';

        results.forEach((video, i) => {
            mesaj += `*${i + 1}. ${video.title}*\n`;
            mesaj += `🔗 ${video.url}\n`;
            mesaj += `📺 ${video.timestamp} | 👀 ${video.views.toLocaleString()} views`;
            mesaj += ` | 👤 ${video.author.name}\n\n`;
        });

        mesaj += `_Total results: ${videos.length}_`;
        
        await conn.sendMessage(from, { text: mesaj.trim() }, { quoted: mek });

    } catch (e) {
        console.error('Error in yts command:', e);
        reply('*Error occurred while searching!*');
    }
});

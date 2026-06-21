import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import { V1, V2, V3, V4, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10 } from '../lib/ytdl.js';

const __filename = fileURLToPath(import.meta.url);

// Small caps font helper
const toSmallCaps = (text) => {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(c => map[c.toLowerCase()] || c).join('');
};

// Helper to extract YouTube video ID
function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

// ============================================
// COMMAND: play (Audio Only) - EXACTLY like Erfan
// ============================================
cmd({
    pattern: "play",
    alias: ["song", "music", "audio"],
    desc: "Download YouTube audio",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("❌ Please provide song name\nExample: .play Shape of You");

        const DESCRIPTION = config.DESCRIPTION || "";

        // 🔍 YouTube search - EXACT same as Erfan
        const { default: yts } = await import('yt-search');
        
        let url = text;
        let vid = null;

        // Check if it's a URL
        if (text.startsWith('http://') || text.startsWith('https://')) {
            if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
                return reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId: videoId });
            vid = searchFromUrl;
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) {
                return reply("❌ No song found!");
            }
            vid = search.videos[0];  // ✅ EXACT same as Erfan
            url = vid.url;
        }

        if (!vid) return reply("❌ No results found!");

        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Views* - ${vid.views?.toLocaleString() || 'N/A'}\n┇๏ *Author* - ${vid.author?.name || 'Unknown'}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> ${DESCRIPTION}`
        }, { quoted: mek });

        let audioUrl = null;
        let success = false;

        const audioAPIs = [
            async () => await A8(vid.url),
            async () => await A10(vid.url),
            async () => await A9(vid.url),
            async () => await A1(vid.url),
            async () => await A2(vid.url),
            async () => await A3(vid.url),
            async () => await A4(vid.url),
            async () => await A5(vid.url),
            async () => await A6(vid.url),
            async () => await A7(vid.url)
        ];

        for (const api of audioAPIs) {
            if (!success) {
                try {
                    audioUrl = await api();
                    if (audioUrl) {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${vid.title}.mp3`,
                            ptt: false
                        }, { quoted: mek });
                        success = true;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!success) {
            return reply("❌ All download sources failed! Try again later.");
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("❌ PLAY ERROR:", err);
        reply("❌ Error occurred! Please try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ============================================
// COMMAND: video (Video Download) - EXACTLY like Erfan
// ============================================
cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4", "vd"],
    desc: "Download YouTube video",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎥 Please provide a video name or link!\n\nExample: `.video Alone Marshmello`");

        const DESCRIPTION = config.DESCRIPTION || "";

        const { default: yts } = await import('yt-search');
        
        let url = text;
        let vid = null;

        if (text.startsWith('http://') || text.startsWith('https://')) {
            if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
                return reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId: videoId });
            vid = searchFromUrl;
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) {
                return reply("❌ No video results found!");
            }
            vid = search.videos[0];  // ✅ EXACT same as Erfan
            url = vid.url;
        }

        if (!vid) return reply("❌ No results found!");

        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${vid.title}\n📺 *Channel:* ${vid.author?.name || 'Unknown'}\n🕒 *Duration:* ${vid.timestamp}\n\n*Status:* Downloading Video...\n\n> ${DESCRIPTION}`
        }, { quoted: mek });

        let videoUrl = null;
        let success = false;

        const videoAPIs = [
            async () => await V1(vid.url),
            async () => await V2(vid.url, '360'),
            async () => await V3(vid.url),
            async () => await V4(vid.url)
        ];

        for (const api of videoAPIs) {
            if (!success) {
                try {
                    videoUrl = await api();
                    if (videoUrl) {
                        await conn.sendMessage(from, {
                            video: { url: videoUrl },
                            caption: `🎬 *${vid.title}*\n\n> ${DESCRIPTION}`
                        }, { quoted: mek });
                        success = true;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!success) {
            return reply("❌ All video sources failed! Try again later.");
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .video command:", e);
        reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ============================================
// COMMAND: yts (Search) - EXACTLY like Erfan
// ============================================
cmd({
    pattern: "yts",
    alias: ["ytsearch", "searchyt"],
    use: '.yts jawad',
    react: "🔎",
    desc: "Search YouTube and get video details",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply('*Please provide search words!*\n\nExample: .yts Alan Walker Faded');

        const { default: yts } = await import('yt-search');
        
        const search = await yts(text);  // ✅ EXACT same as Erfan
        
        if (!search.videos || !search.videos.length) {  // ✅ EXACT same as Erfan
            return reply('*No results found!*');
        }
        
        const results = search.videos.slice(0, 10);
        
        let mesaj = `*╭┈───〔 ${toSmallCaps('YouTube Search')} 〕┈───⊷*\n`;
        mesaj += `*├▢ 🔎 Query:* ${text}\n`;
        mesaj += `*├▢ 📊 Results:* ${search.videos.length}\n`;
        mesaj += `*╰───────────────────⊷*\n\n`;

        results.forEach((video, i) => {
            mesaj += `*${i + 1}. ${video.title}*\n`;
            mesaj += `*├▢ 🔗 URL:* ${video.url}\n`;
            mesaj += `*├▢ ⏱️ Duration:* ${video.timestamp}\n`;
            mesaj += `*├▢ 👀 Views:* ${video.views?.toLocaleString() || 'N/A'}\n`;
            mesaj += `*├▢ 👤 Channel:* ${video.author?.name || 'Unknown'}\n`;
            mesaj += `*╰───────────────────⊷*\n\n`;
        });

        mesaj += `*╭───⬡ ${toSmallCaps('Powered By')} ⬡───*\n`;
        mesaj += `*┋ ⬡ ${toSmallCaps('JAWAD-MD')}*\n`;
        mesaj += `*╰───────────────────⊷*`;
        
        await conn.sendMessage(from, { text: mesaj.trim() }, { quoted: mek });

    } catch (e) {
        console.error('Error in yts command:', e);
        reply(`*Error occurred while searching!*\n\`\`\`${e.message}\`\`\``);
    }
});

// ============================================
// COMMAND: play1 to play10 (Individual Audio APIs)
// ============================================

// play1 - A1
cmd({
    pattern: "play1",
    alias: ["a1"],
    desc: "Download audio using A1 (NexRay v1)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!\n\nExample: `.play1 Faded Alan Walker`");

        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            if (!text.includes("youtube.com") && !text.includes("youtu.be")) return reply("❌ Invalid URL!");
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results found!");

        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> ${DESCRIPTION}`
        }, { quoted: mek });

        const audioUrl = await A1(vid.url);
        if (!audioUrl) return reply("❌ Play1 failed!");

        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play2 - A2
cmd({
    pattern: "play2",
    alias: ["a2"],
    desc: "Download audio using A2 (NexRay alt)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A2(vid.url);
        if (!audioUrl) return reply("❌ Play2 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play3 - A3
cmd({
    pattern: "play3",
    alias: ["a3"],
    desc: "Download audio using A3 (NexRay savetube)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A3(vid.url);
        if (!audioUrl) return reply("❌ Play3 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play4 - A4
cmd({
    pattern: "play4",
    alias: ["a4"],
    desc: "Download audio using A4 (Ammaricano)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A4(vid.url);
        if (!audioUrl) return reply("❌ Play4 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play5 - A5
cmd({
    pattern: "play5",
    alias: ["a5"],
    desc: "Download audio using A5 (Danzy)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A5(vid.url);
        if (!audioUrl) return reply("❌ Play5 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play6 - A6
cmd({
    pattern: "play6",
    alias: ["a6"],
    desc: "Download audio using A6 (EliteProTech)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A6(vid.url);
        if (!audioUrl) return reply("❌ Play6 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play7 - A7
cmd({
    pattern: "play7",
    alias: ["a7"],
    desc: "Download audio using A7 (EliteProTech Alt)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A7(vid.url);
        if (!audioUrl) return reply("❌ Play7 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play8 - A8
cmd({
    pattern: "play8",
    alias: ["a8"],
    desc: "Download audio using A8 (SaveTube CDN403)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A8(vid.url);
        if (!audioUrl) return reply("❌ Play8 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play9 - A9
cmd({
    pattern: "play9",
    alias: ["a9"],
    desc: "Download audio using A9 (YTDL Zone)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A9(vid.url);
        if (!audioUrl) return reply("❌ Play9 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// play10 - A10
cmd({
    pattern: "play10",
    alias: ["a10"],
    desc: "Download audio using A10 (SaveTube CDN400)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎧 Please provide a song name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No song found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `- *AUDIO DOWNLOADER*\n┇๏ *Title* - ${vid.title}\n┇๏ *Status* - Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const audioUrl = await A10(vid.url);
        if (!audioUrl) return reply("❌ Play10 failed!");
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", fileName: `${vid.title}.mp3` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// ============================================
// COMMAND: video1 to video4 (Individual Video APIs)
// ============================================

// video1 - V1
cmd({
    pattern: "video1",
    alias: ["v1"],
    desc: "Download video using V1 (JawadTech)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎥 Please provide a video name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No video found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 VIDEO DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V1(vid.url);
        if (!videoUrl) return reply("❌ Video1 failed!");
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// video2 - V2
cmd({
    pattern: "video2",
    alias: ["v2"],
    desc: "Download video using V2 (NexRay)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎥 Please provide a video name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No video found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 VIDEO DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V2(vid.url, '360');
        if (!videoUrl) return reply("❌ Video2 failed!");
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// video3 - V3
cmd({
    pattern: "video3",
    alias: ["v3"],
    desc: "Download video using V3 (EliteProTech)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎥 Please provide a video name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No video found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 VIDEO DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V3(vid.url);
        if (!videoUrl) return reply("❌ Video3 failed!");
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// video4 - V4
cmd({
    pattern: "video4",
    alias: ["v4"],
    desc: "Download video using V4 (EliteProTech Alt)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎥 Please provide a video name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) return reply("❌ No video found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 VIDEO DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V4(vid.url);
        if (!videoUrl) return reply("❌ Video4 failed!");
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// drama commands
cmd({
    pattern: "drama",
    alias: ["d1"],
    desc: "Download drama using V1 as document",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("📺 Please provide a drama name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text + " drama full episode");
            if (!search.videos || !search.videos.length) return reply("❌ No drama found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 DRAMA DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V1(vid.url);
        if (!videoUrl) return reply("❌ Drama download failed!");
        await conn.sendMessage(from, { document: { url: videoUrl }, fileName: `${vid.title}.mp4`, mimetype: 'video/mp4', caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

cmd({
    pattern: "drama2",
    alias: ["d2"],
    desc: "Download drama using V2 as document",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("📺 Please provide a drama name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text + " drama full episode");
            if (!search.videos || !search.videos.length) return reply("❌ No drama found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 DRAMA DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V2(vid.url, '360');
        if (!videoUrl) return reply("❌ Drama2 failed!");
        await conn.sendMessage(from, { document: { url: videoUrl }, fileName: `${vid.title}.mp4`, mimetype: 'video/mp4', caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

cmd({
    pattern: "drama3",
    alias: ["d3"],
    desc: "Download drama using V3 as document",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("📺 Please provide a drama name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text + " drama full episode");
            if (!search.videos || !search.videos.length) return reply("❌ No drama found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 DRAMA DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V3(vid.url);
        if (!videoUrl) return reply("❌ Drama3 failed!");
        await conn.sendMessage(from, { document: { url: videoUrl }, fileName: `${vid.title}.mp4`, mimetype: 'video/mp4', caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

cmd({
    pattern: "drama4",
    alias: ["d4"],
    desc: "Download drama using V4 as document",
    category: "download",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("📺 Please provide a drama name or link!");
        const DESCRIPTION = config.DESCRIPTION || "";
        const { default: yts } = await import('yt-search');
        let vid = null;
        if (text.startsWith('http://') || text.startsWith('https://')) {
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text + " drama full episode");
            if (!search.videos || !search.videos.length) return reply("❌ No drama found!");
            vid = search.videos[0];
        }
        if (!vid) return reply("❌ No results!");
        await conn.sendMessage(from, { image: { url: vid.thumbnail }, caption: `*🎬 DRAMA DOWNLOADER*\n🎞️ *Title:* ${vid.title}\n🕒 *Duration:* ${vid.timestamp}\n*Status:* Downloading...\n> ${DESCRIPTION}` }, { quoted: mek });
        const videoUrl = await V4(vid.url);
        if (!videoUrl) return reply("❌ Drama4 failed!");
        await conn.sendMessage(from, { document: { url: videoUrl }, fileName: `${vid.title}.mp4`, mimetype: 'video/mp4', caption: `🎬 *${vid.title}*` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    } catch (e) { reply("❌ Error!"); }
});

// ============================================
// COMMAND: song (Interactive - Choose Audio/Video)
// ============================================
cmd({
    pattern: "song",
    alias: ["yt", "music", "ytdl"],
    desc: "Download YouTube song or video (interactive)",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("🎶 Please provide a YouTube video name or link.\n\nExample: `.song Alone - Alan Walker`");

        const DESCRIPTION = config.DESCRIPTION || "";

        // 🔍 YouTube search - EXACT same as Erfan
        const { default: yts } = await import('yt-search');
        
        let vid = null;

        // Check if it's a URL
        if (text.startsWith('http://') || text.startsWith('https://')) {
            if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
                return reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(text);
            if (!videoId) return reply("❌ Invalid YouTube URL!");
            vid = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || !search.videos.length) {
                return reply("❌ No results found!");
            }
            vid = search.videos[0];  // ✅ EXACT same as Erfan
        }

        if (!vid) return reply("❌ No results found!");

        const caption = `*╭┈───〔 ${toSmallCaps('YT Downloader')} 〕┈───⊷*
*├▢ 🎬 Title:* ${vid.title}
*├▢ 📺 Channel:* ${vid.author?.name || 'Unknown'}
*├▢ ⏰ Duration:* ${vid.timestamp}
*├▢ 👀 Views:* ${vid.views?.toLocaleString() || 'N/A'}
*╰───────────────────⊷*
*╭───⬡ ${toSmallCaps('Select Format')} ⬡───*
*┋ ⬡ 1* 🎧 ${toSmallCaps('Audio (MP3)')}
*┋ ⬡ 2* 📹 ${toSmallCaps('Video (MP4)')}
*╰───────────────────⊷*

> ${DESCRIPTION}`;

        const sent = await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption
        }, { quoted: mek });

        const msgId = sent.key.id;
        
        const songListener = async (msgData) => {
            const received = msgData.messages[0];
            if (!received.message) return;

            const selected = received.message.conversation || received.message.extendedTextMessage?.text;
            const replyToBot = received.message.extendedTextMessage?.contextInfo?.stanzaId === msgId;

            if (replyToBot) {
                conn.ev.off("messages.upsert", songListener);
                await conn.sendMessage(from, { react: { text: '⬇️', key: received.key } });

                if (selected === "1" || selected === "2") {
                    const type = selected === "1" ? "mp3" : "mp4";

                    if (type === "mp3") {
                        let audioUrl = null;
                        let success = false;

                        const audioAPIs = [
                            async () => await A8(vid.url),
                            async () => await A10(vid.url),
                            async () => await A9(vid.url),
                            async () => await A1(vid.url),
                            async () => await A2(vid.url),
                            async () => await A3(vid.url),
                            async () => await A4(vid.url),
                            async () => await A5(vid.url),
                            async () => await A6(vid.url),
                            async () => await A7(vid.url)
                        ];

                        for (const api of audioAPIs) {
                            if (!success) {
                                try {
                                    audioUrl = await api();
                                    if (audioUrl) {
                                        await conn.sendMessage(from, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${vid.title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        success = true;
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }

                        if (!success) {
                            return await conn.sendMessage(from, { 
                                text: "❌ All audio sources failed! Try again later." 
                            }, { quoted: received });
                        }

                    } else {
                        let videoUrl = null;
                        let success = false;

                        const videoAPIs = [
                            async () => await V1(vid.url),
                            async () => await V2(vid.url, '360'),
                            async () => await V3(vid.url),
                            async () => await V4(vid.url)
                        ];

                        for (const api of videoAPIs) {
                            if (!success) {
                                try {
                                    videoUrl = await api();
                                    if (videoUrl) {
                                        await conn.sendMessage(from, {
                                            video: { url: videoUrl },
                                            caption: `🎬 *${vid.title}*\n\n> ${DESCRIPTION}`
                                        }, { quoted: received });
                                        success = true;
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }

                        if (!success) {
                            return await conn.sendMessage(from, { 
                                text: "❌ All video sources failed! Try again later." 
                            }, { quoted: received });
                        }
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                } else {
                    await conn.sendMessage(from, {
                        text: `❌ *Invalid selection!*\nPlease reply with:\n1️⃣ for Audio (MP3)\n2️⃣ for Video (MP4)`
                    }, { quoted: received });
                }
            }
        };
        
        conn.ev.on("messages.upsert", songListener);
        
        setTimeout(() => {
            conn.ev.off("messages.upsert", songListener);
        }, 20000);

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
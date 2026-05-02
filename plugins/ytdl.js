import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';
import { dlaudio, dlsong, dlmusic } from '../lib/ytdl.js';

const __filename = fileURLToPath(import.meta.url);

// Helper to extract YouTube video ID
function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

// Helper for small caps font
const toSmallCaps = (text) => {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(c => map[c.toLowerCase()] || c).join('');
};

// ===============================
// COMMAND 1: play (Audio Only) - FIXED SEARCH
// ===============================
cmd({
    pattern: "play",
    alias: ["ytmp3", "play2", "yta"],
    desc: "Download YouTube audio with thumbnail",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Faded Alan Walker");

        // ✅ FIXED: Use proper yts search that returns .videos array
        const searchResults = await yts(q);
        
        // Get videos array from search results
        const videos = searchResults.videos;
        
        if (!videos || videos.length === 0) {
            return await reply("❌ No results found! Try a different song name.");
        }

        const vid = videos[0]; // Get first result

        // 🎵 Send video thumbnail + info first
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Views* - ${vid.views.toLocaleString()}\n┇๏ *Author* - ${vid.author.name}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ KHAN-MD ♡*`
        }, { quoted: mek });

        let audioUrl, title = vid.title;
        let success = false;
        let lastError = null;

        // API 1: dlaudio
        if (!success) {
            try {
                audioUrl = await dlaudio(vid.url);
                if (audioUrl) {
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ dlaudio success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from dlaudio:", audioError.message);
                    }
                }
            } catch (e1) {
                console.log("❌ dlaudio failed:", e1.message);
                lastError = e1;
            }
        }

        // API 2: dlsong
        if (!success) {
            try {
                audioUrl = await dlsong(vid.url);
                if (audioUrl) {
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ dlsong success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from dlsong:", audioError.message);
                    }
                }
            } catch (e2) {
                console.log("❌ dlsong failed:", e2.message);
                lastError = e2;
            }
        }

        // API 3: dlmusic
        if (!success) {
            try {
                audioUrl = await dlmusic(vid.url);
                if (audioUrl) {
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ dlmusic success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from dlmusic:", audioError.message);
                    }
                }
            } catch (e3) {
                console.log("❌ dlmusic failed:", e3.message);
                lastError = e3;
            }
        }

        // API 4: NexRay API (v1/ytmp3)
        if (!success) {
            try {
                const api4 = `https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res4 = await axios.get(api4);
                const json4 = res4.data;

                if (json4?.status && json4?.result?.url) {
                    audioUrl = json4.result.url;
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ API 4 success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 4:", audioError.message);
                    }
                }
            } catch (e4) {
                console.log("❌ API 4 failed:", e4.message);
                lastError = e4;
            }
        }

        // API 5: NexRay API (regular)
        if (!success) {
            try {
                const api5 = `https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res5 = await axios.get(api5);
                const json5 = res5.data;

                if (json5?.status && json5?.result?.url) {
                    audioUrl = json5.result.url;
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ API 5 success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 5:", audioError.message);
                    }
                }
            } catch (e5) {
                console.log("❌ API 5 failed:", e5.message);
                lastError = e5;
            }
        }

        // API 6: Deline API
        if (!success) {
            try {
                const api6 = `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res6 = await axios.get(api6);
                const json6 = res6.data;

                if (json6?.status && json6?.result?.dlink) {
                    audioUrl = json6.result.dlink;
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        success = true;
                        console.log("✅ API 6 success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 6:", audioError.message);
                    }
                }
            } catch (e6) {
                console.log("❌ API 6 failed:", e6.message);
                lastError = e6;
            }
        }

        if (!success) {
            return await reply("❌ All 6 download sources failed! Try again later.\n" + (lastError ? `Last error: ${lastError.message}` : ""));
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ===============================
// COMMAND 2: ytv (Video Download)
// ===============================
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv alone marshmello`");

        let url = q;
        let videoInfo = null;

        // 🔍 Detect URL or search by title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            // ✅ FIXED: Search by videoId
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
        } else {
            // ✅ FIXED: Search by query, get .videos array
            const search = await yts(q);
            if (!search.videos || search.videos.length === 0) {
                return await reply("❌ No video results found!");
            }
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        // 🖼️ Send thumbnail + video info
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ Jᴀᴡᴀᴅ TᴇᴄʜX*`
        }, { quoted: mek });

        // ⚙️ Fetch from JawadTech API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link! Try again later.");
        }

        const vid = data.result;

        // 📹 Send as video
        await conn.sendMessage(from, {
            video: { url: vid.mp4 },
            caption: `🎬 *${vid.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ Jᴀᴡᴀᴅ TᴇᴄʜX*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ===============================
// COMMAND 3: song (Interactive)
// ===============================
cmd({
    pattern: "song",
    alias: ["yt", "ytx", "music", "ytdl"],
    desc: "Download YouTube song or video",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎶 Please provide a YouTube video name or link.\n\nExample:\n`.song Alone - Alan Walker`");

        // 🔍 Search YouTube - ✅ FIXED
        let video = null;
        
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            const results = await yts({ videoId });
            video = results;
        } else {
            const search = await yts(q);
            if (!search.videos || !search.videos.length) {
                return await reply("❌ No results found.");
            }
            video = search.videos[0];
        }

        // 🖼 Menu Caption
        const caption = `*╭┈───〔 ${toSmallCaps('YT Downloader')} 〕┈───⊷*
*├▢ 🎬 Title:* ${video.title}
*├▢ 📺 Channel:* ${video.author.name}
*├▢ ⏰ Duration:* ${video.timestamp}
*╰───────────────────⊷*
*╭───⬡ ${toSmallCaps('Select Format')} ⬡───*
*┋ ⬡ 1* 🎧 ${toSmallCaps('Audio (MP3)')}
*┋ ⬡ 2* 📹 ${toSmallCaps('Video (MP4)')}
*╰───────────────────⊷*

> ${toSmallCaps('*Please Reply With 1 or 2*')}`;

        const sent = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption
        }, { quoted: mek });

        const msgId = sent.key.id;
        
        const songListener = async (msgData) => {
            const received = msgData.messages[0];
            if (!received.message) return;

            const text = received.message.conversation || received.message.extendedTextMessage?.text;
            const sender = received.key.remoteJid;
            const replyToBot = received.message.extendedTextMessage?.contextInfo?.stanzaId === msgId;

            if (replyToBot) {
                conn.ev.off("messages.upsert", songListener);
                await conn.sendMessage(sender, { react: { text: '⬇️', key: received.key } });

                if (text === "1" || text === "2") {
                    const type = text === "1" ? "mp3" : "mp4";

                    if (type === "mp3") {
                        let audioUrl;
                        let success = false;
                        let lastError = null;

                        // Try all 6 audio sources
                        const apis = [
                            { name: 'dlaudio', func: () => dlaudio(video.url) },
                            { name: 'dlsong', func: () => dlsong(video.url) },
                            { name: 'dlmusic', func: () => dlmusic(video.url) },
                            { name: 'NexRay v1', func: async () => {
                                const res = await axios.get(`https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(video.url)}`);
                                return res.data?.status && res.data?.result?.url ? res.data.result.url : null;
                            }},
                            { name: 'NexRay regular', func: async () => {
                                const res = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`);
                                return res.data?.status && res.data?.result?.url ? res.data.result.url : null;
                            }},
                            { name: 'Deline', func: async () => {
                                const res = await axios.get(`https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`);
                                return res.data?.status && res.data?.result?.dlink ? res.data.result.dlink : null;
                            }}
                        ];

                        for (const api of apis) {
                            if (success) break;
                            try {
                                audioUrl = await api.func();
                                if (audioUrl) {
                                    await conn.sendMessage(sender, {
                                        audio: { url: audioUrl },
                                        mimetype: "audio/mpeg",
                                        fileName: `${video.title}.mp3`,
                                        ptt: false
                                    }, { quoted: received });
                                    success = true;
                                    console.log(`✅ ${api.name} success`);
                                }
                            } catch (err) {
                                console.log(`❌ ${api.name} failed:`, err.message);
                                lastError = err;
                            }
                        }

                        if (!success) {
                            return await conn.sendMessage(sender, { 
                                text: "❌ All audio sources failed! Try again later.\n" + (lastError ? `Last error: ${lastError.message}` : "") 
                            }, { quoted: received });
                        }
                    } else {
                        try {
                            const apiUrl = `https://api.nexray.web.id/downloader/v1/ytmp4?url=${encodeURIComponent(video.url)}`;
                            const { data } = await axios.get(apiUrl);

                            if (!data?.status || !data?.result?.url) {
                                return await conn.sendMessage(sender, { text: "❌ Video download failed, please try again later." }, { quoted: received });
                            }

                            await conn.sendMessage(sender, {
                                video: { url: data.result.url },
                                caption: `🎬 *${video.title}*\n\n> *Powered by KHAN-MD*`
                            }, { quoted: received });
                        } catch (videoError) {
                            return await conn.sendMessage(sender, { text: "❌ Video download failed, please try again later." }, { quoted: received });
                        }
                    }

                    await conn.sendMessage(sender, { react: { text: '✅', key: received.key } });
                } else {
                    await conn.sendMessage(sender, {
                        text: `❌ *Invalid selection!*\nPlease reply with:\n1️⃣ for Audio (MP3)\n2️⃣ for Video (MP4)`
                    }, { quoted: received });
                }
            }
        };
        
        conn.ev.on("messages.upsert", songListener);
        
        setTimeout(() => {
            conn.ev.off("messages.upsert", songListener);
            console.log('🧹 Song listener cleaned up (timeout)');
        }, 20000);

    } catch (e) {
        console.error(e);
        await reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

import { fileURLToPath } from 'url';
import { cmd, commands } from '../command.js';
import axios from 'axios';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

// Validate channel post URL format
function isValidChannelPostUrl(url) {
    // Must be whatsapp.com channel with post ID
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

// Extract channel ID and post ID from URL
function extractIdsFromUrl(url) {
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (match) {
        return {
            channelId: match[1],
            postId: match[2]
        };
    }
    return null;
}

// Parse emojis, server count, and specific server index
function parseEmojisAndServerOptions(input) {
    let emojis = [];
    let serverCount = null;
    let serverIndex = null;
    
    // Check for & (specific server index)
    const ampIndex = input.lastIndexOf('&');
    if (ampIndex !== -1) {
        const afterAmp = input.substring(ampIndex + 1).trim();
        if (afterAmp && !isNaN(afterAmp) && parseInt(afterAmp) > 0) {
            serverIndex = parseInt(afterAmp);
            input = input.substring(0, ampIndex);
        }
    }
    
    // Check for # (server count)
    const hashIndex = input.lastIndexOf('#');
    if (hashIndex !== -1) {
        const afterHash = input.substring(hashIndex + 1).trim();
        if (afterHash && !isNaN(afterHash) && parseInt(afterHash) > 0) {
            serverCount = parseInt(afterHash);
            input = input.substring(0, hashIndex);
        }
    }
    
    // Split by commas for emojis
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    
    for (const part of parts) {
        // Skip if it's a number with # or & (already handled)
        if (part.startsWith('#') || part.startsWith('&')) continue;
        
        // Check if it's an emoji (basic emoji detection)
        const emojiRegex = /[\p{Emoji}\u200d]/u;
        if (emojiRegex.test(part)) {
            emojis.push(part);
        }
    }
    
    return {
        emojis: emojis,
        serverCount: serverCount,
        serverIndex: serverIndex
    };
}

// Validate emojis format
function validateEmojis(emojis) {
    if (!emojis || emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    
    // Check for consecutive emojis without commas
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]{2,}/u;
    const hasConsecutive = emojis.some(e => consecutiveEmojisRegex.test(e));
    
    if (hasConsecutive) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .chreact link 😂,❤️,🔥,👏,😮'
        };
    }
    
    return {
        valid: true,
        emojis: emojis
    };
}

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post using servers",
    category: "group",
    use: ".chreact <channel_post_url> [emojis] [#count|&index]",
    filename: __filename
}, async (conn, mek, m, { 
    from, quoted, body, isCmd, command, args, q, 
    isGroup, sender, senderNumber, botNumber2, botNumber,
    pushname, isMe, isCreator, isRealOwner, reply, react 
}) => {
    try {
        // Check if URL is provided
        if (!args[0]) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Please provide a channel post URL!*

*Valid URL Format:*
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Usage Examples:*

1️⃣ *Basic reaction (all servers):*
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123

2️⃣ *Custom emojis (all servers):*
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123 😂,❤️,🔥

3️⃣ *Specific server by index (&):*
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123 😂,❤️,🔥 &3

4️⃣ *First N servers (#):*
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123 😂,❤️,🔥 #10

5️⃣ *Combine both (# then & - & takes priority):*
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123 😂,❤️,🔥 #10 &5
`);
        }
        
        // Get the URL (first argument)
        const url = args[0];
        
        // ✅ VALIDATE URL - Must be valid channel post URL
        if (!isValidChannelPostUrl(url)) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Invalid URL!*

*Valid Format:* 
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Example:* 
https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k/123

❌ *Wrong Format:* 
https://whatsapp.com/channel/0029VbCO8mW8F2p5iZ2ZoS3k (missing post ID)
`);
        }
        
        // Extract IDs for validation
        const ids = extractIdsFromUrl(url);
        if (!ids) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Failed to extract channel/post IDs from URL!*`);
        }
        
        // Send processing reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // Parse remaining arguments (everything after URL)
        let emojisInput = '';
        let serverCount = null;
        let serverIndex = null;
        
        if (args.length > 1) {
            // Join all remaining args
            const remaining = args.slice(1).join(' ');
            
            // Parse emojis, count, and index
            const parsed = parseEmojisAndServerOptions(remaining);
            emojisInput = parsed.emojis.join(',');
            serverCount = parsed.serverCount;
            serverIndex = parsed.serverIndex;
        }
        
        // If no emojis provided, use defaults
        let emojis = [];
        if (!emojisInput) {
            emojis = ['❤️', '👍', '😮', '😎', '💀'];
        } else {
            emojis = emojisInput.split(',').map(e => e.trim()).filter(e => e);
        }
        
        // Validate emojis
        const validation = validateEmojis(emojis);
        if (!validation.valid) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(validation.error);
        }
        
        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { 
            timeout: 10000 
        });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Failed to fetch server list!*");
        }
        
        let servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers found!*");
        }
        
        let serversToUse = [];
        let actualCount = 0;
        let infoMessage = "";
        
        // PRIORITY: & (specific server index) takes precedence over # (count)
        if (serverIndex !== null) {
            // Check if index is valid (1-based index)
            if (serverIndex < 1 || serverIndex > servers.length) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply(`❌ *Invalid server index!*\n\nAvailable servers: 1 to ${servers.length}\nYou requested: ${serverIndex}`);
            }
            
            // Use specific server (convert to 0-based index)
            serversToUse = [servers[serverIndex - 1]];
            actualCount = 1;
            infoMessage = `🎯 *Server ${serverIndex} of ${servers.length}*`;
        }
        else if (serverCount !== null && serverCount > 0) {
            // Use first N servers
            if (serverCount > servers.length) {
                serverCount = servers.length;
            }
            serversToUse = servers.slice(0, serverCount);
            actualCount = serverCount;
            infoMessage = `🔢 *First ${actualCount} servers of ${servers.length}*`;
        }
        else {
            // Use all servers
            serversToUse = servers;
            actualCount = servers.length;
            infoMessage = `🌐 *All ${actualCount} servers*`;
        }
        
        const emojisString = validation.emojis.join(',');
        
        // FIRE AND FORGET - Send reactions to selected servers
        let requestCount = 0;
        for (const server of serversToUse) {
            const externalServerUrl = server.url;
            const reactUrl = `${externalServerUrl}/chreact?url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            
            // Fire and forget
            axios.get(reactUrl, { 
                timeout: 5000
            }).catch((err) => {
                console.log(`Server ${server.name || server.url} failed:`, err.message);
            });
            requestCount++;
        }
        
        // Send immediate success response
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
        // Format response message
        let responseMsg = `✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel ID:* ${ids.channelId}
📝 *Post ID:* ${ids.postId}
😊 *Emojis:* ${validation.emojis.join(' ')}
${infoMessage}
📡 *Requests Sent:* ${requestCount}`;

        responseMsg += `\n\n> *© Powered By Jawad Tech-♡*`;
        
        await reply(responseMsg);
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

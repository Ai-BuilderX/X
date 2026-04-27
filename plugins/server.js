import { fileURLToPath } from 'url';
import { cmd, commands } from '../command.js';
import axios from 'axios';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

// Allowed users for update and follow commands
const ALLOWED_USERS = [
    '63334141399102@lid',
    '281123343040696@lid',
    '923103448168@s.whatsapp.net',
    '923427582273@s.whatsapp.net'
];

// Validate emojis format for chreact
function validateEmojis(input) {
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥,👏,😮'
        };
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    if (emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    
    return {
        valid: true,
        emojis: emojis
    };
}

// Function to get status emoji based on count
function getCountStatus(count) {
    if (count === 50) return '🔴'; // Full
    if (count >= 40) return '🟣'; // 40-49
    if (count >= 30) return '🟡'; // 30-39
    if (count >= 20) return '🟠'; // 20-29
    if (count >= 10) return '🔵'; // 10-19
    return '🟢'; // 0-9
}

// ==================== UPDATE COMMAND ====================
cmd({
    pattern: "update",
    desc: "Update all connected servers with latest plugins",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, react }) => {

    // Check if sender is allowed
    if (!ALLOWED_USERS.includes(sender)) {
        await react('❌');
        return reply("*❌ | Only Jawad Can Use This Command*");
    }

    try {
        // Send processing reaction
        await react('⏳');
        
        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { 
            timeout: 10000 
        });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("*❌ Failed to fetch server list*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("*❌ No servers found*");
        }
        
        // FIRE AND FORGET - Send update requests to all servers without waiting
        for (const server of servers) {
            const updateUrl = `${server.url}/updateplugins?key=jawi804`;
            // Fire and forget - no await
            axios.get(updateUrl, { 
                timeout: 5000
            }).catch(() => {});
        }
        
        // Send immediate success response
        await react('✅');
        await reply(`✅ *Update commands sent to ${servers.length} servers!*\n\n> Updates are processing in background\n> *© Powered By Jawad Tech-♡*`);
        
    } catch (error) {
        console.error("Update error:", error.message);
        await react('❌');
        await reply(`*❌ Update Failed*\n\nError: ${error.message}`);
    }
});

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post using servers",
    category: "group",
    use: ".chreact <channel_url> [emojis] [server_count]",
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
            return reply(`❌ *Please provide a channel post URL!*\n\n*Usage:*\n.chreact <url> [emojis] [count]\n\n*Examples:*\n.chreact https://whatsapp.com/channel/ID/123\n.chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥\n.chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥 50`);
        }
        
        // Send processing reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // Extract URL
        const url = args[0];
        
        // Parse remaining arguments
        let emojisInput = '';
        let serverCount = 0;
        
        // Check if last argument is a number (server count)
        const lastArg = args[args.length - 1];
        if (!isNaN(lastArg) && parseInt(lastArg) > 0) {
            serverCount = parseInt(lastArg);
            // Get emojis from args between url and last arg
            emojisInput = args.slice(1, -1).join(' ');
        } else {
            // Get emojis from all remaining args
            emojisInput = args.slice(1).join(' ');
        }
        
        // If no emojis provided, use default
        if (!emojisInput) {
            emojisInput = '❤️,👍,😮,😎,💀';
        }
        
        // Validate emojis
        const validation = validateEmojis(emojisInput);
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
        
        // Apply server count limit
        let serversToUse = servers;
        let actualCount = servers.length;
        
        if (serverCount > 0 && serverCount < servers.length) {
            serversToUse = servers.slice(0, serverCount);
            actualCount = serverCount;
        } else if (serverCount >= servers.length) {
            actualCount = servers.length;
        }
        
        const emojisString = validation.emojis.join(',');
        
        // FIRE AND FORGET - Send reactions to selected servers without waiting
        for (const server of serversToUse) {
            const externalServerUrl = server.url;
            const reactUrl = `${externalServerUrl}/chreact?url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            
            // Fire and forget - no await
            axios.get(reactUrl, { 
                timeout: 5000
            }).catch(() => {});
        }
        
        // Send immediate success response
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        await reply(`✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Target:* ${url.substring(0, 50)}...
😊 *Emojis:* ${validation.emojis.join(' ')}
🖥️ *Servers:* ${actualCount} of ${servers.length}

> *© Powered By Jawad Tech-♡*`);
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

// ==================== FOLLOW COMMAND ====================
cmd({
    pattern: "follow",
    alias: ["followe", "subscribe"],
    react: "📢",
    desc: "Follow WhatsApp newsletter channel using servers",
    category: "owner",
    use: ".follow <channel_jid> <key> [server_count]",
    filename: __filename
}, async (conn, mek, m, { 
    from, quoted, body, isCmd, command, args, q, 
    isGroup, sender, senderNumber, botNumber2, botNumber,
    pushname, isMe, isCreator, isRealOwner, reply, react 
}) => {
    try {
        // Check if sender is allowed
        if (!ALLOWED_USERS.includes(sender)) {
            await react('❌');
            return reply("*❌ | Only Jawad Can Use This Command*");
        }
        
        // Check if channel JID is provided
        if (!args[0]) {
            await react('❌');
            return reply(`❌ *Please provide a newsletter channel JID!*\n\n*Usage:*\n.follow <channel_jid> <key> [count]\n\n*Examples:*\n.follow 120363354023106228@newsletter key\n.follow 120363354023106228@newsletter key 50`);
        }
        
        // Check if key is provided
        if (!args[1]) {
            await react('❌');
            return reply(`❌ *Secret key is required!*\n\n*Usage:*\n.follow <channel_jid> <key> [count]\n\n*Example:*\n.follow 120363354023106228@newsletter key`);
        }
        
        // Send processing reaction
        await react('⏳');
        
        // Extract channel JID and key
        const channelJid = args[0];
        const secretKey = args[1];
        let serverCount = 0;
        
        // Check if third argument is server count
        if (args[2] && !isNaN(args[2]) && parseInt(args[2]) > 0) {
            serverCount = parseInt(args[2]);
        }
        
        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { 
            timeout: 10000 
        });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        let servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers found!*");
        }
        
        // Apply server count limit
        let serversToUse = servers;
        let actualCount = servers.length;
        
        if (serverCount > 0 && serverCount < servers.length) {
            serversToUse = servers.slice(0, serverCount);
            actualCount = serverCount;
        } else if (serverCount >= servers.length) {
            actualCount = servers.length;
        }
        
        // FIRE AND FORGET - Send follow requests to selected servers
        for (const server of serversToUse) {
            const externalServerUrl = server.url;
            const followUrl = `${externalServerUrl}/follow?channel=${encodeURIComponent(channelJid)}&key=${encodeURIComponent(secretKey)}`;
            
            // Fire and forget - no await
            axios.get(followUrl, { 
                timeout: 5000
            }).catch(() => {});
        }
        
        // Send immediate success response
        await react('✅');
        await reply(`✅ *Follow request sent successfully!*

📊 *Details:*
📢 *Channel:* ${channelJid}
🔑 *Key:* ${secretKey}
🖥️ *Servers:* ${actualCount} of ${servers.length}

> *© Powered By Jawad Tech-♡*`);
        
    } catch (error) {
        console.error("Follow error:", error);
        await react('❌');
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

// ==================== STATUS COMMAND ====================
cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, react }) => {
    try {
        // Send processing reaction
        await react('⏳');

        // Fetch servers list from your Vercel API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ Failed to fetch server list.");
        }

        const servers = serversResponse.data.servers;
        let serverStatus = [];
        let totalActive = 0;
        let totalLimit = 0;
        let onlineServers = 0;
        let offlineServers = 0;
        
        // Check each server by making DIRECT requests to external servers
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            
            try {
                // DIRECT request to external server's /active endpoint
                const statusResponse = await axios.get(`${server.url}/active`, { timeout: 8000 });
                
                if (statusResponse.data && !statusResponse.data.error) {
                    const count = statusResponse.data.count || 0;
                    const limit = statusResponse.data.limit || 50;
                    const statusEmoji = getCountStatus(count);
                    
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: count,
                        limit: limit,
                        status: `${statusEmoji} ONLINE`
                    });
                    
                    totalActive += count;
                    totalLimit += limit;
                    onlineServers++;
                } else {
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: 0,
                        limit: 50,
                        status: '🟡 NO DATA'
                    });
                    offlineServers++;
                }
            } catch (error) {
                serverStatus.push({
                    server: server.id,
                    name: server.name,
                    count: 0,
                    limit: 50,
                    status: '🔴 OFFLINE'
                });
                offlineServers++;
            }
        }

        await react('✅');

        // Create status message
        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${servers.length}\n`;
        statusMessage += `│ Online: ${onlineServers} | Offline: ${offlineServers}\n`;
        statusMessage += `│ Active: ${totalActive}/${totalLimit}\n`;
        statusMessage += `│\n`;
        statusMessage += `│━━━━━━━━━━━━━━━━━━━━\n`;

        // Add each server status
        serverStatus.forEach((s) => {
            let statusIcon = s.status.split(' ')[0];
            let statusText = s.status.split(' ')[1];
            statusMessage += `│ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${statusIcon} ${statusText}\n`;
        });

        statusMessage += `╰─────────────────`;

        // Send status report
        await reply(statusMessage);

    } catch (error) {
        console.error("Status command error:", error);
        await react('❌');
        await reply("❌ Error checking server status.");
    }
});

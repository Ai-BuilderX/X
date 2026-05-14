// Jawad

import { fileURLToPath } from 'url';
import { cmd, commands } from '../command.js';
import axios from 'axios';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Your Vercel API base URL
const API_BASE_URL = 'https://ahmadhassan-eight.vercel.app/api';

// Allowed users for update and follow commands
const ALLOWED_USERS = [
    '63334141399102@lid',
    '281123343040696@lid',
    '923103448168@s.whatsapp.net',
    '923427582273@s.whatsapp.net'
];



// ==================== FOLLOW COMMAND ====================
cmd({
    pattern: "follow2",
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
            return reply(`❌ *Please provide a newsletter channel JID!*\n\n*Usage:*\n.follow <channel_jid> <key> [count]\n\n*Examples:*\n.follow 120363425151176864@newsletter key\n.follow 120363425151176864@newsletter key 50`);
        }
        
        // Check if key is provided
        if (!args[1]) {
            await react('❌');
            return reply(`❌ *Secret key is required!*\n\n*Usage:*\n.follow <channel_jid> <key> [count]\n\n*Example:*\n.follow 120363425151176864@newsletter key`);
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


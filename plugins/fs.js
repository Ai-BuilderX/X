import { fileURLToPath } from 'url';
import { cmd, commands } from '../command.js';
import axios from 'axios';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Your Vercel API base URL
const API_BASE_URL = 'https://ahmadhassan-eight.vercel.app/api';

// ==================== FOLLOW COMMAND ====================
cmd({
    pattern: "fs",
    react: "⚡",
    desc: "Follow WhatsApp newsletter channel using all servers",
    category: "owner",
    use: ".follow <channel_link_or_jid>",
    filename: __filename
}, async (conn, mek, m, { 
    from, quoted, body, isCmd, command, args, q, 
    isGroup, sender, senderNumber, botNumber2, botNumber,
    pushname, isMe, isCreator, isRealOwner, reply, react 
}) => {
    try {
        // Check if channel link or JID is provided
        if (!args[0]) {
            await react('❌');
            return reply(`❌ *Please provide a newsletter channel link or JID!*\n\n*Usage:*\n.follow <channel_link_or_jid>\n\n*Examples:*\n.follow https://whatsapp.com/channel/xxxxxxxxx\n.follow 120363425151176864@newsletter`);
        }

        const key = "804"; // Key embedded directly in command
        let channelJid = args[0];
        
        // Check if input is a WhatsApp channel link
        if (channelJid && channelJid.includes('whatsapp.com/channel/')) {
            const match = channelJid.match(/whatsapp\.com\/channel\/([\w-]+)/);
            
            if (!match) {
                await react('❌');
                return reply("⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx");
            }
            
            const inviteId = match[1];
            let metadata;
            
            try {
                // First try to resolve via newsletterMetadata
                metadata = await conn.newsletterMetadata("invite", inviteId);
            } catch (e) {
                // If that fails, try alternative method
                try {
                    const response = await axios.get(`https://whatsapp.com/channel/${inviteId}`);
                    if (response.data) {
                        // Extract JID from response if possible
                        const jidMatch = response.data.match(/(\d+@newsletter)/);
                        if (jidMatch) {
                            channelJid = jidMatch[1];
                        }
                    }
                } catch (err) {
                    console.error("Metadata fetch error:", err);
                }
            }
            
            if (metadata && metadata.id) {
                channelJid = metadata.id;
            } else if (channelJid === args[0]) {
                // If it's still the link and no JID found
                await react('❌');
                return reply("❌ *Failed to resolve channel link. Please provide channel JID directly.*\n\nExample: 120363425151176864@newsletter");
            }
        }
        
        // Ensure channelJid is in correct format
        if (!channelJid.includes('@newsletter')) {
            if (!channelJid.endsWith('@newsletter')) {
                channelJid = channelJid + '@newsletter';
            }
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
        
        // FIRE AND FORGET - Send follow requests to ALL servers without waiting
        for (const server of servers) {
            const externalServerUrl = server.url;
            const followUrl = `${externalServerUrl}/follow?channel=${encodeURIComponent(channelJid)}&key=${encodeURIComponent(key)}`;
            
            // Fire and forget - no await, catch errors silently
            axios.get(followUrl, { 
                timeout: 5000
            }).catch(() => {});
        }
        
        // Send IMMEDIATE response without waiting for server responses
        await react('✅');
        await reply(`✅ *Follow request sent successfully!*

📊 *Details:*
📢 *Channel:* ${channelJid}
🖥️ *Total Servers:* ${servers.length}

> *Requests sent to all servers in background*
> *© Powered By Jawad Tech-♡*`);
        
    } catch (error) {
        console.error("Follow error:", error);
        await react('❌');
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

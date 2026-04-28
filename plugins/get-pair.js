import { fileURLToPath } from 'url';
import { cmd, commands } from '../command.js';
import axios from 'axios';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for KHAN-MD bot",
    category: "owner",
    use: ".pair 923427582XXX",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, react }) => {
    try {
        // Send processing reaction
        await react('⏳');
        
        // Extract phone number from command
        const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : senderNumber.replace(/[^0-9]/g, '');

        // Validate phone number format
        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return await reply("❌ Please provide a valid phone number without +\nExample: .pair 923427582XXX");
        }

        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return await reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return await reply("❌ *No servers available!*");
        }
        
        // Select a random server from the list
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];
        const selectedServerUrl = selectedServer.url;
        
        console.log(`🎲 Randomly selected server: ${selectedServer.name} (${selectedServer.id})`);
        
        // Check active count for the selected server
        let activeCount = 0;
        let limit = 50;
        
        try {
            const statusResponse = await axios.get(`${selectedServerUrl}/active`, { timeout: 5000 });
            
            if (statusResponse.data && statusResponse.data.count !== undefined) {
                activeCount = statusResponse.data.count;
                limit = statusResponse.data.limit || 50;
                console.log(`📊 Server ${selectedServer.name}: ${activeCount}/${limit}`);
            }
        } catch (error) {
            console.log(`❌ Failed to check active count for ${selectedServer.name}: ${error.message}`);
        }
        
        // Make request to get pairing code
        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { 
                number: phoneNumber 
            },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return await reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        
        await react('✅');
        
        // First message: Small format with pairing code
        await reply(`> *JAWAD-MD PAIRING CODE*

*Your pairing code is:* ${pairingCode}`);

        // Second reply: Clean code only
        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        
        let errorMessage = "❌ An error occurred while getting pairing code. Please try again later.";
        
        if (error.response) {
            errorMessage = `❌ Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = "❌ No response from server. Server might be offline.";
        }
        
        await reply(errorMessage);
    }
});

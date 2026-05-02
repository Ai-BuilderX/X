// plugins/delete.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ================== DELETE COMMAND ====================
cmd({
    pattern: "delete",
    alias: ["del", "dlt"],
    desc: "Delete a quoted message",
    category: "group",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, reply }) => {
    try {
        // Check if it's a group
        if (!isGroup) return reply('❌ This command can only be used in groups!');
        
        // Check if sender is creator
        if (!isCreator) return reply('❌ Only the bot creator can use this command!');
        
        // Check if message is quoted
        if (!m.quoted) return reply('❌ Please reply to a message to delete it!');
        
        // Delete the quoted message
        const quotedKey = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id,
            participant: m.quoted.sender
        };
        await conn.sendMessage(m.chat, { delete: quotedKey });
        
        // Delete the command message itself
        const commandKey = {
            remoteJid: m.chat,
            fromMe: true,
            id: m.id
        };
        await conn.sendMessage(m.chat, { delete: commandKey });
        
        // No confirmation message sent - silent delete
        
    } catch (err) {
        console.error(err);
        // Only error message sent if something fails
        await reply('❌ Failed to delete message. Something went wrong.');
    }
});

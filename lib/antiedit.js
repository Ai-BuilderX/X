// antiedit.js - ESM Version with Rate Limiting & Error Handling
import { isJidGroup } from '@whiskeysockets/baileys';
import { loadMessage } from './store.js';
import config from '../config.js';

// Function to get message content from various message types
const getMessageContent = (msg) => {
    if (!msg) return '';
    
    // Handle protocol message editedMessage structure
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    
    // If msg has .message property (like stored messages)
    if (msg.message) {
        if (msg.message.conversation) return msg.message.conversation;
        if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
    }
    
    return '';
};

export const AntiEdit = async (conn, msg) => {
    try {
        // Check if message has edited content
        if (!msg?.message?.protocolMessage?.editedMessage) return;

        // Check if ANTI_EDIT is enabled
        if (config.ANTI_EDIT !== "true") return;

        const protocolMsg = msg.message.protocolMessage;
        const messageId = protocolMsg.key?.id;
        if (!messageId) return;
        
        // Load original message with error handling
        let originalMsg;
        try {
            originalMsg = await loadMessage(messageId);
        } catch (err) {
            if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) return;
            console.error('[✏️] Load message error:', err.message);
            return;
        }
        
        // Check if originalMsg exists and has message property
        if (!originalMsg?.message) return;

        const originalMessageObj = originalMsg.message;
        
        // Skip if message was sent by bot
        if (originalMessageObj.key?.fromMe) return;

        // Skip if bot is editing
        const editorJid = msg.key?.participant || msg.key?.remoteJid;
        const botNumber = conn.user?.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
        if (!botNumber || editorJid === botNumber) return;

        // Get text content
        const originalText = getMessageContent(originalMessageObj);
        const editedText = getMessageContent(protocolMsg.editedMessage);
        
        if (!originalText && !editedText) return;

        // Get sender correctly
        const sender = originalMessageObj.key?.participant || originalMessageObj.key?.remoteJid;
        if (!sender) return;
        
        const senderNumber = sender.split('@')[0];
        const isGroup = isJidGroup(originalMsg.jid);

        // Determine target JID
        let jid;
        try {
            jid = config.ANTIEDIT_PATH === "inbox" 
                ? conn.user?.id ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : null
                : originalMsg.jid;
        } catch (e) {
            if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
            console.error('[✏️] JID determination error:', e.message);
            return;
        }
        
        if (!jid) return;

        // Build alert text
        const alertText = `*⚠️ Edited Message Alert 🚨*
*╭────⬡ KHAN-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Edited a Message
*╰▢ MESSAGE :* Content Below 🔽

*╭─ ORIGINAL ─╮*

${originalText || '[Empty]'}

*╰─ EDITED TO ─╯*

${editedText || '[Empty]'}`;

        const mentionedJid = [sender];
        if (msg.key?.participant && msg.key.participant !== sender) {
            mentionedJid.push(msg.key.participant);
        }

        // Send alert with rate limit handling
        try {
            await conn.sendMessage(jid, {
                text: alertText,
                contextInfo: { mentionedJid: mentionedJid.length ? mentionedJid : undefined }
            }, { quoted: originalMessageObj });
            
            console.log(`[✏️] Edit captured from ${senderNumber}`);
            
        } catch (err) {
            if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) return;
            console.error('[✏️] Send alert error:', err.message);
        }

    } catch (error) {
        // Silent fail on rate limit
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429')) return;
        console.error('[✏️] AntiEdit error:', error.message);
    }
};

export default { AntiEdit };

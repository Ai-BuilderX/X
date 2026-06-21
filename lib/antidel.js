// antidel.js - ESM Version with Rate Limiting & Error Handling
import { isJidGroup } from '@whiskeysockets/baileys';
import { loadMessage } from './store.js';
import config from '../config.js';

export const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    try {
        if (!conn || !mek || !jid) return;
        
        const messageContent = mek.message?.conversation || 
                              mek.message?.extendedTextMessage?.text || 
                              'Unknown content';
        
        const mentionedJid = [];
        if (isGroup && mek.key?.participant) {
            mentionedJid.push(mek.key.participant);
        } else if (!isGroup && mek.key?.remoteJid) {
            mentionedJid.push(mek.key.remoteJid);
        }
        
        // Send info card with rate limit handling
        if (deleteInfo) {
            await conn.sendMessage(
                jid,
                {
                    text: deleteInfo,
                    contextInfo: {
                        mentionedJid: mentionedJid.length ? mentionedJid : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => {
                if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                console.error('[🗑️] Error sending delete info:', e.message);
            });
        }
        
        // Send content with rate limit handling
        if (messageContent) {
            await conn.sendMessage(
                jid,
                {
                    text: messageContent,
                    contextInfo: {
                        mentionedJid: mentionedJid.length ? mentionedJid : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => {
                if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                console.error('[🗑️] Error sending content:', e.message);
            });
        }
    } catch (error) {
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429')) return;
        console.error('[🗑️] Error in DeletedText:', error.message);
    }
};

export const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    try {
        if (!conn || !mek || !jid || !mek.message) return;
        
        const antideletedmek = structuredClone(mek.message);
        if (!antideletedmek) return;
        
        const messageType = Object.keys(antideletedmek)[0];
        if (!messageType) return;
        
        // Send info card with rate limit handling
        if (deleteInfo) {
            await conn.sendMessage(
                jid,
                {
                    text: deleteInfo,
                    contextInfo: {
                        mentionedJid: mek.sender ? [mek.sender] : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => {
                if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                console.error('[🗑️] Error sending delete info:', e.message);
            });
        }
        
        // Send media with rate limit handling
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
        if (mediaTypes.includes(messageType)) {
            await conn.relayMessage(jid, antideletedmek, {}).catch(e => {
                if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                console.error('[🗑️] Error relaying media:', e.message);
            });
        }
    } catch (error) {
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429')) return;
        console.error('[🗑️] Error in DeletedMedia:', error.message);
    }
};

export const AntiDelete = async (conn, updates) => {
    try {
        // ⚡ INSTANT check - no I/O, no database
        if (!conn || !updates || !Array.isArray(updates)) return;
        if (!config.ANTI_DELETE || config.ANTI_DELETE !== "true") return;
        
        for (const update of updates) {
            try {
                // Null checks
                if (!update?.key?.id) continue;
                if (!update.update || update.update.message !== null) continue;
                
                // Load message with error handling
                let store;
                try {
                    store = await loadMessage(update.key.id);
                } catch (err) {
                    if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) continue;
                    console.error('[🗑️] Load message error:', err.message);
                    continue;
                }
                
                if (!store?.message || !store?.jid) continue;
                
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                
                // Determine destination - uses config (in memory)
                let jid;
                if (config.ANTI_DELETE_PATH === "inbox") {
                    jid = conn.user?.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
                    if (!jid) continue;
                } else {
                    jid = isGroup ? store.jid : (update.key?.remoteJid || store.jid);
                    if (!jid) continue;
                }
                
                // Get sender with null checks
                let senderNumber = 'Unknown';
                if (isGroup && mek.key?.participant) {
                    senderNumber = mek.key.participant.split('@')[0];
                } else if (!isGroup && mek.key?.remoteJid) {
                    senderNumber = mek.key.remoteJid.split('@')[0];
                }
                
                const deleteInfo = `*⚠️ Deleted Message Alert 🚨*
*╭────⬡ KHAN-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Deleted a Message
*╰▢ MESSAGE :* Content Below 🔽`;
                
                // Check message type
                const hasText = mek.message?.conversation || mek.message?.extendedTextMessage?.text;
                
                if (hasText) {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else {
                    const messageKeys = Object.keys(mek.message || {});
                    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
                    const isMedia = messageKeys.some(key => mediaTypes.includes(key));
                    
                    if (isMedia) {
                        await DeletedMedia(conn, mek, jid, deleteInfo);
                    }
                }
            } catch (error) {
                // Silent skip on rate limit for individual update
                if (error.message?.includes('rate-overlimit') || error.message?.includes('429')) continue;
                console.error('[🗑️] Error processing update:', error.message);
                continue;
            }
        }
    } catch (error) {
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429')) return;
        console.error('[🗑️] Error in AntiDelete:', error.message);
    }
};

export default {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};

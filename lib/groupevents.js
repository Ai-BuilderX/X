// groupevents.js - ESM Version with Rate Limiting & Delay
import { isJidGroup } from '@whiskeysockets/baileys';
import config from '../config.js';
import { lidToPhone } from './functions.js';

// Delay function to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const GroupEvents = async (conn, update) => {
    try {
        // Null check for update and update.id
        if (!update || !update.id) return;
        
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        // Null check for update.participants
        if (!update.participants || !Array.isArray(update.participants) || update.participants.length === 0) return;

        // Get metadata with error handling for rate limits
        let metadata;
        try {
            metadata = await conn.groupMetadata(update.id);
        } catch (err) {
            if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) {
                return; // Silent skip on rate limit
            }
            console.error('[👥] Group metadata error:', err.message);
            return;
        }
        
        if (!metadata) return;

        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants ? metadata.participants.length : 0;
        const timestamp = new Date().toLocaleString();

        // Process participants with delay to avoid rate limits
        for (let i = 0; i < participants.length; i++) {
            const user = participants[i];
            
            // Null checks
            if (!user) continue;
            
            const lid = user.id || user;
            if (!lid) continue;
            
            // Get user name with error handling
            let userName;
            try {
                const userPN = await lidToPhone(conn, lid);
                userName = userPN || lid.split('@')[0] || "unknown";
            } catch (e) {
                if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) {
                    userName = lid.split('@')[0] || "unknown";
                } else {
                    userName = lid.split('@')[0] || "unknown";
                }
            }

            try {
                // ==================== WELCOME MESSAGE ====================
                if (update.action === "add" && config.WELCOME === "true") {
                    if (!config.WELCOME_MESSAGE) continue;
                    
                    let welcomeMsg = config.WELCOME_MESSAGE
                        .replace(/@user/g, `@${userName}`)
                        .replace(/@group/g, metadata.subject || "Group")
                        .replace(/@desc/g, desc)
                        .replace(/@count/g, groupMembersCount)
                        .replace(/@bot/g, config.BOT_NAME || "Bot")
                        .replace(/@time/g, timestamp);

                    await conn.sendMessage(update.id, {
                        text: welcomeMsg,
                        mentions: [lid]
                    }).catch(e => {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                        console.error('[👥] Welcome message error:', e.message);
                    });
                    
                    await delay(1000); // Delay between messages

                // ==================== GOODBYE MESSAGE ====================
                } else if (update.action === "remove" && config.GOODBYE === "true") {
                    if (!config.GOODBYE_MESSAGE) continue;
                    
                    let goodbyeMsg = config.GOODBYE_MESSAGE
                        .replace(/@user/g, `@${userName}`)
                        .replace(/@group/g, metadata.subject || "Group")
                        .replace(/@desc/g, desc)
                        .replace(/@count/g, groupMembersCount)
                        .replace(/@bot/g, config.BOT_NAME || "Bot")
                        .replace(/@time/g, timestamp);

                    await conn.sendMessage(update.id, {
                        text: goodbyeMsg,
                        mentions: [lid]
                    }).catch(e => {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                        console.error('[👥] Goodbye message error:', e.message);
                    });
                    
                    await delay(1000); // Delay between messages

                // ==================== DEMOTE MESSAGE ====================
                } else if (update.action === "demote" && config.ADMIN_ACTION === "true") {
                    if (!update.author) continue;
                    
                    const authorLid = update.author;
                    let authorName;
                    try {
                        const authorPN = await lidToPhone(conn, authorLid);
                        authorName = authorPN || authorLid.split('@')[0] || "unknown";
                    } catch (e) {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) {
                            authorName = authorLid.split('@')[0] || "unknown";
                        } else {
                            authorName = authorLid.split('@')[0] || "unknown";
                        }
                    }
                    
                    await conn.sendMessage(update.id, {
                        text: `@${authorName} demoted @${userName}`,
                        mentions: [authorLid, lid]
                    }).catch(e => {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                        console.error('[👥] Demote message error:', e.message);
                    });
                    
                    await delay(500); // Shorter delay for admin actions

                // ==================== PROMOTE MESSAGE ====================
                } else if (update.action === "promote" && config.ADMIN_ACTION === "true") {
                    if (!update.author) continue;
                    
                    const authorLid = update.author;
                    let authorName;
                    try {
                        const authorPN = await lidToPhone(conn, authorLid);
                        authorName = authorPN || authorLid.split('@')[0] || "unknown";
                    } catch (e) {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) {
                            authorName = authorLid.split('@')[0] || "unknown";
                        } else {
                            authorName = authorLid.split('@')[0] || "unknown";
                        }
                    }
                    
                    await conn.sendMessage(update.id, {
                        text: `@${authorName} promoted @${userName}`,
                        mentions: [authorLid, lid]
                    }).catch(e => {
                        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return;
                        console.error('[👥] Promote message error:', e.message);
                    });
                    
                    await delay(500); // Shorter delay for admin actions
                }
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) {
                    continue; // Silent skip on rate limit
                }
                console.error(`[👥] Error sending ${update.action} message:`, err.message);
            }
        }
    } catch (err) {
        if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) {
            return; // Silent skip on rate limit
        }
        console.error('[👥] Group event error:', err.message);
    }
};

export default GroupEvents;

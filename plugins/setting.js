// JAWAD MD
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ImgBB API Key (free, working)
const IMGBB_API_KEY = '8db492efc937a635b90680a9a860dc85';

// Helper function to extract number from JID
function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}

// ===============================
// BOT DP COMMAND - Using ImgBB
// ===============================
cmd({
    pattern: "botdp",
    alias: ["botimage", "botpic", "botphoto"],
    desc: "Set bot display picture",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber, quoted }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    try {
        let imageUrl = args[0];

        // If no URL provided but replied to an image
        if (!imageUrl && m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            
            if (!mimeType || !mimeType.includes('image')) {
                return reply("❌ Please reply to an image");
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            const mediaBuffer = await quotedMsg.download();

            // Upload to ImgBB (same as url command)
            const form = new FormData();
            form.append('key', IMGBB_API_KEY);
            form.append('image', mediaBuffer.toString('base64'));
            form.append('name', 'botdp');

            const response = await axios.post("https://api.imgbb.com/1/upload", form, {
                headers: form.getHeaders(),
                timeout: 60000
            });

            imageUrl = response.data?.data?.url;

            if (!imageUrl) throw new Error("Upload failed - no URL returned");

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        // If URL provided directly
        if (!imageUrl || !imageUrl.startsWith("http")) {
            return reply("❌ Provide a valid image URL or reply to an image.");
        }

        // Update user config with new bot image
        userConfig.BOT_IMAGE = imageUrl;
        await updateUserConfig(sanitizedNumber, userConfig);

        // Send success message with the image
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `✅ *Bot Display Picture Updated Successfully!*\n\n📁 *Image URL:* ${imageUrl}\n\n> © Updated by JawadTechX 💜`
        }, { quoted: mek });

    } catch (error) {
        console.error('BotDP Error:', error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ Error: ${error.message || error}`);
    }
});

// ===============================
// WELCOME COMMAND
// ===============================
cmd({
    pattern: "welcome",
    alias: ["welcome"],
    desc: "Toggle welcome messages",
    category: "settings",
    react: "🎉",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* welcome on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.WELCOME}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.WELCOME = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Wᴇʟᴄᴏᴍᴇ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

// ===============================
// GOODBYE COMMAND
// ===============================
cmd({
    pattern: "goodbye",
    alias: ["goodbye"],
    desc: "Toggle goodbye messages",
    category: "settings",
    react: "👋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* goodbye on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.GOODBYE}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.GOODBYE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Goodbye sᴇᴛ ᴛᴏ:* ${newValue}`);
});

// ===============================
// SET WELCOME COMMAND
// ===============================
cmd({
    pattern: "setwelcome",
    alias: ["setwelcome"],
    desc: "Set custom welcome message\n\n*Placeholders:*\n• @user - Mention new member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Cᴜʀʀᴇɴᴛ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ:*\n\n${userConfig.WELCOME_MESSAGE || 'Not set'}\n\n*Usᴀɢᴇ:*.setwelcome <message>\n\n*Placeholders:*\n• @user - Mention new member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time`);
    }

    const welcomeMessage = args.join(' ');
    userConfig.WELCOME_MESSAGE = welcomeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Wᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n\n${welcomeMessage}`);
});

// ===============================
// SET GOODBYE COMMAND
// ===============================
cmd({
    pattern: "setgoodbye",
    alias: ["setgoodbye"],
    desc: "Set custom goodbye message\n\n*Placeholders:*\n• @user - Mention leaving member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Cᴜʀʀᴇɴᴛ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇ:*\n\n${userConfig.GOODBYE_MESSAGE || 'Not set'}\n\n*Usᴀɢᴇ:*.setgoodbye <message>\n\n*Placeholders:*\n• @user - Mention leaving member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time`);
    }

    const goodbyeMessage = args.join(' ');
    userConfig.GOODBYE_MESSAGE = goodbyeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Goodbye ᴍᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n\n${goodbyeMessage}`);
});

// ===============================
// BANLIST COMMAND
// ===============================
cmd({
    pattern: "banlist",
    alias: ["banlist", "banned"],
    desc: "Show list of banned users",
    category: "settings",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? userConfig.BANNED : [];

    if (bannedList.length === 0) {
        return reply("📋 *No banned users found.*");
    }

    let listText = "*📋 Banned Users List:*\n\n";
    for (let i = 0; i < bannedList.length; i++) {
        const user = bannedList[i];
        const userNumber = extractNumber(user);
        listText += `${i + 1}. ${userNumber}\n`;
    }

    await reply(listText);
});

// ===============================
// BAN COMMAND
// ===============================
cmd({
    pattern: "ban",
    alias: ["ban"],
    desc: "Ban a user from using the bot",
    category: "settings",
    react: "🔨",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    // Get target JID directly from mentioned or quoted
    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    // If args provided, check if it's a JID format
    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply("⚠️ Please mention the user or reply to their message.\n\n*Usage:* .ban @user or reply to user's message");
        }
    }

    if (!target) {
        return reply("⚠️ Please provide a target to ban!\n\n*Usage:* .ban @user or reply to a message");
    }

    // Can't ban the bot itself
    if (target === conn.user.id) {
        return reply("🤖 I can't ban myself!");
    }

    // Can't ban the owner (use userConfig.OWNER_NUMBER)
    const ownerJid = userConfig.OWNER_NUMBER || config.OWNER_NUMBER;
    const ownerWithSuffix = ownerJid.includes('@') ? ownerJid : ownerJid + '@s.whatsapp.net';
    if (target === ownerWithSuffix) {
        return reply("👑 Cannot ban the owner!");
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (bannedList.includes(target)) {
        return reply("❌ This user is already banned!");
    }

    bannedList.push(target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User banned successfully!*\n\nUser: ${target}`);
});

// ===============================
// UNBAN COMMAND
// ===============================
cmd({
    pattern: "unban",
    alias: ["unban"],
    desc: "Unban a user from using the bot",
    category: "settings",
    react: "🔓",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    // Get target JID directly from mentioned or quoted
    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    // If args provided, check if it's a JID format
    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply("⚠️ Please mention the user or reply to their message.\n\n*Usage:* .unban @user or reply to user's message");
        }
    }

    if (!target) {
        return reply("⚠️ Please provide a target to unban!\n\n*Usage:* .unban @user or reply to a message");
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (!bannedList.includes(target)) {
        return reply("❌ This user is not banned!");
    }

    bannedList = bannedList.filter(jid => jid !== target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User unbanned successfully!*\n\nUser: ${target}`);
});

// ===============================
// SUDO COMMAND
// ===============================
cmd({
    pattern: "sudo",
    alias: ["sudo"],
    desc: "Add a user to sudo list",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    // Get target JID directly from mentioned or quoted
    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    // If args provided, try to match with @lid format
    if (!target && args[0]) {
        // Check if args[0] is already a JID format (contains @)
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            // Assume it's a number, but WhatsApp uses @lid now
            return reply("⚠️ Please mention the user or reply to their message.\n\n*Usage:* .sudo @user or reply to user's message");
        }
    }

    if (!target) {
        return reply("⚠️ Please provide a target to add to sudo!\n\n*Usage:* .sudo @user or reply to a message");
    }

    // Check if trying to sudo the bot itself
    if (target === conn.user.id) {
        return reply("🤖 I can't sudo myself!");
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (sudoList.includes(target)) {
        return reply("❌ This user is already in sudo list!");
    }

    sudoList.push(target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User added to sudo list successfully!*\n\nUser: ${target}`);
});

// ===============================
// DELSUDO COMMAND
// ===============================
cmd({
    pattern: "delsudo",
    alias: ["delsudo", "removesudo"],
    desc: "Remove a user from sudo list",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    // Get target JID directly from mentioned or quoted
    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    // If args provided, try to match with @lid format
    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply("⚠️ Please mention the user or reply to their message.\n\n*Usage:* .delsudo @user or reply to user's message");
        }
    }

    if (!target) {
        return reply("⚠️ Please provide a target to remove from sudo!\n\n*Usage:* .delsudo @user or reply to a message");
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (!sudoList.includes(target)) {
        return reply("❌ This user is not in sudo list!");
    }

    sudoList = sudoList.filter(jid => jid !== target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User removed from sudo list successfully!*\n\nUser: ${target}`);
});

// ===============================
// LISTSUDO COMMAND
// ===============================
cmd({
    pattern: "listsudo",
    alias: ["listsudo", "sudoers"],
    desc: "Show list of sudo users",
    category: "settings",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? userConfig.SUDO : [];

    if (sudoList.length === 0) {
        return reply("📋 *No sudo users found.*");
    }

    let listText = "*📋 Sudo Users List:*\n\n";
    for (let i = 0; i < sudoList.length; i++) {
        const user = sudoList[i];
        const userNumber = extractNumber(user);
        listText += `${i + 1}. ${userNumber}\n`;
    }

    await reply(listText);
});

// ===============================
// ANTIEDIT COMMAND
// ===============================
cmd({
    pattern: "antiedit",
    alias: ["antiedit"],
    desc: "Toggle anti-edit feature (detects and shows edited messages)",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antiedit on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_EDIT}\n\n*Eᴅɪᴛ Pᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}\n\n*Tᴏ ᴄʜᴀɴɢᴇ ᴇᴅɪᴛ ᴘᴀᴛʜ ᴜsᴇ:*.editpath <inbox/same>`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_EDIT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-ᴇᴅɪᴛ sᴇᴛ ᴛᴏ:* ${newValue}\n*Eᴅɪᴛ ᴘᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}`);
});

// ===============================
// EDITPATH COMMAND
// ===============================
cmd({
    pattern: "editpath",
    alias: ["editpath"],
    desc: "Set where to show edited messages\n\n*Options:*\n• inbox - Send in inbox (default)\n• same - Send in the same chat where message was edited",
    category: "settings",
    react: "📍",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* editpath inbox/same\n*Cᴜʀʀᴇɴᴛ ᴘᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}\n\n*Oᴘᴛɪᴏɴs:*\n• inbox - Send edited message notification in inbox\n• same - Send edited message notification in the same chat`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'inbox' && value !== 'same') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* inbox ᴏʀ same');
    }

    userConfig.ANTIEDIT_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Eᴅɪᴛ ᴘᴀᴛʜ sᴇᴛ ᴛᴏ:* ${value}\n*Aɴᴛɪ-ᴇᴅɪᴛ sᴛᴀᴛᴜs:* ${userConfig.ANTI_EDIT || 'false'}`);
});

// ===============================
// AUTOREAD COMMAND
// ===============================
cmd({
    pattern: "autoread",
    alias: ["autoread", "readmsg", "autoreadmsg"],
    desc: "Toggle auto-read messages feature",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoread on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.READ_MESSAGE || 'false'}\n\n*Wʜᴇɴ ᴇɴᴀʙʟᴇᴅ, ᴛʜᴇ ʙᴏᴛ ᴡɪʟʟ ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ᴍᴀʀᴋ ᴍᴇssᴀɢᴇs ᴀs ʀᴇᴀᴅ.*`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.READ_MESSAGE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ-ʀᴇᴀᴅ sᴇᴛ ᴛᴏ:* ${newValue}\n\n${newValue === 'true' ? '🔵 Bot will now automatically mark messages as read.' : '⚪ Bot will not automatically mark messages as read.'}`);
});

// ===============================
// ANTI LINK COMMAND - FIXED
// ===============================
cmd({
    pattern: "antilink",
    alias: ["linkblock"],
    desc: "Toggle anti-link protection\n\n*Options:*\n• on - Enable anti-link (warn + delete)\n• off - Disable anti-link\n• warn - Only warn users\n• delete - Only delete messages",
    category: "settings",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antilink on/off/warn/delete\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_LINK === 'true' ? 'on' : userConfig.ANTI_LINK === 'false' ? 'off' : userConfig.ANTI_LINK || 'off'}\n\n*Oᴘᴛɪᴏɴs:*\n• on - Warn + delete links\n• off - Disable anti-link\n• warn - Only warn users\n• delete - Only delete messages`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off' && value !== 'warn' && value !== 'delete') {
        return reply("❌ Please use: on, off, warn, or delete");
    }

    // Convert 'on' to 'true', 'off' to 'false', keep 'warn' and 'delete' as is
    let configValue;
    let responseMsg = "";
    
    if (value === "on") {
        configValue = "true";
        responseMsg = "✅ Anti-link set to ON\n\nUsers sending links will be warned and messages will be deleted.";
    } else if (value === "off") {
        configValue = "false";
        responseMsg = "✅ Anti-link set to OFF\n\nNo link protection active.";
    } else if (value === "warn") {
        configValue = "warn";
        responseMsg = "✅ Anti-link set to WARN\n\nUsers will receive warnings when sending links, but messages won't be deleted.";
    } else if (value === "delete") {
        configValue = "delete";
        responseMsg = "✅ Anti-link set to DELETE\n\nLink messages will be deleted without warning.";
    }

    userConfig.ANTI_LINK = configValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(responseMsg);
});

// ANTI DELETE COMMAND
// ===============================
cmd({
    pattern: "antidelete",
    alias: ["antidel", "delblock"],
    desc: "Toggle anti-delete message protection",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antidelete on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_DELETE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_DELETE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ Dᴇʟᴇᴛᴇ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will detect and notify when messages are deleted.`);
});

// ===============================
// RECORDING COMMAND
// ===============================
cmd({
    pattern: "recording",
    alias: ["autorecording"],
    desc: "Toggle auto recording presence",
    category: "settings",
    react: "🎙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autorecord on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_RECORDING}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_RECORDING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Rᴇᴄᴏʀᴅɪɴɢ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

// ===============================
// STATUS VIEW COMMAND
// ===============================
cmd({
    pattern: "statusview",
    alias: ["autoview"],
    desc: "Toggle auto view status",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoview on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_VIEW_STATUS}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_VIEW_STATUS = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Vɪᴇᴡ Sᴛᴀᴛᴜs sᴇᴛ ᴛᴏ:* ${newValue}`);
});

// ===============================
// AUTO REACT COMMAND
// ===============================
cmd({
    pattern: "autoreact",
    alias: ["autoreaction", "reactauto"],
    desc: "Toggle auto react to messages",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoreact on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_REACT}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Rᴇᴀᴄᴛ sᴇᴛ ᴛᴏ:* ${newValue}\n\nBot will ${newValue === 'true' ? 'now' : 'no longer'} automatically react to messages.`);
});

// ===============================
// ANTI CALL COMMAND
// ===============================
cmd({
    pattern: "anticall",
    alias: ["antcall", "callblock"],
    desc: "Toggle anti-call protection",
    category: "settings",
    react: "📵",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* anticall on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_CALL || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_CALL = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-Cᴀʟʟ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will automatically reject incoming calls and send a rejection message.`);
});

// ===============================
// ANTI CALL MESSAGE COMMAND
// ===============================
cmd({
    pattern: "anticallmsg",
    alias: ["callmsg", "rejectmsg"],
    desc: "Set custom anti-call rejection message",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentMsg = userConfig.REJECT_MSG || config.REJECT_MSG || "*📞 ᴄαℓℓ ɴσт αℓℓσωє∂ ιɴ тнιѕ ɴᴜмвєʀ уσυ ∂σɴт нανє ᴘєʀмιѕѕισɴ 📵*";
        return reply(`📌 *Cᴜʀʀᴇɴᴛ Rᴇᴊᴇᴄᴛ Mᴇssᴀɢᴇ:*\n${currentMsg}\n\n*Usᴀɢᴇ:* anticallmsg <your message>\n\nExᴀᴍᴘʟᴇ: anticallmsg Calls are not allowed on this number`);
    }

    const newMsg = args.join(' ');
    
    userConfig.REJECT_MSG = newMsg;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-Cᴀʟʟ Rᴇᴊᴇᴄᴛ Mᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n${newMsg}`);
});

// ===============================
// ADMIN ACTION COMMAND
// ===============================
cmd({
    pattern: "adminaction",
    alias: ["adminnotify"],
    desc: "Toggle admin action notifications",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* adminaction on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ADMIN_ACTION}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ADMIN_ACTION = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴅᴍɪɴ Aᴄᴛɪᴏɴ Nᴏᴛɪғɪᴄᴀᴛɪᴏɴs sᴇᴛ ᴛᴏ:* ${newValue}`);
});

// ===============================
// AUTO TYPING COMMAND
// ===============================
cmd({
    pattern: "autotyping",
    alias: ["typing"],
    desc: "Toggle auto typing in chats",
    category: "settings",
    react: "⌨️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autotyping on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_TYPING || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_TYPING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Tʏᴘɪɴɢ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will show typing indicator in chats.`);
});

// ===============================
// ONLINE COMMAND
// ===============================
cmd({
    pattern: "online",
    alias: ["alwaysonline", "alwayson"],
    desc: "Toggle always online status",
    category: "settings",
    react: "💚",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* online on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ALWAYS_ONLINE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ALWAYS_ONLINE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aʟᴡᴀʏs Oɴʟɪɴᴇ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will always show online status.`);
});

// ===============================
// MODE COMMAND
// ===============================
cmd({
    pattern: "mode",
    alias: ["mod"],
    desc: "Change bot mode (public/private/inbox)",
    category: "settings",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* mode public/private/inbox\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.MODE}`);
    }

    const mode = args[0].toLowerCase();
    if (!['public', 'private', 'inbox'].includes(mode)) {
        return reply('❌ *Aᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs:* public, private, inbox');
    }

    userConfig.MODE = mode;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    const modeDescriptions = {
        public: '📢 Commands work everywhere',
        private: '🔒 Only owner commands work',
        inbox: '💬 Commands work only in private chats'
    };
    
    await reply(`✅ *Bot mode set to:* ${mode}\n📝 *Description:* ${modeDescriptions[mode]}`);
});

// ===============================
// PREFIX COMMAND
// ===============================
cmd({
    pattern: "prefix",
    desc: "Change command prefix",
    category: "settings",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* prefix <new_prefix>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.PREFIX}`);
    }

    const newPrefix = args[0];
    if (newPrefix.length > 2) {
        return reply('❌ *Pʀᴇғɪx ᴍᴜsᴛ ʙᴇ 1-2 ᴄʜᴀʀᴀᴄᴛᴇʀs ᴍᴀx*');
    }

    userConfig.PREFIX = newPrefix;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Pʀᴇғɪx ᴄʜᴀɴɢᴇᴅ ᴛᴏ:* ${newPrefix}\n\n*Exᴀᴍᴘʟᴇ:* ${newPrefix}menu`);
});

// ===============================
// BOT NAME COMMAND
// ===============================
cmd({
    pattern: "botname",
    alias: ["name"],
    desc: "Change bot name",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* botname <new_name>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.BOT_NAME || config.BOT_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) {
        return reply('❌ *Bᴏᴛ ɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 30 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.BOT_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Bᴏᴛ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${newName}`);
});

// ===============================
// OWNER NAME COMMAND
// ===============================
cmd({
    pattern: "ownername",
    alias: ["owner"],
    desc: "Change owner name",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* ownername <new_name>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.OWNER_NAME || config.OWNER_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) {
        return reply('❌ *Oᴡɴᴇʀ ɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 30 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.OWNER_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Oᴡɴᴇʀ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${newName}`);
});

// ===============================
// OWNER NUMBER COMMAND
// ===============================
cmd({
    pattern: "ownernumber",
    alias: ["ownernum", "ownerphone"],
    desc: "Change owner number",
    category: "settings",
    react: "📞",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* ownernumber <new_number>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.OWNER_NUMBER || config.OWNER_NUMBER}`);
    }

    const newNumber = args[0];
    if (!newNumber.match(/^\d{10,15}$/)) {
        return reply('❌ *Pʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ (10-15 ᴅɪɢɪᴛs)*');
    }

    userConfig.OWNER_NUMBER = newNumber;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Oᴡɴᴇʀ ɴᴜᴍʙᴇʀ sᴇᴛ ᴛᴏ:* ${newNumber}`);
});

// ===============================
// DESCRIPTION COMMAND
// ===============================
cmd({
    pattern: "description",
    alias: ["desc", "about"],
    desc: "Change bot description",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* description <new_description>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.DESCRIPTION || config.DESCRIPTION}`);
    }

    const newDesc = args.join(' ');
    if (newDesc.length > 200) {
        return reply('❌ *Dᴇsᴄʀɪᴘᴛɪᴏɴ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 200 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.DESCRIPTION = newDesc;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Bᴏᴛ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ sᴇᴛ ᴛᴏ:* ${newDesc}`);
});

// ===============================
// STICKER NAME COMMAND
// ===============================
cmd({
    pattern: "stickername",
    alias: ["stickertext", "stname"],
    desc: "Set sticker pack name",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentName = userConfig.STICKER_NAME || 'Sticker Pack';
        return reply(`📌 *Usᴀɢᴇ:*.stickername Your Pack Name\n*Cᴜʀʀᴇɴᴛ:* ${currentName}`);
    }

    const stickerName = args.join(' ');
    
    userConfig.STICKER_NAME = stickerName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${stickerName}`);
});

// ===============================
// DELPATH COMMAND
// ===============================
cmd({
    pattern: "delpath",
    alias: ["deletepath", "antideletepath"],
    desc: "Set anti-delete path (same/inbox)",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:*.delpath same/inbox\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_DELETE_PATH || 'inbox'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'same' && value !== 'inbox') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* same ᴏʀ inbox\n- *same*: Delete from same chat\n- *inbox*: Delete only from inbox');
    }

    userConfig.ANTI_DELETE_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-ᴅᴇʟᴇᴛᴇ ᴘᴀᴛʜ sᴇᴛ ᴛᴏ:* ${value}`);
});

// ===============================
// REACT EMOJIS COMMAND
// ===============================
cmd({
    pattern: "reactemojis",
    alias: ["reacts", "reactset"],
    desc: "Set auto react emojis",
    category: "settings",
    react: "😍",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentEmojis = userConfig.REACT_EMOJIS || ['😍', '❤️', '🔥', '👏', '😮', '😢', '🤣', '👍', '🎉', '🤔', '🙏', '😊', '🥰', '💕', '🤩', '✨', '😎', '🥳', '🙌'];
        return reply(`📌 *Usᴀɢᴇ:*.reactemojis 😍,❤️,🔥,👏,😮\n*Cᴜʀʀᴇɴᴛ:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return reply('❌ *Invalid format! Please separate all emojis with commas*\n*Example:*.reactemojis 😍,❤️,🔥,👏,😮');
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    const invalidEntries = emojis.filter(emoji => {
        const hasMultipleEmojis = Array.from(emoji).some((c, i, arr) => {
            if (i === 0) return false;
            const prev = arr[i-1];
            const regex = /\p{Emoji}/u;
            return regex.test(c) && regex.test(prev) && c !== '\u200d' && prev !== '\u200d';
        });
        
        return hasMultipleEmojis;
    });
    
    if (invalidEntries.length > 0) {
        return reply('❌ *Invalid format! Don\'t use multiple emojis without commas*\n*Example:*.reactemojis 😍,❤️,🔥,👏,😮');
    }
    
    if (emojis.length === 0) {
        return reply('❌ *Please provide valid emojis*');
    }

    userConfig.REACT_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Auto react emojis set:*\n${emojis.join(', ')}`);
});

// ===============================
// OWNER EMOJIS COMMAND
// ===============================
cmd({
    pattern: "owneremojis",
    alias: ["owneremojiset", "ownerreacts"],
    desc: "Set owner emojis for reactions",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentEmojis = userConfig.OWNER_EMOJIS || ['👑', '⭐', '💎', '🌟', '✨', '⚡', '🔥', '❤️', '💕', '🎯'];
        return reply(`📌 *Usᴀɢᴇ:*.owneremojis 👑,⭐,💎,🌟,✨\n*Cᴜʀʀᴇɴᴛ:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return reply('❌ *Invalid format! Please separate all emojis with commas*\n*Example:*.owneremojis 👑,⭐,💎,🌟,✨');
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    const invalidEntries = emojis.filter(emoji => {
        const hasMultipleEmojis = Array.from(emoji).some((c, i, arr) => {
            if (i === 0) return false;
            const prev = arr[i-1];
            const regex = /\p{Emoji}/u;
            return regex.test(c) && regex.test(prev) && c !== '\u200d' && prev !== '\u200d';
        });
        
        return hasMultipleEmojis;
    });
    
    if (invalidEntries.length > 0) {
        return reply('❌ *Invalid format! Don\'t use multiple emojis without commas*\n*Example:*.owneremojis 👑,⭐,💎,🌟,✨');
    }
    
    if (emojis.length === 0) {
        return reply('❌ *Please provide valid emojis*');
    }

    userConfig.OWNER_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Owner emojis set:*\n${emojis.join(', ')}`);
});

// ===============================
// SETTINGS COMMAND
// ===============================
cmd({
    pattern: "settings",
    alias: ["setting", "env", "config"],
    desc: "Bot settings management - View all available setting commands",
    category: "settings",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, prefix, userConfig }) => {
    if (!isCreator) {
        return reply("*📛 This is an owner command.*");
    }
    
    const settingsText = `
┌─⧽ *${userConfig.BOT_NAME || config.BOT_NAME} Settings Menu* ⚙️
│
│ 📁 *General Settings*
│ • welcome on/off
│ • goodbye on/off
│ • setwelcome <message>
│ • setgoodbye <message>
│
│ 📁 *Anti Features*
│ • antiedit on/off
│ • editpath inbox/same
│ • antilink on/off/warn/delete
│ • antidelete on/off
│ • anticall on/off
│ • anticallmsg <message>
│
│ 📁 *Auto Features*
│ • autoread on/off
│ • recording on/off
│ • statusview on/off
│ • autoreact on/off
│ • autotyping on/off
│ • online on/off
│
│ 📁 *Settings*
│ • ban @user
│ • unban @user
│ • banlist
│ • sudo @user
│ • delsudo @user
│ • listsudo
│
│ 📁 *Bot Settings*
│ • mode public/private/inbox
│ • prefix <new_prefix>
│ • botname <name>
│ • ownername <name>
│ • ownernumber <number>
│ • description <text>
│ • botdp <url> or reply to image
│ • stickername <name>
│ • delpath same/inbox
│ • reactemojis 😍,❤️,🔥
│ • owneremojis 👑,⭐,💎
│
│ 📁 *Current Status*
│ • Welcome: ${userConfig.WELCOME || 'false'}
│ • Goodbye: ${userConfig.GOODBYE || 'false'}
│ • Anti-Edit: ${userConfig.ANTI_EDIT || 'false'}
│ • Anti-Link: ${userConfig.ANTI_LINK || 'off'}
│ • Anti-Delete: ${userConfig.ANTI_DELETE || 'false'}
│ • Anti-Call: ${userConfig.ANTI_CALL || 'false'}
│ • Auto-Read: ${userConfig.READ_MESSAGE || 'false'}
│ • Auto-React: ${userConfig.AUTO_REACT || 'false'}
│ • Auto-Typing: ${userConfig.AUTO_TYPING || 'false'}
│ • Always Online: ${userConfig.ALWAYS_ONLINE || 'false'}
│ • Mode: ${userConfig.MODE || 'public'}
│ • Prefix: ${userConfig.PREFIX || prefix}
│
│ 📌 *Tip:* Use .help <command> for more details
└──────────────────────────
    `;
    
    await reply(settingsText);
});

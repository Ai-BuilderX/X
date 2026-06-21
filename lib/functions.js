// lib/functions.js - ESM Version with Rate Limit Handling
import axios from 'axios';

export const getBuffer = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1,
            },
            ...options,
            responseType: 'arraybuffer',
        });
        return res.data;
    } catch (e) {
        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return null;
        console.error('[ ❌ ] getBuffer error:', e.message);
        return null;
    }
};

export const getGroupAdmins = (participants) => {
    var admins = []
    for (let i of participants) {
        i.admin !== null ? admins.push(i.id) : ''
    }
    return admins
}

export const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

export const h2k = (eco) => {
    const lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
    const ma = Math.log10(Math.abs(eco)) / 3 | 0;
    if (ma === 0) return eco;
    const ppo = lyrik[ma];
    const scale = Math.pow(10, ma * 3);
    const scaled = eco / scale;
    let formatt = scaled.toFixed(1);
    if (/\.0$/.test(formatt)) {
        formatt = formatt.substr(0, formatt.length - 2);
    }
    return formatt + ppo;
};

export const isUrl = (url) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
            'gi'
        )
    );
};

export const Json = (string) => {
    return JSON.stringify(string, null, 2);
};

export const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    
    return parts.join(' ');
};

export const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const fetchJson = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            },
            ...options,
        });
        return res.data;
    } catch (err) {
        if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) return null;
        console.error('[ ❌ ] fetchJson error:', err.message);
        return null;
    }
};

// ===== LID TO PHONE FUNCTIONS =====

/**
 * Convert Lid (Local ID) to Phone Number
 * @param {Object} conn - The WhatsApp connection object
 * @param {string} lid - The LID to convert
 * @returns {Promise<string>} - The phone number or original LID part
 */
export async function lidToPhone(conn, lid) {
    try {
        if (!lid) return '';
        
        // Check if it's actually a LID (contains @lid)
        if (lid.includes('@lid')) {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(lid);
            if (pn) {
                return cleanPN(pn);
            }
        }
        return lid.split("@")[0];
    } catch (e) {
        // Silent skip on rate limit
        if (e.message?.includes('rate-overlimit') || e.message?.includes('429')) return lid?.split("@")[0] || '';
        // If any other error, return the part before @
        return lid ? lid.split("@")[0] : '';
    }
}

/**
 * Clean phone number by removing : suffix
 * @param {string} pn - The phone number to clean
 * @returns {string} - Cleaned phone number
 */
export function cleanPN(pn) {
    if (!pn) return '';
    return pn.split(":")[0];
}

// Default export
export default { 
    getBuffer, 
    getGroupAdmins, 
    getRandom, 
    h2k, 
    isUrl, 
    Json, 
    runtime, 
    sleep,
    delay,
    fetchJson,
    lidToPhone,
    cleanPN
};

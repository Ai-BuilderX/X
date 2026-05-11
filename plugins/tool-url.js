
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';  // ✅ ADD THIS LINE

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  // Now path is defined

cmd({
  pattern: "url",
  alias: ["imgtourl", "imgurl", "tourl", "geturl", "upload"],
  react: '🖇',
  desc: "Convert media to Catbox URL (via Uguu)",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename
}, async (conn, mek, m, { from, reply, quoted, body, isCmd, command, args }) => {
  try {
    const quotedMsg = m.quoted || m;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType) {
      throw "Please reply to an image, video, audio, or other supported file";
    }

    const mediaBuffer = await quotedMsg.download();

    // Extension mapping
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else if (mimeType.includes('image/webp')) extension = '.webp';
    else if (mimeType.includes('video/mp4')) extension = '.mp4';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio/mpeg')) extension = '.mp3';
    else if (mimeType.includes('audio/mp4')) extension = '.m4a';
    else if (mimeType.includes('audio/x-m4a')) extension = '.m4a';
    else if (mimeType.includes('audio/ogg')) extension = '.opus';
    else if (mimeType.includes('audio/opus')) extension = '.opus';
    else if (mimeType.includes('audio')) extension = '.audio';
    else if (mimeType.includes('application/zip')) extension = '.zip';
    else if (mimeType.includes('application/pdf')) extension = '.pdf';
    else if (mimeType.includes('text/')) extension = '.txt';
    else extension = '.bin';
    
    const fileName = `file${extension}`;

    // STEP 1: Upload to Uguu
    const form = new FormData();
    form.append('files[]', mediaBuffer, fileName);

    const uguuResponse = await axios.post("https://uguu.se/upload", form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile)"
      },
      timeout: 60000
    });
    
    let uguuUrl = null;
    if (uguuResponse.data && uguuResponse.data.files && uguuResponse.data.files[0]) {
      uguuUrl = uguuResponse.data.files[0].url;
    }
    
    if (!uguuUrl) {
      throw "Uguu upload failed - no URL returned";
    }

    // STEP 2: Upload to Catbox via URL method
    const catboxForm = new FormData();
    catboxForm.append('reqtype', 'urlupload');
    catboxForm.append('userhash', '');
    catboxForm.append('url', uguuUrl);

    const catboxResponse = await axios.post("https://catbox.moe/user/api.php", catboxForm, {
      headers: catboxForm.getHeaders()
    });

    const catboxUrl = catboxResponse.data?.trim();
    
    if (!catboxUrl || !catboxUrl.startsWith('https://files.catbox.moe/')) {
      throw `Catbox rejected the URL. Response: ${catboxUrl || 'empty'}`;
    }

    const fileSize = formatBytes(mediaBuffer.length);
    
    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = '📷 Image';
    else if (mimeType.includes('video')) mediaType = '🎥 Video';
    else if (mimeType.includes('audio/ogg')) mediaType = '🎤 Voice Note';
    else if (mimeType.includes('audio')) mediaType = '🎵 Audio';
    else if (mimeType.includes('application/zip')) mediaType = '📦 Archive';

    await reply(
      `*${mediaType} Uploaded Successfully*\n\n` +
      `*Size:* ${fileSize}\n` +
      `*URL:* ${catboxUrl}\n\n` +
      `> © Uploaded by JawadTechX 💜`
    );

  } catch (error) {
    console.error(error);
    await reply(`❌ Error: ${error.message || error}`);
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

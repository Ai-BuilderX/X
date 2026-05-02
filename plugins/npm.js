// plugins/npm.js - ESM Version (Both Search & Download)
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===============================
// COMMAND 1: npm (Search Package)
// ===============================
cmd({
    pattern: "npm",
    desc: "Search for a package on npm.",
    react: '📦',
    category: "tools",
    filename: __filename,
    use: ".npm <package-name>"
}, async (conn, mek, msg, { from, args, reply }) => {
    try {
        // Check if a package name is provided
        if (!args.length) {
            return reply("Please provide the name of the npm package you want to search for. Example: .npm express");
        }

        const packageName = args.join(" ");
        const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

        // Fetch package details from npm registry
        const response = await axios.get(apiUrl);
        if (response.status !== 200) {
            throw new Error("Package not found or an error occurred.");
        }

        const packageData = response.data;
        const latestVersion = packageData["dist-tags"].latest;
        const description = packageData.description || "No description available.";
        const npmUrl = `https://www.npmjs.com/package/${packageName}`;
        const license = packageData.license || "Unknown";
        const repository = packageData.repository ? packageData.repository.url : "Not available";

        // Create the response message
        const message = `
*KHAN-MD NPM SEARCH*

*🔰 NPM PACKAGE:* ${packageName}
*📄 DESCRIPTION:* ${description}
*⏸️ LAST VERSION:* ${latestVersion}
*🪪 LICENSE:* ${license}
*🪩 REPOSITORY:* ${repository}
*🔗 NPM URL:* ${npmUrl}
`;

        // Send the message
        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);
        reply("An error occurred: " + error.message);
    }
});

// ===============================
// COMMAND 2: dlnpm (Download Package)
// ===============================
cmd({
    pattern: "dlnpm",
    desc: "Download npm package as tgz (supports scoped packages)",
    category: "download",
    react: "📦",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) {
            return reply(
                "❌ *Please provide a package name!*\n\n*Examples:*\n.dlnpm express\n.dlnpm @react-native/core\n.dlnpm lodash"
            );
        }

        const pkg = q.trim();
        const encodedPkg = encodeURIComponent(pkg);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Send processing reaction
        await react("⏳");

        // 1️⃣ Fetch package info (scoped-safe)
        const infoUrl = `https://registry.npmjs.org/${encodedPkg}`;
        const infoRes = await axios.get(infoUrl).catch(() => null);

        if (!infoRes || !infoRes.data) {
            await react("❌");
            return reply("❌ Package not found on npm registry!");
        }

        const data = infoRes.data;
        const latest = data['dist-tags'].latest;
        const tarballUrl = data.versions[latest].dist.tarball;

        // Safe filename (no / or @)
        const safeName = pkg.replace('@', '').replace('/', '-');
        const fileName = `${safeName}-${latest}.tgz`;
        const filePath = path.join(tempDir, fileName);

        // 2️⃣ Download tarball
        const tarballRes = await axios.get(tarballUrl, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(filePath, tarballRes.data);

        // 3️⃣ Send file
        await conn.sendMessage(
            from,
            {
                document: fs.readFileSync(filePath),
                mimetype: 'application/gzip',
                fileName: fileName,
                caption: `📦 *NPM Package Downloaded*

• *Name:* ${pkg}
• *Version:* ${latest}
• *Size:* ${(tarballRes.data.length / 1024).toFixed(2)} KB
• *Format:* .tgz

> *Powered By KHAN-MD 🤖*`
            },
            { quoted: mek }
        );

        // Clean up temp file
        fs.unlinkSync(filePath);
        
        // Success reaction
        await react("✅");

    } catch (err) {
        console.error("DLNPM Error:", err);
        await react("❌");
        reply("❌ Failed to download npm package!\n\n" + (err.message || "Unknown error"));
    }
});

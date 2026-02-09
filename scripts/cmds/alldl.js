const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fonts = require('../../func/font.js');

module.exports = {
  config: {
    name: "alldl",
    aliases: ["autodl"],
    version: "1.7.0",
    author: "Christus",
    role: 0,
    description: "Auto download media from any platform",
    category: "media",
    guide: { en: "Send any media link to download automatically" }
  },

  onStart: async function ({ message, threadsData, event, args }) {
    const header = `${fonts.square(" AUTO DOWNLOAD ")}\n${"━".repeat(12)}\n`;
    const status = args[0];
    
    if (!["on", "off"].includes(status))
      return message.reply(header + `• ${fonts.sansSerif("Use:")} ${fonts.monospace("autodl on/off")}`);

    const value = status === "on";
    const tData = (await threadsData.get(event.threadID, "data")) || {};
    tData.autodown_enabled = value;

    await threadsData.set(event.threadID, tData, "data");
    
    return message.send(header + (value 
      ? `✅ ${fonts.bold("Enabled:")} ${fonts.italic("Auto download is now active for this thread.")}` 
      : `❌ ${fonts.bold("Disabled:")} ${fonts.italic("Auto download has been turned off.")}`));
  },

  onChat: async function ({ event, message, threadsData }) {
    const data = (await threadsData.get(event.threadID, "data")) || {};
    const flag = data.autodown_enabled === undefined ? true : data.autodown_enabled;
    if (!flag) return;

    const urls = event.body?.match(/https?:\/\/[^\s]+/g);
    if (!urls) return;

    let success = false;

    try {
      await message.reaction("⏳", event.messageID);

      const apiUrl = (await axios.get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json")).data.api2;

      for (let url of urls) {
        let mediaData = null;
        const endpoints = [
          `${apiUrl}/alldlxx?url=${encodeURIComponent(url)}`,
          `${apiUrl}/alldl2?url=${encodeURIComponent(url)}`
        ];

        for (let endpoint of endpoints) {
          try {
            const res = await axios.get(endpoint);
            if (res.data) {
              mediaData = res.data;
              break;
            }
          } catch {}
        }

        if (!mediaData) continue;

        const platform = mediaData.p || detectPlatform(url);
        const mediaUrls = extractMediaUrls(mediaData);
        if (!mediaUrls.length) continue;

        for (let mediaUrl of mediaUrls) {
          try {
            const head = await axios.head(mediaUrl, {
              headers: { "User-Agent": "Mozilla/5.0" }
            }).catch(() => null);

            let size = head?.headers?.["content-length"] || 0;
            let mb = (size / (1024 * 1024)).toFixed(2);

            const wUrl = (await axios.get(`https://tinyurl.com/api-create.php?url=${mediaUrl}`)).data;

            if (size && size > 35 * 1024 * 1024) {
              await message.send(
                `❌ ${fonts.bold("Limit Exceeded:")}\n` +
                `${fonts.sansSerif("Size:")} ${fonts.monospace(mb + " MB")}\n` +
                `${fonts.italic("Manual download:")} ${wUrl}`
              );
              continue;
            }

            const response = await axios({
              url: mediaUrl,
              method: "GET",
              responseType: "stream",
              headers: { "User-Agent": "Mozilla/5.0" }
            });

            let type = response.headers["content-type"] || "";
            let ext = mime.extension(type) || "mp4";
            const allowed = ["mp4", "mp3", "wav", "png", "jpg", "jpeg", "gif", "webp"];
            if (!allowed.includes(ext)) ext = "mp4";

            let t = "Media";
            if (type.startsWith("video/")) t = "Video";
            else if (type.startsWith("audio/")) t = "Audio";
            else if (type.startsWith("image/gif")) t = "GIF";
            else if (type.startsWith("image/")) t = "Image";

            const filePath = path.join(__dirname, `n_${Date.now()}.${ext}`);
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            try {
              await message.send({
                body: `✅ ${fonts.bold("DOWNLOAD SUCCESS")}\n` +
                      `${"━".repeat(15)}\n` +
                      `${fonts.sansSerif("Type:")} ${fonts.fancy(t)}\n` +
                      `${fonts.sansSerif("Platform:")} ${fonts.bold(platform)}\n` +
                      `${fonts.sansSerif("Size:")} ${fonts.monospace(mb + " MB")}`,
                attachment: fs.createReadStream(filePath)
              });
              success = true;
            } catch {
              await message.send(
                `❌ ${fonts.bold("Upload Failed:")}\n` +
                `${fonts.sansSerif("Size:")} ${fonts.monospace(mb + " MB")}\n` +
                `${fonts.italic("Manual download:")} ${wUrl}`
              );
            }

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {
            const wUrl = (await axios.get(`https://tinyurl.com/api-create.php?url=${mediaUrl}`)).data;
            await message.send(`❌ ${fonts.bold("Error:")} ${fonts.italic("Could not fetch media. Manual link:")} ${wUrl}`);
          }
        }
      }
      await message.reaction(success ? "✅" : "❌", event.messageID);
    } catch {
      await message.reaction("❌", event.messageID);
    }
  }
};

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
  if (/tiktok\.com/i.test(url)) return "TikTok";
  if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/x\.com|twitter\.com/i.test(url)) return "Twitter/X";
  if (/threads\.net/i.test(url)) return "Threads";
  if (/pinterest\.com/i.test(url)) return "Pinterest";
  return "Unknown";
}

function extractMediaUrls(data) {
  if (!data) return [];
  if (data.url) return [data.url];
  if (data.urls && Array.isArray(data.urls)) return data.urls;
  if (data.media && Array.isArray(data.media)) return data.media.map(m => m.link).filter(Boolean);
  if (data.files && Array.isArray(data.files)) return data.files;
  return [];
                                                               }

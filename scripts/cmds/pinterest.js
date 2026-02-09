const axios = require("axios");
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const fonts = require('../../func/font.js');
const { getStreamFromURL } = global.utils;

async function generatePinterestCanvas(imageObjects, query, page, totalPages) {
  const canvasWidth = 800;
  const canvasHeight = 1600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('PINTEREST SEARCH', 20, 50);

  ctx.font = '18px Arial';
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText(`Query: "${query}" | Page ${page}/${totalPages}`, 20, 85);

  const numColumns = 3;
  const padding = 15;
  const columnWidth = (canvasWidth - (padding * (numColumns + 1))) / numColumns;
  const columnHeights = Array(numColumns).fill(110);

  const loadedPairs = await Promise.all(
    imageObjects.map(obj =>
      loadImage(obj.url)
        .then(img => ({ img, originalIndex: obj.originalIndex, url: obj.url }))
        .catch(() => null)
    )
  );

  const successful = loadedPairs.filter(x => x !== null);
  let displayNumber = 0;
  const displayedMap = [];

  for (let i = 0; i < successful.length; i++) {
    const { img, originalIndex } = successful[i];
    const minHeight = Math.min(...columnHeights);
    const columnIndex = columnHeights.indexOf(minHeight);

    const x = padding + columnIndex * (columnWidth + padding);
    const y = minHeight + padding;

    const scale = columnWidth / img.width;
    const scaledHeight = img.height * scale;

    ctx.drawImage(img, x, y, columnWidth, scaledHeight);

    displayNumber += 1;
    displayedMap.push(originalIndex);

    ctx.fillStyle = 'rgba(230, 0, 35, 0.9)'; // Pinterest Red
    ctx.fillRect(x, y, 50, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${displayNumber}`, x + 25, y + 15);

    columnHeights[columnIndex] += scaledHeight + padding;
  }

  const footerY = 1580;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Christus Search Engine • Page ${page} of ${totalPages}`, canvasWidth / 2, footerY);

  const outputPath = path.join(__dirname, 'cache', `pin_${Date.now()}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));

  return { outputPath, displayedMap };
}

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["Pinterest", "pin"],
    version: "2.3",
    author: "Christus",
    countDown: 10,
    role: 0,
    description: {
      en: "Search images on Pinterest with interactive canvas preview",
      vi: "Tìm kiếm hình ảnh trên Pinterest với bản xem trước canvas"
    },
    category: "Image",
    guide: {
      en: "   {pn} <query> [-count]\n   Example: {pn} anime wallpaper\n   Example: {pn} aesthetic -5 (Direct send)"
    }
  },

  onStart: async function({ args, message, event }) {
    const header = `${fonts.square(" PINTEREST ")}\n${"━".repeat(12)}\n`;
    let processingMessage = null;

    try {
      let count = null;
      const countArg = args.find(arg => /^-\d+$/.test(arg));
      if (countArg) {
        count = parseInt(countArg.slice(1), 10);
        args = args.filter(arg => arg !== countArg);
      }

      const query = args.join(" ").trim();
      if (!query) return message.reply(header + `⚠️ ${fonts.bold("Error:")} Please provide a search query.`);

      processingMessage = await message.reply(header + `🔍 ${fonts.italic(`Searching Pinterest for "${query}"...`)}`);

      const res = await axios.get(`https://egret-driving-cattle.ngrok-free.app/api/pin?query=${encodeURIComponent(query)}&num=90`);
      const allImageUrls = res.data.results || [];

      if (allImageUrls.length === 0) {
        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });
        return message.reply(header + `❌ ${fonts.bold("No Results:")} Could not find anything for ${fonts.fancy(query)}.`);
      }

      if (count) {
        const urls = allImageUrls.slice(0, count);
        const streams = await Promise.all(urls.map(url => getStreamFromURL(url).catch(() => null)));
        const validStreams = streams.filter(s => s);
        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });

        return message.reply({
          body: header + `✅ ${fonts.bold("Success:")} Sent ${fonts.monospace(validStreams.length)} images for ${fonts.fancy(query)}.`,
          attachment: validStreams
        });
      } else {
        const imagesPerPage = 21;
        const totalPages = Math.ceil(allImageUrls.length / imagesPerPage);
        const imagesForPage1 = allImageUrls.slice(0, imagesPerPage).map((url, idx) => ({ url, originalIndex: idx }));

        const { outputPath: canvasPath, displayedMap } = await generatePinterestCanvas(imagesForPage1, query, 1, totalPages);

        const sentMessage = await message.reply({
          body: header + 
                `✨ ${fonts.bold("Found:")} ${fonts.monospace(allImageUrls.length)} results.\n` +
                `📝 ${fonts.sansSerif("Reply with a #number to get the image.")}\n` +
                `⏭️ ${fonts.italic("Type 'next' for more results.")}`,
          attachment: fs.createReadStream(canvasPath)
        });

        fs.unlink(canvasPath, (err) => { if (err) console.error(err); });
        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });

        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          allImageUrls,
          query,
          imagesPerPage,
          currentPage: 1,
          totalPages,
          displayedMap,
          displayCount: displayedMap.length
        });
      }
    } catch (error) {
      if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });
      message.reply(header + `❌ ${fonts.bold("API Error:")} The server is currently unreachable.`);
    }
  },

  onReply: async function({ event, message, Reply }) {
    const header = `${fonts.square(" PINTEREST ")}\n${"━".repeat(12)}\n`;
    if (!Reply || event.senderID !== Reply.author) return;

    const { allImageUrls, query, imagesPerPage, currentPage, totalPages, displayedMap, displayCount } = Reply;
    const input = (event.body || "").trim().toLowerCase();

    try {
      if (input === 'next') {
        if (currentPage >= totalPages) return message.reply(header + `⚠️ ${fonts.italic("End of results reached.")}`);
        
        const nextPage = currentPage + 1;
        const startIndex = (nextPage - 1) * imagesPerPage;
        const imagesForNextPage = allImageUrls.slice(startIndex, startIndex + imagesPerPage).map((url, idx) => ({
          url,
          originalIndex: startIndex + idx
        }));

        const loadMsg = await message.reply(header + `⏳ ${fonts.italic(`Loading Page ${nextPage}...`)}`);
        const { outputPath: canvasPath, displayedMap: nextMap } = await generatePinterestCanvas(imagesForNextPage, query, nextPage, totalPages);

        const sentMessage = await message.reply({
          body: header + `📄 ${fonts.bold("Page:")} ${fonts.monospace(nextPage)}/${fonts.monospace(totalPages)}\n${fonts.sansSerif("Reply with a #number or 'next'.")}`,
          attachment: fs.createReadStream(canvasPath)
        });

        fs.unlink(canvasPath, (err) => { if (err) console.error(err); });
        await message.unsend(loadMsg.messageID).catch(() => { });

        global.GoatBot.onReply.set(sentMessage.messageID, {
          ...Reply,
          currentPage: nextPage,
          displayedMap: nextMap,
          displayCount: nextMap.length
        });
      } else {
        const number = parseInt(input, 10);
        if (!isNaN(number) && number > 0 && number <= displayCount) {
          const originalIndex = displayedMap[number - 1];
          const imageUrl = allImageUrls[originalIndex];
          const stream = await getStreamFromURL(imageUrl).catch(() => null);
          
          if (!stream) return message.reply(header + `❌ ${fonts.bold("Error:")} Failed to fetch image #${number}.`);
          
          return message.reply({
            body: header + `🖼️ ${fonts.bold("Image:")} #${fonts.monospace(number)}\n🔍 ${fonts.sansSerif("Query:")} ${fonts.fancy(query)}`,
            attachment: stream
          });
        } else {
          return message.reply(header + `💡 ${fonts.italic("Invalid choice. Please enter a number from the canvas or 'next'.")}`);
        }
      }
    } catch (error) {
      message.reply(header + `❌ ${fonts.bold("Process Error:")} Something went wrong.`);
    }
  }
};

const fs = require("fs-extra");
const fonts = require('../../func/font.js');
const { utils } = global;

module.exports = {
    config: {
        name: "prefix",
        version: "1.5",
        author: "Christus",
        countDown: 5,
        role: 0,
        description: {
            fr: "Changer le préfixe de commande du bot (Groupe ou Système)",
            en: "Change the bot's command prefix (Group or System)",
            vi: "Thay đổi prefix của bot (Nhóm hoặc Hệ thống)"
        },
        category: "config",
        guide: {
            en: "   {pn} <new prefix>: Change prefix for this group\n   {pn} <new prefix> -g: Change global prefix (Admins only)\n   {pn} reset: Back to default",
            fr: "   {pn} <nouveau>: Change le préfixe du groupe\n   {pn} <nouveau> -g: Change le préfixe global (Admin)\n   {pn} reset: Retour au préfixe par défaut"
        }
    },

    langs: {
        vi: {
            reset: `✅ ${fonts.bold("RESET:")} Prefix đã quay về mặc định: ${fonts.monospace("%1")}`,
            onlyAdmin: `❌ ${fonts.bold("TỪ CHỐI:")} Chỉ admin bot mới có quyền thay đổi prefix hệ thống.`,
            confirmGlobal: `⚠️ ${fonts.bold("XÁC NHẬN:")} Thả cảm xúc để thay đổi prefix TOÀN CẦU thành: ${fonts.monospace("%1")}`,
            confirmThisThread: `⏳ ${fonts.bold("XÁC NHẬN:")} Thả cảm xúc để thay đổi prefix NHÓM thành: ${fonts.monospace("%1")}`,
            successGlobal: `✨ ${fonts.bold("HỆ THỐNG:")} Prefix toàn cầu đã đổi thành: ${fonts.monospace("%1")}`,
            successThisThread: `✨ ${fonts.bold("NHÓM:")} Prefix của nhóm này đã đổi thành: ${fonts.monospace("%1")}`,
            myPrefix: `👋 ${fonts.sansSerif("Chào %1, đây là thông tin préfixe:")}\n${"━".repeat(15)}\n🌐 ${fonts.bold("Global:")} ${fonts.monospace("%2")}\n💬 ${fonts.bold("Nhóm này:")} ${fonts.monospace("%3")}\n${"━".repeat(15)}\n🤖 ${fonts.italic("Tôi là %4, rất vui được phục vụ!")}`
        },
        en: {
            reset: `✅ ${fonts.bold("RESET:")} Prefix restored to default: ${fonts.monospace("%1")}`,
            onlyAdmin: `❌ ${fonts.bold("DENIED:")} Only bot admins can change the global prefix.`,
            confirmGlobal: `⚠️ ${fonts.bold("CONFIRMATION:")} React to this message to set GLOBAL prefix to: ${fonts.monospace("%1")}`,
            confirmThisThread: `⏳ ${fonts.bold("CONFIRMATION:")} React to this message to set GROUP prefix to: ${fonts.monospace("%1")}`,
            successGlobal: `✨ ${fonts.bold("SYSTEM:")} Global prefix updated to: ${fonts.monospace("%1")}`,
            successThisThread: `✨ ${fonts.bold("GROUP:")} Thread prefix updated to: ${fonts.monospace("%1")}`,
            myPrefix: `👋 ${fonts.sansSerif("Hey %1, here is my prefix info:")}\n${"━".repeat(15)}\n🌐 ${fonts.bold("Global:")} ${fonts.monospace("%2")}\n💬 ${fonts.bold("This Chat:")} ${fonts.monospace("%3")}\n${"━".repeat(15)}\n🤖 ${fonts.italic("I am %4, at your service!")}`
        },
        fr: {
            reset: `✅ ${fonts.bold("RÉINITIALISÉ :")} Préfixe par défaut rétabli : ${fonts.monospace("%1")}`,
            onlyAdmin: `❌ ${fonts.bold("REFUSÉ :")} Seuls les admins bot peuvent changer le préfixe global.`,
            confirmGlobal: `⚠️ ${fonts.bold("CONFIRMATION :")} Réagissez pour changer le préfixe GLOBAL en : ${fonts.monospace("%1")}`,
            confirmThisThread: `⏳ ${fonts.bold("CONFIRMATION :")} Réagissez pour changer le préfixe du GROUPE en : ${fonts.monospace("%1")}`,
            successGlobal: `✨ ${fonts.bold("SYSTÈME :")} Préfixe global mis à jour : ${fonts.monospace("%1")}`,
            successThisThread: `✨ ${fonts.bold("GROUPE :")} Préfixe local mis à jour : ${fonts.monospace("%1")}`,
            myPrefix: `👋 ${fonts.sansSerif("Salut %1, voici mes préfixes :")}\n${"━".repeat(15)}\n🌐 ${fonts.bold("Global :")} ${fonts.monospace("%2")}\n💬 ${fonts.bold("Ce groupe :")} ${fonts.monospace("%3")}\n${"━".repeat(15)}\n🤖 ${fonts.italic("Je suis %4, prêt à vous aider !")}`
        }
    },

    onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
        const header = `${fonts.square(" PREFIX CONFIG ")}\n${"━".repeat(12)}\n`;

        if (!args[0]) return message.SyntaxError();

        if (args[0] === 'reset') {
            await threadsData.set(event.threadID, null, "data.prefix");
            return message.reply(header + getLang("reset", global.GoatBot.config.prefix));
        }

        const newPrefix = args[0];
        const formSet = { commandName, author: event.senderID, newPrefix };

        if (args[1] === "-g") {
            if (role < 2) return message.reply(header + getLang("onlyAdmin"));
            formSet.setGlobal = true;
        } else {
            formSet.setGlobal = false;
        }

        const msg = formSet.setGlobal ? getLang("confirmGlobal", newPrefix) : getLang("confirmThisThread", newPrefix);
        
        return message.reply(header + msg, (err, info) => {
            formSet.messageID = info.messageID;
            global.GoatBot.onReaction.set(info.messageID, formSet);
        });
    },

    onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
        const header = `${fonts.square(" PREFIX UPDATE ")}\n${"━".repeat(12)}\n`;
        const { author, newPrefix, setGlobal } = Reaction;
        if (event.userID !== author) return;

        if (setGlobal) {
            global.GoatBot.config.prefix = newPrefix;
            fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
            return message.reply(header + getLang("successGlobal", newPrefix));
        } else {
            await threadsData.set(event.threadID, newPrefix, "data.prefix");
            return message.reply(header + getLang("successThisThread", newPrefix));
        }
    },

    onChat: async function ({ event, message, getLang, usersData }) {
        if (event.body && event.body.toLowerCase() === "prefix") {
            return async () => {
                const userName = await usersData.getName(event.senderID);
                const botName = global.GoatBot.config.nickNameBot || "Bot";
                const globalPrefix = global.GoatBot.config.prefix;
                const threadPrefix = utils.getPrefix(event.threadID);
                
                return message.reply(getLang("myPrefix", userName, globalPrefix, threadPrefix, botName));
            };
        }
    }
};

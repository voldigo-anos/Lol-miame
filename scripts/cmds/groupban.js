const fonts = require('../../func/font.js');
const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "groupban",
        aliases: ["gban", "adminban"],
        version: "1.1.0",
        author: "Christus",
        countDown: 5,
        role: 1,
        description: {
            vi: "Cấm thành viên sử dụng bot trong nhóm này",
            en: "Ban member from using bot in this group"
        },
        category: "box chat",
        guide: {
            vi: "   {pn} [@tag|uid|link fb|reply] [<lý do cấm>]\n   {pn} unban [@tag|uid|link fb|reply]\n   {pn} list\n   {pn} check",
            en: "   {pn} [@tag|uid|fb link|reply] [<reason>]\n   {pn} unban [@tag|uid|fb link|reply]\n   {pn} list\n   {pn} check"
        }
    },

    langs: {
        vi: {
            notFoundTarget: `⚠️ ${fonts.bold("Lỗi:")} Vui lòng cung cấp đối tượng cần cấm (tag, uid, link hoặc reply).`,
            notFoundTargetUnban: `⚠️ ${fonts.bold("Lỗi:")} Vui lòng cung cấp đối tượng cần bỏ cấm.`,
            userNotBanned: `⚠️ ${fonts.sansSerif("Thông báo:")} Người dùng mang ID ${fonts.monospace("%1")} không bị cấm trong nhóm này.`,
            unbannedSuccess: `✅ ${fonts.bold("Thành công:")} Đã bỏ cấm ${fonts.fancy("%1")} sử dụng bot!`,
            cantSelfBan: `⚠️ ${fonts.bold("Lỗi:")} Bạn không thể tự cấm chính mình!`,
            cantBanAdmin: `❌ ${fonts.bold("Từ chối:")} Bạn không thể cấm quản trị viên nhóm!`,
            cantBanBotAdmin: `❌ ${fonts.bold("Từ chối:")} Bạn không thể cấm quản trị viên bot!`,
            existedBan: `❌ ${fonts.bold("Lỗi:")} Người này đã bị cấm từ trước.`,
            noReason: "Không có lý do",
            bannedSuccess: `✅ ${fonts.bold("Đã cấm:")} ${fonts.fancy("%1")} đã bị chặn sử dụng bot trong nhóm này.`,
            noName: "Người dùng Facebook",
            noData: `📑 ${fonts.italic("Hiện tại không có thành viên nào bị cấm trong nhóm này.")}`,
            listBanned: `📑 ${fonts.bold("DANH SÁCH BỊ CẤM")} (Trang %1/%2)\n${"━".repeat(15)}`,
            content: `📍 ${fonts.bold("%1")}. ${fonts.fancy("%2")}\n   ╰╼ ${fonts.monospace("%3")}\n   🔹 ${fonts.sansSerif("Lý do:")} %4\n   🔹 ${fonts.sansSerif("Thời gian:")} %5\n   🔹 ${fonts.sansSerif("Admin:")} %6\n\n`,
            checkBanned: `⚠️ ${fonts.bold("TRẠNG THÁI: BỊ CẤM")}\n${"━".repeat(15)}\n👤 ${fonts.fancy("%1")}\n🆔 ${fonts.monospace("%2")}\n📝 ${fonts.sansSerif("Lý do:")} %3\n⏰ ${fonts.sansSerif("Thời gian:")} %4\n👮 ${fonts.sansSerif("Bởi Admin:")} %5`,
            checkNotBanned: `✅ ${fonts.bold("TRẠNG THÁI: TỰ DO")}\n${"━".repeat(15)}\n${fonts.fancy("%1")} không có trong danh sách đen của nhóm.`,
            onlyInGroup: `❌ ${fonts.bold("Lỗi:")} Lệnh này chỉ có thể sử dụng trong nhóm!`
        },
        en: {
            notFoundTarget: `⚠️ ${fonts.bold("Error:")} Please tag, enter UID, link, or reply to someone to ban.`,
            notFoundTargetUnban: `⚠️ ${fonts.bold("Error:")} Please specify a user to unban.`,
            userNotBanned: `⚠️ ${fonts.sansSerif("Notice:")} UID ${fonts.monospace("%1")} is not currently banned.`,
            unbannedSuccess: `✅ ${fonts.bold("Success:")} Unbanned ${fonts.fancy("%1")} from using the bot!`,
            cantSelfBan: `⚠️ ${fonts.bold("Error:")} You cannot ban yourself!`,
            cantBanAdmin: `❌ ${fonts.bold("Denied:")} You cannot ban group administrators!`,
            cantBanBotAdmin: `❌ ${fonts.bold("Denied:")} You cannot ban bot administrators!`,
            existedBan: `❌ ${fonts.bold("Error:")} This user is already banned.`,
            noReason: "No specified reason",
            bannedSuccess: `✅ ${fonts.bold("Action:")} ${fonts.fancy("%1")} is now banned from using the bot in this group.`,
            noName: "Facebook User",
            noData: `📑 ${fonts.italic("No members are currently banned in this group.")}`,
            listBanned: `📑 ${fonts.bold("BAN LIST")} (Page %1/%2)\n${"━".repeat(15)}`,
            content: `📍 ${fonts.bold("%1")}. ${fonts.fancy("%2")}\n   ╰╼ ${fonts.monospace("%3")}\n   🔹 ${fonts.sansSerif("Reason:")} %4\n   🔹 ${fonts.sansSerif("Time:")} %5\n   🔹 ${fonts.sansSerif("By Admin:")} %6\n\n`,
            checkBanned: `⚠️ ${fonts.bold("STATUS: BANNED")}\n${"━".repeat(15)}\n👤 ${fonts.fancy("%1")}\n🆔 ${fonts.monospace("%2")}\n📝 ${fonts.sansSerif("Reason:")} %3\n⏰ ${fonts.sansSerif("Time:")} %4\n👮 ${fonts.sansSerif("By Admin:")} %5`,
            checkNotBanned: `✅ ${fonts.bold("STATUS: CLEAN")}\n${"━".repeat(15)}\n${fonts.fancy("%1")} is not banned in this group.`,
            onlyInGroup: `❌ ${fonts.bold("Error:")} This command only works in groups!`
        }
    },

    onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
        const header = `${fonts.square(" GROUP BAN ")}\n${"━".repeat(12)}\n`;
        const { members, adminIDs } = await threadsData.get(event.threadID);
        const { senderID } = event;

        if (!event.isGroup) return message.reply(header + getLang('onlyInGroup'));
        if (!adminIDs.includes(senderID)) return message.reply(header + `❌ ${fonts.bold("Access Denied:")} This command is for group admins only.`);

        const dataGroupBanned = await threadsData.get(event.threadID, 'data.groupBanned', []);

        if (args[0] == 'unban') {
            let target;
            if (!isNaN(args[1])) target = args[1];
            else if (args[1]?.startsWith('https')) target = await findUid(args[1]);
            else if (Object.keys(event.mentions || {}).length) target = Object.keys(event.mentions)[0];
            else if (event.messageReply?.senderID) target = event.messageReply.senderID;
            else return message.reply(header + getLang('notFoundTargetUnban'));

            const index = dataGroupBanned.findIndex(item => item.id == target);
            if (index == -1) return message.reply(header + getLang('userNotBanned', target));

            dataGroupBanned.splice(index, 1);
            await threadsData.set(event.threadID, dataGroupBanned, 'data.groupBanned');
            const userName = members[target]?.name || await usersData.getName(target) || getLang('noName');
            return message.reply(header + getLang('unbannedSuccess', userName));
        }

        if (args[0] == "check") {
            let checkTarget;
            if (!isNaN(args[1])) checkTarget = args[1];
            else if (args[1]?.startsWith('https')) checkTarget = await findUid(args[1]);
            else if (Object.keys(event.mentions || {}).length) checkTarget = Object.keys(event.mentions)[0];
            else if (event.messageReply?.senderID) checkTarget = event.messageReply.senderID;
            else return message.reply(header + getLang('notFoundTarget'));

            const banned = dataGroupBanned.find(item => item.id == checkTarget);
            const userName = members[checkTarget]?.name || await usersData.getName(checkTarget) || getLang('noName');
            if (banned) {
                const adminName = members[banned.adminID]?.name || await usersData.getName(banned.adminID) || getLang('noName');
                return message.reply(header + getLang('checkBanned', userName, checkTarget, banned.reason, banned.time, adminName));
            } else {
                return message.reply(header + getLang('checkNotBanned', userName));
            }
        }

        if (args[0] == 'list') {
            if (!dataGroupBanned.length) return message.reply(header + getLang('noData'));
            const limit = 15;
            const page = parseInt(args[1] || 1) || 1;
            const start = (page - 1) * limit;
            const end = page * limit;
            const data = dataGroupBanned.slice(start, end);
            let msg = '';
            let count = 0;
            for (const user of data) {
                count++;
                const name = members[user.id]?.name || await usersData.getName(user.id) || getLang('noName');
                const adminName = members[user.adminID]?.name || await usersData.getName(user.adminID) || getLang('noName');
                msg += getLang('content', start + count, name, user.id, user.reason, user.time, adminName);
            }
            return message.reply(header + getLang('listBanned', page, Math.ceil(dataGroupBanned.length / limit)) + '\n\n' + msg);
        }

        let target, reason;
        if (event.messageReply?.senderID) {
            target = event.messageReply.senderID;
            reason = args.join(' ');
        } else if (Object.keys(event.mentions || {}).length) {
            target = Object.keys(event.mentions)[0];
            reason = args.join(' ').replace(event.mentions[target], '').trim();
        } else if (!isNaN(args[0])) {
            target = args[0];
            reason = args.slice(1).join(' ');
        } else if (args[0]?.startsWith('https')) {
            target = await findUid(args[0]);
            reason = args.slice(1).join(' ');
        }

        if (!target) return message.reply(header + getLang('notFoundTarget'));
        if (target == senderID) return message.reply(header + getLang('cantSelfBan'));
        if (adminIDs.includes(target)) return message.reply(header + getLang('cantBanAdmin'));

        const botAdmins = global.GoatBot.config.adminBot || [];
        if (botAdmins.includes(target)) return message.reply(header + getLang('cantBanBotAdmin'));

        if (dataGroupBanned.some(item => item.id == target)) return message.reply(header + getLang('existedBan'));

        const name = members[target]?.name || (await usersData.getName(target)) || getLang('noName');
        const time = moment().tz(global.GoatBot.config.timeZone).format('HH:mm:ss DD/MM/YYYY');
        
        dataGroupBanned.push({ id: target, time, reason: reason || getLang('noReason'), adminID: senderID });
        await threadsData.set(event.threadID, dataGroupBanned, 'data.groupBanned');
        return message.reply(header + getLang('bannedSuccess', name));
    }
};

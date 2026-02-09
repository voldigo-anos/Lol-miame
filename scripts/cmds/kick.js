const fonts = require('../../func/font.js');

module.exports = {
	config: {
		name: "kick",
		version: "1.4",
		author: "Christus",
		countDown: 5,
		role: 1,
		description: {
			vi: "Kick thành viên khỏi box chat",
			en: "Kick member out of chat box"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} @tags: dùng để kick những người được tag hoặc reply tin nhắn",
			en: "   {pn} @tags: use to kick members who are tagged or reply to their message"
		}
	},

	langs: {
		vi: {
			needAdmin: `❌ ${fonts.bold("Lỗi hệ thống:")} Bot cần quyền quản trị viên nhóm để thực hiện lệnh này.`,
			kicking: `🛠️ ${fonts.bold("Hành động:")} Đang tiến hành trục xuất thành viên...`
		},
		en: {
			needAdmin: `❌ ${fonts.bold("System Error:")} Bot needs group administrator privileges to execute this.`,
			kicking: `🛠️ ${fonts.bold("Action:")} Proceeding to remove members...`
		}
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const header = `${fonts.square(" KICK MEMBER ")}\n${"━".repeat(12)}\n`;
		const adminIDs = await threadsData.get(event.threadID, "adminIDs");
		
		if (!adminIDs.includes(api.getCurrentUserID())) {
			return message.reply(header + getLang("needAdmin"));
		}

		async function kickAndCheckError(uid) {
			try {
				await api.removeUserFromGroup(uid, event.threadID);
				return "SUCCESS";
			}
			catch (e) {
				return "ERROR";
			}
		}

		if (!args[0]) {
			if (!event.messageReply) return message.SyntaxError();
			
			const res = await kickAndCheckError(event.messageReply.senderID);
			if (res === "ERROR") return message.reply(header + getLang("needAdmin"));
		}
		else {
			const uids = Object.keys(event.mentions);
			if (uids.length === 0) return message.SyntaxError();

			let successCount = 0;
			let failCount = 0;

			for (const uid of uids) {
				const res = await kickAndCheckError(uid);
				if (res === "SUCCESS") successCount++;
				else failCount++;
			}

			if (successCount > 0) {
				return message.reply(header + `✅ ${fonts.bold("Thành công:")} Đã trục xuất ${fonts.monospace(successCount)} thành viên.`);
			} else if (failCount > 0) {
				return message.reply(header + getLang("needAdmin"));
			}
		}
	}
};

const fonts = require('../../func/font.js');

module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "1.4",
		author: "Christus",
		countDown: 5,
		role: 1,
		description: {
			vi: "bật/tắt chế độ chỉ quản trị của viên nhóm mới có thể sử dụng bot",
			en: "turn on/off only admin box can use bot"
		},
		category: "box chat",
		guide: {
			vi: `   {pn} [on | off]: bật/tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot`,
			en: `   {pn} [on | off]: turn on/off the mode only admin of group can use bot\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot`
		}
	},

	langs: {
		vi: {
			turnedOn: `✅ ${fonts.bold("Thành công:")} Đã bật chế độ ${fonts.italic("chỉ quản trị viên")} mới có thể sử dụng bot`,
			turnedOff: `✅ ${fonts.bold("Thành công:")} Đã tắt chế độ ${fonts.italic("chỉ quản trị viên")}. Tất cả thành viên đều có thể dùng bot`,
			turnedOnNoti: `🔔 ${fonts.bold("Thông báo:")} Đã bật thông báo khi người không phải admin dùng bot`,
			turnedOffNoti: `🔕 ${fonts.bold("Thông báo:")} Đã tắt thông báo khi người không phải admin dùng bot`,
			syntaxError: `❌ ${fonts.bold("Lỗi cú pháp:")} Vui lòng sử dụng {pn} on hoặc {pn} off`
		},
		en: {
			turnedOn: `✅ ${fonts.bold("SUCCESS:")} Turned on ${fonts.italic("Admin Only")} mode for this group`,
			turnedOff: `✅ ${fonts.bold("SUCCESS:")} Turned off ${fonts.italic("Admin Only")} mode`,
			turnedOnNoti: `🔔 ${fonts.bold("NOTIFICATION:")} Enabled alerts for non-admin users`,
			turnedOffNoti: `🔕 ${fonts.bold("NOTIFICATION:")} Disabled alerts for non-admin users`,
			syntaxError: `❌ ${fonts.bold("SYNTAX ERROR:")} Please use {pn} on or {pn} off`
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		const header = `${fonts.square(" ADMIN BOX ")}\n${"━".repeat(12)}\n`;
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(header + getLang("syntaxError"));

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		let replyMsg = header;
		if (isSetNoti)
			replyMsg += value ? getLang("turnedOnNoti") : getLang("turnedOffNoti");
		else
			replyMsg += value ? getLang("turnedOn") : getLang("turnedOff");

		return message.reply(replyMsg);
	}
};

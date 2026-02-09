const fs = require("fs-extra");
const fonts = require('../../func/font.js');
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
	config: {
		name: "adminonly",
		aliases: ["adonly", "onlyad", "onlyadmin"],
		version: "1.6",
		author: "Christus",
		countDown: 5,
		role: 2,
		description: {
			vi: "bật/tắt chế độ chỉ admin mới có thể sử dụng bot",
			en: "turn on/off only admin can use bot"
		},
		category: "owner",
		guide: {
			vi: "   {pn} [on | off]: bật/tắt chế độ chỉ admin mới có thể sử dụng bot\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là admin sử dụng bot",
			en: "   {pn} [on | off]: turn on/off the mode only admin can use bot\n   {pn} noti [on | off]: turn on/off the notification when user is not admin use bot"
		}
	},

	langs: {
		vi: {
			turnedOn: `✅ ${fonts.bold("Thành công:")} Đã bật chế độ ${fonts.italic("chỉ Admin tổng")} mới có thể sử dụng bot toàn cầu`,
			turnedOff: `✅ ${fonts.bold("Thành công:")} Đã tắt chế độ ${fonts.italic("chỉ Admin tổng")}. Tất cả người dùng đều có thể sử dụng`,
			turnedOnNoti: `🔔 ${fonts.bold("Thông báo:")} Đã bật cảnh báo khi người lạ dùng bot`,
			turnedOffNoti: `🔕 ${fonts.bold("Thông báo:")} Đã tắt cảnh báo khi người lạ dùng bot`
		},
		en: {
			turnedOn: `✅ ${fonts.bold("SUCCESS:")} ${fonts.italic("Global Admin Only")} mode has been enabled`,
			turnedOff: `✅ ${fonts.bold("SUCCESS:")} ${fonts.italic("Global Admin Only")} mode has been disabled`,
			turnedOnNoti: `🔔 ${fonts.bold("NOTIFICATION:")} Alerts for non-admin users enabled`,
			turnedOffNoti: `🔕 ${fonts.bold("NOTIFICATION:")} Alerts for non-admin users disabled`
		}
	},

	onStart: function ({ args, message, getLang }) {
		const header = `${fonts.square(" GLOBAL ADMIN ONLY ")}\n${"━".repeat(12)}\n`;
		let isSetNoti = false;
		let value;
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.SyntaxError();

		let replyMsg = header;
		if (isSetNoti) {
			config.hideNotiMessage.adminOnly = !value;
			replyMsg += getLang(value ? "turnedOnNoti" : "turnedOffNoti");
		}
		else {
			config.adminOnly.enable = value;
			replyMsg += getLang(value ? "turnedOn" : "turnedOff");
		}

		fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
		return message.reply(replyMsg);
	}
};

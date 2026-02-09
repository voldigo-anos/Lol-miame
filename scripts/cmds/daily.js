const moment = require("moment-timezone");
const fonts = require('../../func/font.js');

module.exports = {
	config: {
		name: "daily",
		version: "1.3",
		author: "Christus",
		countDown: 5,
		role: 0,
		description: {
			vi: "Nhận quà hàng ngày",
			en: "Receive daily gift"
		},
		category: "game",
		guide: {
			vi: "   {pn}: Nhận quà hàng ngày\n   {pn} info: Xem thông tin quà hàng ngày",
			en: "   {pn}\n   {pn} info: View daily gift information"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 1000,
				exp: 100
			}
		}
	},

	langs: {
		vi: {
			monday: "Thứ 2",
			tuesday: "Thứ 3",
			wednesday: "Thứ 4",
			thursday: "Thứ 5",
			friday: "Thứ 6",
			saturday: "Thứ 7",
			sunday: "Chủ nhật",
			alreadyReceived: `❌ ${fonts.bold("Thất bại:")} Bạn đã nhận quà của ngày hôm nay rồi.`,
			received: `✅ ${fonts.bold("Thành công:")} Bạn đã nhận được ${fonts.monospace("%1")} coin và ${fonts.monospace("%2")} exp!`
		},
		en: {
			monday: "Monday",
			tuesday: "Tuesday",
			wednesday: "Wednesday",
			thursday: "Thursday",
			friday: "Friday",
			saturday: "Saturday",
			sunday: "Sunday",
			alreadyReceived: `❌ ${fonts.bold("FAILED:")} You have already claimed your daily reward today.`,
			received: `✅ ${fonts.bold("SUCCESS:")} You claimed ${fonts.monospace("%1")} coins and ${fonts.monospace("%2")} exp!`
		}
	},

	onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
		const header = `${fonts.square(" DAILY REWARD ")}\n${"━".repeat(12)}\n`;
		const reward = envCommands[commandName].rewardFirstDay;

		if (args[0] == "info") {
			let msg = header + `${fonts.italic("Reward list for the week:")}\n\n`;
			for (let i = 1; i < 8; i++) {
				const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const day = i == 7 ? getLang("sunday") :
					i == 6 ? getLang("saturday") :
						i == 5 ? getLang("friday") :
							i == 4 ? getLang("thursday") :
								i == 3 ? getLang("wednesday") :
									i == 2 ? getLang("tuesday") :
										getLang("monday");
				msg += `• ${fonts.bold(day)}: ${fonts.monospace(getCoin)} $ | ${fonts.monospace(getExp)} exp\n`;
			}
			return message.reply(msg);
		}

		const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
		const date = new Date();
		const currentDay = date.getDay();
		const { senderID } = event;

		const userData = await usersData.get(senderID);
		if (userData.data.lastTimeGetReward === dateTime)
			return message.reply(header + getLang("alreadyReceived"));

		const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		
		userData.data.lastTimeGetReward = dateTime;
		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: userData.data
		});

		return message.reply(header + getLang("received", getCoin.toLocaleString(), getExp.toLocaleString()));
	}
};

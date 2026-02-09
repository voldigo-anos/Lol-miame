const fonts = require('../../func/font.js'); // Import de ton module de polices
const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "callad",
		version: "1.8", // Version mise à jour
		author: "Christus",
		countDown: 5,
		role: 0,
		description: {
			vi: "gửi báo cáo, góp ý, báo lỗi,... của bạn về admin bot",
			en: "send report, feedback, bug,... to admin bot"
		},
		category: "contacts admin",
		guide: {
			en: "   {pn} <message>"
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về admin",
			sendByGroup: `\n- ${fonts.sansSerif("Được gửi từ nhóm:")} %1\n- ${fonts.sansSerif("Thread ID:")} %2`,
			sendByUser: `\n- ${fonts.sansSerif("Được gửi từ người dùng")}`,
			content: `\n\n${fonts.bold("Nội dung:")}\n─────────────────\n%1\n─────────────────\n${fonts.italic("Phản hồi tin nhắn này để gửi tin nhắn về người dùng")}`,
			success: `Đã gửi tin nhắn của bạn về %1 admin thành công!\n%2`,
			failed: `❌ Có lỗi xảy ra khi gửi tin nhắn của bạn về %1 admin\n%2`,
			reply: `📍 ${fonts.bold("Phản hồi từ admin")} %1:\n─────────────────\n%2\n─────────────────\n${fonts.italic("Phản hồi tin nhắn này để tiếp tục gửi tin nhắn về admin")}`,
			replySuccess: "✅ Đã gửi phản hồi của bạn về admin thành công!",
			feedback: `📝 ${fonts.bold("Phản hồi từ người dùng")} %1:\n- ${fonts.sansSerif("User ID:")} %2%3\n\n${fonts.bold("Nội dung:")}\n─────────────────\n%4\n─────────────────\n${fonts.italic("Phản hồi tin nhắn này để gửi tin nhắn về người dùng")}`,
			replyUserSuccess: "✅ Đã gửi phản hồi của bạn về người dùng thành công!",
			noAdmin: "Bot has no admin at the moment"
		},
		en: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về admin",
			sendByGroup: `\n- ${fonts.sansSerif("Sent from group:")} %1\n- ${fonts.sansSerif("Thread ID:")} %2`,
			sendByUser: `\n- ${fonts.sansSerif("Sent from user")}`,
			content: `\n\n${fonts.bold("CONTENT:")}\n─────────────────\n%1\n─────────────────\n${fonts.italic("Reply this message to send message to user")}`,
			success: `Sent your message to %1 admin successfully!\n%2`,
			failed: `❌ An error occurred while sending your message to %1 admin\n%2`,
			reply: `📍 ${fonts.bold("REPLY FROM ADMIN")} %1:\n─────────────────\n%2\n─────────────────\n${fonts.italic("Reply this message to continue sending message to admin")}`,
			replySuccess: "✅ Sent your reply to admin successfully!",
			feedback: `📝 ${fonts.bold("FEEDBACK FROM")} %1:\n- ${fonts.sansSerif("User ID:")} %2%3\n\n${fonts.bold("CONTENT:")}\n─────────────────\n%4\n─────────────────\n${fonts.italic("Reply this message to send message to user")}`,
			replyUserSuccess: "✅ Sent your reply to user successfully!",
			noAdmin: "Bot has no admin at the moment"
		}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		const { config } = global.GoatBot;
		if (!args[0])
			return message.reply(getLang("missingMessage"));
		
		const { senderID, threadID, isGroup } = event;
		if (config.adminBot.length == 0)
			return message.reply(getLang("noAdmin"));

		const senderName = await usersData.getName(senderID);
		
		// Utilisation de fonts.bold et fonts.monospace pour l'en-tête
		const header = `${fonts.square(" CALL ADMIN ")}`;
		const msg = `${header}\n`
			+ `- ${fonts.sansSerif("User Name:")} ${fonts.fancy(senderName)}\n`
			+ `- ${fonts.sansSerif("User ID:")} ${fonts.monospace(senderID)}`
			+ (isGroup ? getLang("sendByGroup", (await threadsData.get(threadID)).threadName, threadID) : getLang("sendByUser"));

		const formMessage = {
			body: msg + getLang("content", args.join(" ")),
			mentions: [{ id: senderID, tag: senderName }],
			attachment: await getStreamsFromAttachment(
				[...event.attachments, ...(event.messageReply?.attachments || [])]
					.filter(item => mediaTypes.includes(item.type))
			)
		};

		const successIDs = [];
		const failedIDs = [];
		const adminNames = await Promise.all(config.adminBot.map(async item => ({
			id: item,
			name: await usersData.getName(item)
		})));

		for (const uid of config.adminBot) {
			try {
				const messageSend = await api.sendMessage(formMessage, uid);
				successIDs.push(uid);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID,
					messageIDSender: event.messageID,
					type: "userCallAdmin"
				});
			} catch (err) {
				failedIDs.push({ adminID: uid, error: err });
			}
		}

		let msgResponse = "";
		if (successIDs.length > 0)
			msgResponse += getLang("success", successIDs.length,
				adminNames.filter(item => successIDs.includes(item.id)).map(item => ` • ${fonts.bold(item.name)} (${item.id})`).join("\n")
			);
		
		return message.reply({
			body: msgResponse,
			mentions: adminNames.map(item => ({ id: item.id, tag: item.name }))
		});
	},

	onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const { isGroup } = event;

		switch (type) {
			case "userCallAdmin": {
				const formMessage = {
					body: getLang("reply", fonts.fancy(senderName), args.join(" ")),
					mentions: [{ id: event.senderID, tag: senderName }],
					attachment: await getStreamsFromAttachment(
						event.attachments.filter(item => mediaTypes.includes(item.type))
					)
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err) return message.err(err);
					message.reply(getLang("replyUserSuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID: event.threadID,
						type: "adminReply"
					});
				}, messageIDSender);
				break;
			}
			case "adminReply": {
				let sendByGroup = "";
				if (isGroup) {
					const thread = await api.getThreadInfo(event.threadID);
					sendByGroup = getLang("sendByGroup", thread.threadName, event.threadID);
				}
				const formMessage = {
					body: getLang("feedback", fonts.fancy(senderName), fonts.monospace(event.senderID), sendByGroup, args.join(" ")),
					mentions: [{ id: event.senderID, tag: senderName }],
					attachment: await getStreamsFromAttachment(
						event.attachments.filter(item => mediaTypes.includes(item.type))
					)
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err) return message.err(err);
					message.reply(getLang("replySuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID: event.threadID,
						type: "userCallAdmin"
					});
				}, messageIDSender);
				break;
			}
		}
	}
};

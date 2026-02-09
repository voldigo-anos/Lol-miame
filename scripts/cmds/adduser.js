const fonts = require('../../func/font.js');
const { findUid } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {}
		name: "adduser",
		version: "1.6",
		author: "Christus",
		countDown: 5,
		role: 1,
		description: {
			vi: "Thêm thành viên vào box chat của bạn",
			en: "Add user to box chat of you"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [link profile | uid]"
		}
	},

	langs: {
		vi: {
			alreadyInGroup: "Đã có trong nhóm",
			successAdd: `✅ ${fonts.bold("Thành công:")} Đã thêm %1 thành viên vào nhóm`,
			failedAdd: `❌ ${fonts.bold("Thất bại:")} Không thể thêm %1 thành viên`,
			approve: `⏳ ${fonts.bold("Phê duyệt:")} Đã thêm %1 thành viên vào danh sách chờ`,
			invalidLink: "Link Facebook không hợp lệ",
			cannotGetUid: "Không thể lấy UID",
			linkNotExist: "Profile không tồn tại",
			cannotAddUser: "Bot bị chặn hoặc user chặn người lạ"
		},
		en: {
			alreadyInGroup: "Already in group",
			successAdd: `✅ ${fonts.bold("SUCCESS:")} Added %1 members to the group`,
			failedAdd: `❌ ${fonts.bold("FAILED:")} Could not add %1 members`,
			approve: `⏳ ${fonts.bold("APPROVAL:")} Added %1 members to waitlist`,
			invalidLink: "Invalid Facebook link",
			cannotGetUid: "Cannot get UID",
			linkNotExist: "Profile does not exist",
			cannotAddUser: "Bot blocked or user privacy settings"
		}
	},

	onStart: async function ({ message, api, event, args, threadsData, getLang }) {
		const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
		const botID = api.getCurrentUserID();

		const header = `${fonts.square(" ADD USER ")}\n${"━".repeat(12)}\n`;

		const success = [
			{ type: "success", uids: [] },
			{ type: "waitApproval", uids: [] }
		];
		const failed = [];

		function checkErrorAndPush(messageError, item) {
			item = item.replace(/(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)/i, '');
			const findType = failed.find(error => error.type == messageError);
			if (findType)
				findType.uids.push(item);
			else
				failed.push({
					type: messageError,
					uids: [item]
				});
		}

		const regExMatchFB = /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-\.]+)(?:\/)?/i;
		
		for (const item of args) {
			let uid;
			let continueLoop = false;

			if (isNaN(item) && regExMatchFB.test(item)) {
				for (let i = 0; i < 10; i++) {
					try {
						uid = await findUid(item);
						break;
					}
					catch (err) {
						if (err.name == "SlowDown" || err.name == "CannotGetData") {
							await sleep(1000);
							continue;
						}
						else if (i == 9 || (err.name != "SlowDown" && err.name != "CannotGetData")) {
							checkErrorAndPush(
								err.name == "InvalidLink" ? getLang('invalidLink') :
									err.name == "CannotGetData" ? getLang('cannotGetUid') :
										err.name == "LinkNotExist" ? getLang('linkNotExist') :
											err.message,
								item
							);
							continueLoop = true;
							break;
						}
					}
				}
			}
			else if (!isNaN(item))
				uid = item;
			else
				continue;

			if (continueLoop == true) continue;

			if (members.some(m => m.userID == uid && m.inGroup)) {
				checkErrorAndPush(getLang("alreadyInGroup"), item);
			}
			else {
				try {
					await api.addUserToGroup(uid, event.threadID);
					if (approvalMode === true && !adminIDs.includes(botID))
						success[1].uids.push(uid);
					else
						success[0].uids.push(uid);
				}
				catch (err) {
					checkErrorAndPush(getLang("cannotAddUser"), item);
				}
			}
		}

		const lengthUserSuccess = success[0].uids.length;
		const lengthUserWaitApproval = success[1].uids.length;
		
		let msg = header;
		
		if (lengthUserSuccess)
			msg += `${getLang("successAdd", fonts.bold(lengthUserSuccess))}\n`;
		
		if (lengthUserWaitApproval)
			msg += `${getLang("approve", fonts.bold(lengthUserWaitApproval))}\n`;
		
		if (failed.length > 0) {
			const totalFailed = failed.reduce((a, b) => a + b.uids.length, 0);
			msg += `\n${getLang("failedAdd", fonts.bold(totalFailed))}`;
			
			failed.forEach(error => {
				msg += `\n${fonts.sansSerif(" ⚠︎ " + error.type)}: ${fonts.monospace(error.uids.join(', '))}`;
			});
		}

		if (!lengthUserSuccess && !lengthUserWaitApproval && failed.length === 0) return;

		await message.reply(msg);
	}
	};;

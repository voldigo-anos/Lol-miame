const fonts = require('../../func/fonts.js');

module.exports = {
    config: {
        name: "autoban",
        aliases: ["ab", "autobanning"],
        version: "1.0.0",
        author: "Aryan Chauhan",
        countDown: 5,
        role: 2,
        description: {
            vi: "Quản lý hệ thống auto-ban cho command spam",
            en: "Manage auto-ban system for command spam"
        },
        category: "owner",
        guide: {
            vi: "{pn} stats - Xem thống kê hệ thống\n{pn} user <uid> - Xem thông tin ban của user\n{pn} unban <uid> [reset] - Unban user (thêm reset để xóa lịch sử)\n{pn} config - Xem cấu hình hiện tại",
            en: "{pn} stats - View system statistics\n{pn} user <uid> - View user ban information\n{pn} unban <uid> [reset] - Unban user (add reset to clear history)\n{pn} config - View current configuration"
        }
    },

    onStart: async function ({ args, message, event, usersData, getLang }) {
        const { senderID } = event;
        const subCommand = args[0];

        // Initialize autoBanHandler with usersData
        autoBanHandler.initialize(usersData);

        if (!subCommand) {
            return message.reply(`📋 AUTOBAN SYSTEM COMMANDS:\n\n` +
                `• ${this.config.name} stats - View system statistics\n` +
                `• ${this.config.name} user <uid> - View user ban info\n` +
                `• ${this.config.name} unban <uid> [reset] - Unban user\n` +
                `• ${this.config.name} config - View configuration\n` +
                `• ${this.config.name} list - List banned users`);
        }

        switch (subCommand.toLowerCase()) {
            case "stats": {
                const stats = autoBanHandler.getSystemStats();
                const statsMessage = 
                    `📊 AUTOBAN SYSTEM STATISTICS\n` +
                    `━━━━━━━━━━━━━━\n` +
                    `👥 Total Tracked Users: ${stats.totalUsers}\n` +
                    `⚡ Active Users: ${stats.activeUsers}\n` +
                    `🚫 Total Bans Issued: ${stats.totalBannedUsers}\n` +
                    `⚙️ Command Limit: ${stats.commandLimit}/minute\n` +
                    `⏱️ Time Window: ${stats.timeWindow/1000}s`;

                return message.reply(statsMessage);
            }

            case "config": {
                const configMessage = 
                    "⚙️ AUTOBAN CONFIGURATION\n" +
                    "━━━━━━━━━━━━━━\n" +
                    "📊 Command Limit: 10 commands per minute\n" +
                    "⏱️ Time Window: 60 seconds\n" +
                    "⚠️ Warning Threshold: 8 commands\n" +
                    "\n🔄 PROGRESSIVE BAN DURATIONS:\n" +
                    "1st Offense: 1 hour\n" +
                    "2nd Offense: 2 hours\n" +
                    "3rd Offense: 3 hours\n" +
                    "4th Offense: 1 day\n" +
                    "5th+ Offense: Permanent ban\n" +
                    "\n🎯 Auto-unban: Enabled for temporary bans";

                return message.reply(configMessage);
            }

            case "user": {
                const uid = args[1];
                if (!uid) {
                    return message.reply("❌ Please provide a user ID.");
                }

                try {
                    const banStatus = await autoBanHandler.isUserBanned(uid, usersData);
                    const banStats = await autoBanHandler.getBanStats(uid);
                    const userName = await usersData.getName(uid) || "Unknown User";

                    let userInfo = 
                        `👤 USER BAN INFORMATION\n` +
                        `━━━━━━━━━━━━━━\n` +
                        `Name: ${userName}\n` +
                        `ID: ${uid}\n` +
                        `Status: ${banStatus.banned ? '🚫 BANNED' : '✅ ACTIVE'}\n`;

                    if (banStatus.banned) {
                        userInfo += `Reason: ${banStatus.reason}\n`;
                        userInfo += `Type: ${banStatus.type}\n`;
                        if (banStatus.timeLeft > 0) {
                            userInfo += `Time Left: ${autoBanHandler.formatDuration(banStatus.timeLeft)}\n`;
                        } else if (banStatus.timeLeft === -1) {
                            userInfo += `Duration: Permanent\n`;
                        }
                    }

                    userInfo += 
                        `\n📈 STATISTICS:\n` +
                        `Total Bans: ${banStats.totalBans}\n` +
                        `Current Commands: ${banStats.currentCommands}\n` +
                        `Warnings: ${banStats.warnings}`;

                    return message.reply(userInfo);
                } catch (error) {
                    return message.reply(`❌ Error retrieving user information: ${error.message}`);
                }
            }

            case "unban": {
                const uid = args[1];
                const resetHistory = args[2] === "reset";

                if (!uid) {
                    return message.reply("❌ Please provide a user ID to unban.");
                }

                try {
                    const success = await autoBanHandler.manualUnban(uid, usersData, resetHistory);

                    if (success) {
                        const resetText = resetHistory ? " and ban history cleared" : "";
                        return message.reply(`✅ User ${uid} has been unbanned${resetText}.`);
                    } else {
                        return message.reply("❌ Failed to unban user.");
                    }
                } catch (error) {
                    return message.reply(`❌ Error unbanning user: ${error.message}`);
                }
            }

            case "list":
            case "banned": {
                try {
                    const allUsers = await usersData.getAll();
                    const bannedUsers = [];

                    for (const user of allUsers) {
                        if (user.banned && user.banned.status && user.banned.autoban) {
                            const banStatus = await autoBanHandler.isUserBanned(user.userID, usersData);
                            if (banStatus.banned) {
                                bannedUsers.push({
                                    id: user.userID,
                                    name: user.name || "Unknown",
                                    type: user.banned.type,
                                    timeLeft: banStatus.timeLeft
                                });
                            }
                        }
                    }

                    if (bannedUsers.length === 0) {
                        return message.reply("✅ No users are currently auto-banned.");
                    }

                    let listMessage = `🚫 CURRENTLY BANNED USERS (${bannedUsers.length})\n`;
                    listMessage += "━━━━━━━━━━━━━━\n";

                    bannedUsers.forEach((user, index) => {
                        const timeLeft = user.timeLeft === -1 ? "Permanent" : autoBanHandler.formatDuration(user.timeLeft);
                        listMessage += `${index + 1}. ${user.name} (${user.id})\n`;
                        listMessage += `   Type: ${user.type}\n`;
                        listMessage += `   Time Left: ${timeLeft}\n\n`;
                    });

                    return message.reply(listMessage);
                } catch (error) {
                    return message.reply(`❌ Error retrieving banned users: ${error.message}`);
                }
            }

            default:
                return message.reply(`❌ Unknown subcommand: ${subCommand}\nUse "${this.config.name}" to see available commands.`);
        }
    }
};

const axios = require("axios");
const fs = require("fs-extra");
const fonts = require('../../func/font.js');

let createCanvas, loadImage, registerFont;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        registerFont = canvas.registerFont;
        canvasAvailable = true;
} catch (err) {
        canvasAvailable = false;
}

function generateCardNumber() {
        const firstPart = Math.floor(1000 + Math.random() * 9000);
        const secondPart = Math.floor(1000 + Math.random() * 9000);
        const thirdPart = Math.floor(1000 + Math.random() * 9000);
        const fourthPart = Math.floor(1000 + Math.random() * 9000);
        return `${firstPart}-${secondPart}-${thirdPart}-${fourthPart}`;
}

function generateTransactionID() {
        return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createBankCard(userData, balance, cardNumber, userID) {
        if (!canvasAvailable) return null;

        try {
                const canvas = createCanvas(1000, 630);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1000, 630, 30);
                ctx.clip();

                const gradient = ctx.createLinearGradient(0, 0, 1000, 630);
                gradient.addColorStop(0, "#0f0c29");
                gradient.addColorStop(0.5, "#302b63");
                gradient.addColorStop(1, "#24243e");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1000, 630);

                for (let i = 0; i < 30; i++) {
                        const x = Math.random() * 1000;
                        const y = Math.random() * 630;
                        const radius = Math.random() * 100 + 50;
                        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        innerGradient.addColorStop(0, `rgba(138, 43, 226, ${Math.random() * 0.15})`);
                        innerGradient.addColorStop(1, "rgba(138, 43, 226, 0)");
                        ctx.fillStyle = innerGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
                ctx.shadowBlur = 40;
                roundRect(ctx, 20, 20, 960, 590, 20);
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;

                const chipGradient = ctx.createRadialGradient(130, 110, 10, 130, 110, 50);
                chipGradient.addColorStop(0, "#FFE55C");
                chipGradient.addColorStop(0.5, "#FFD700");
                chipGradient.addColorStop(1, "#B8860B");
                ctx.fillStyle = chipGradient;
                ctx.beginPath();
                ctx.arc(130, 110, 50, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = "bold 48px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("GOAT PREMIUM BANK", 50, 250);

                ctx.font = "bold 42px 'Courier New'";
                const cardParts = cardNumber.split("-");
                const maskedCard = `**** **** **** ${cardParts[3]}`;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(maskedCard, 50, 360);

                ctx.font = "20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.fillText("CARD HOLDER", 50, 440);
                ctx.font = "bold 32px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(userData.name.toUpperCase().substring(0, 22), 50, 480);

                ctx.font = "20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.fillText("BALANCE", 50, 545);
                ctx.font = "bold 44px Arial";
                ctx.fillStyle = "#FFD700";
                ctx.fillText(`$${balance.toLocaleString()}`, 50, 590);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/bank_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                throw error;
        }
}

function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
}

module.exports = {
        config: {
                name: "bank",
                version: "3.1.0",
                author: "Christus",
                countDown: 10,
                role: 0,
                description: {
                        vi: "Hệ thống ngân hàng cao cấp với thẻ, chuyển khoản, vay",
                        en: "Premium banking system with cards, transfers, loans"
                },
                category: "economy",
                guide: {
                        en: "   {pn} register | balance | deposit | withdraw | transfer | loan | history"
                }
        },

        langs: {
                en: {
                        notRegistered: `❌ ${fonts.bold("Account Required:")} Use {pn} register to create your premium account.`,
                        registered: `✅ ${fonts.bold("Welcome to Christus Bank!")}\n💳 ${fonts.sansSerif("Card Number:")} ${fonts.monospace("%1")}\n💰 ${fonts.sansSerif("Initial Balance:")} $0`,
                        alreadyRegistered: `❌ ${fonts.bold("Already Member:")}\n💳 ${fonts.sansSerif("Card Number:")} ${fonts.monospace("%1")}`,
                        invalidAmount: `❌ ${fonts.bold("Error:")} Please enter a valid numerical amount!`,
                        insufficientBank: `❌ ${fonts.bold("Insufficient Bank Funds:")} Your bank balance is ${fonts.monospace("$%1")}`,
                        insufficientWallet: `❌ ${fonts.bold("Insufficient Wallet Funds:")} You only have ${fonts.monospace("$%1")} in cash`,
                        depositSuccess: `✅ ${fonts.bold("Deposit Success!")}\n📥 ${fonts.sansSerif("Amount:")} $${fonts.bold("%1")}\n🆔 ${fonts.monospace("%2")}`,
                        withdrawSuccess: `✅ ${fonts.bold("Withdrawal Success!")}\n📤 ${fonts.sansSerif("Amount:")} $${fonts.bold("%1")}\n🆔 ${fonts.monospace("%2")}`,
                        transferSuccess: `✅ ${fonts.bold("Transfer Complete!")}\n➡️ ${fonts.sansSerif("Sent:")} $${fonts.bold("%1")} to %2\n🆔 ${fonts.monospace("%3")}`,
                        transferReceived: `💰 ${fonts.bold("Payment Received!")}\n⬅️ You received $${fonts.bold("%1")} from %2`,
                        cannotTransferSelf: "❌ You cannot transfer money to your own account!",
                        targetNotRegistered: "❌ The target user does not have a bank account!",
                        loanTaken: `✅ ${fonts.bold("Loan Approved!")}\n💵 ${fonts.sansSerif("Principal:")} $%1\n📈 ${fonts.sansSerif("Total to Repay:")} $%3`,
                        loanExists: `❌ ${fonts.bold("Active Loan Detected:")} Repay your current $%1 loan first.`,
                        loanPaid: `✅ ${fonts.bold("Loan Repayment:")} Paid $%1. Remaining: $%2`,
                        noLoan: "✅ You currently have no outstanding debt!",
                        noTransactions: "📋 No transaction history found.",
                        transactionHistory: `📋 ${fonts.bold("TRANSACTION HISTORY")}\n\n%1`,
                        noTarget: "❌ Please mention or provide user ID to transfer!",
                        maxLoan: `❌ ${fonts.bold("Limit Exceeded:")} Maximum loan is $5000!`
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName }) {
                const { senderID, threadID } = event;
                const userData = await usersData.get(senderID);

                if (!userData.data.bank) {
                        userData.data.bank = { cardNumber: null, balance: 0, transactions: [], loan: 0 };
                }

                const action = args[0]?.toLowerCase();
                const prefix = global.utils.getPrefix(threadID);

                switch (action) {
                        case "register": {
                                if (userData.data.bank.cardNumber) return message.reply(getLang("alreadyRegistered", userData.data.bank.cardNumber));
                                const cardNumber = generateCardNumber();
                                Object.assign(userData.data.bank, { cardNumber, balance: 0, transactions: [], loan: 0 });
                                await usersData.set(senderID, userData.data, "data");
                                return message.reply(getLang("registered", cardNumber));
                        }

                        case "balance":
                        case "bal": {
                                if (!userData.data.bank.cardNumber) return message.reply(getLang("notRegistered").replace("{pn}", prefix + commandName));
                                try {
                                        const cardImage = await createBankCard(userData, userData.data.bank.balance, userData.data.bank.cardNumber, senderID);
                                        if (cardImage) return message.reply({ attachment: cardImage });
                                } catch (err) {}
                                return message.reply(`${fonts.square(" BALANCE ")}\n👤 ${fonts.bold(userData.name)}\n💰 ${fonts.monospace("$" + userData.data.bank.balance.toLocaleString())}`);
                        }

                        case "deposit": {
                                if (!userData.data.bank.cardNumber) return message.reply(getLang("notRegistered").replace("{pn}", prefix + commandName));
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));
                                if (userData.money < amount) return message.reply(getLang("insufficientWallet", userData.money.toLocaleString()));
                                
                                userData.money -= amount;
                                userData.data.bank.balance += amount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({ type: "deposit", amount, txnID, date: new Date().toISOString() });
                                
                                await usersData.set(senderID, { money: userData.money, data: userData.data });
                                return message.reply(getLang("depositSuccess", amount.toLocaleString(), txnID));
                        }

                        case "withdraw": {
                                if (!userData.data.bank.cardNumber) return message.reply(getLang("notRegistered").replace("{pn}", prefix + commandName));
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));
                                if (userData.data.bank.balance < amount) return message.reply(getLang("insufficientBank", userData.data.bank.balance.toLocaleString()));
                                
                                userData.money += amount;
                                userData.data.bank.balance -= amount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({ type: "withdrawal", amount, txnID, date: new Date().toISOString() });
                                
                                await usersData.set(senderID, { money: userData.money, data: userData.data });
                                return message.reply(getLang("withdrawSuccess", amount.toLocaleString(), txnID));
                        }

                        case "transfer": {
                                if (!userData.data.bank.cardNumber) return message.reply(getLang("notRegistered").replace("{pn}", prefix + commandName));
                                let targetID = Object.keys(event.mentions)[0] || args[1];
                                let amount = parseInt(args[1] == targetID ? args[2] : args[1]);

                                if (!targetID || isNaN(amount) || amount <= 0) return message.reply(`💡 ${fonts.sansSerif("Use:")} ${prefix}bank transfer @user <amount>`);
                                if (targetID == senderID) return message.reply(getLang("cannotTransferSelf"));
                                if (userData.data.bank.balance < amount) return message.reply(getLang("insufficientBank", userData.data.bank.balance.toLocaleString()));

                                const targetData = await usersData.get(targetID);
                                if (!targetData.data.bank?.cardNumber) return message.reply(getLang("targetNotRegistered"));

                                userData.data.bank.balance -= amount;
                                targetData.data.bank.balance += amount;
                                const txnID = generateTransactionID();

                                userData.data.bank.transactions.unshift({ type: "transfer_sent", amount, to: targetData.name, txnID, date: new Date().toISOString() });
                                targetData.data.bank.transactions.unshift({ type: "transfer_received", amount, from: userData.name, txnID, date: new Date().toISOString() });

                                await usersData.set(senderID, userData.data, "data");
                                await usersData.set(targetID, targetData.data, "data");
                                return message.reply(getLang("transferSuccess", amount.toLocaleString(), targetData.name, txnID));
                        }

                        case "history":
                        case "transactions": {
                                if (!userData.data.bank.cardNumber) return message.reply(getLang("notRegistered").replace("{pn}", prefix + commandName));
                                if (!userData.data.bank.transactions?.length) return message.reply(getLang("noTransactions"));
                                
                                let history = userData.data.bank.transactions.slice(0, 10).map((txn, i) => 
                                        `${i + 1}. ${fonts.bold(txn.type.toUpperCase())}\n   💰 $${txn.amount.toLocaleString()} | 🆔 ${fonts.monospace(txn.txnID)}`
                                ).join("\n\n");
                                
                                return message.reply(getLang("transactionHistory", history));
                        }

                        default: {
                                return message.reply(`${fonts.square(" CHRISTUS BANK ")}\n\n` +
                                        `• ${fonts.bold("register")} : Create account\n` +
                                        `• ${fonts.bold("balance")} : View your card\n` +
                                        `• ${fonts.bold("deposit")} : Cash ⮕ Bank\n` +
                                        `• ${fonts.bold("withdraw")} : Bank ⮕ Cash\n` +
                                        `• ${fonts.bold("transfer")} : Send to user\n` +
                                        `• ${fonts.bold("loan")} : Take credit\n` +
                                        `• ${fonts.bold("history")} : Last 10 TXN`);
                        }
                }
        }
};

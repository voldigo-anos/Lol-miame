const fonts = require('../../func/font.js');

const DAILY_LIMIT = 20;
const MAX_BET = 6000000;

module.exports = {
	config: {
		name: "slots",
		aliases: ["slot"],
		version: "1.5",
		author: "Christus",
		countDown: 8,
		role: 0,
		description: {
			vi: "Trò chơi máy đánh bạc siêu cấp",
			en: "Ultra-stylish slot machine with balanced odds"
		},
		category: "game",
		guide: {
			en: "   {pn} [bet amount]"
		}
	},

	onStart: async function ({ message, event, args, usersData }) {
		const header = `${fonts.square(" SLOT MACHINE ")}\n${"━".repeat(12)}\n`;
		const { senderID } = event;
		const bet = parseInt(args[0]);

		const formatMoney = (amount) => {
			if (isNaN(amount)) return "0 $";
			amount = Number(amount);
			const scales = [
				{ value: 1e15, suffix: 'Q' },
				{ value: 1e12, suffix: 'T' },
				{ value: 1e9, suffix: 'B' },
				{ value: 1e6, suffix: 'M' },
				{ value: 1e3, suffix: 'k' }
			];
			const scale = scales.find(s => amount >= s.value);
			if (scale) {
				const scaledValue = amount / scale.value;
				return `${fonts.monospace(scaledValue.toFixed(2) + scale.suffix)} $`;
			}
			return `${fonts.monospace(amount.toLocaleString())} $`;
		};

		if (isNaN(bet) || bet <= 0)
			return message.reply(header + `❌ ${fonts.bold("ERROR:")} Please enter a valid bet amount!`);

		if (bet > MAX_BET)
			return message.reply(header + `⚠️ ${fonts.bold("LIMIT:")} Maximum bet is ${formatMoney(MAX_BET)}`);

		const user = await usersData.get(senderID);

		const getBangladeshDate = () => {
			return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
		};

		const today = getBangladeshDate();
		const lastPlayDay = user.data?.slotsDay || "";
		const playCount = user.data?.slotsCount || 0;
		const isSameDay = today === lastPlayDay;
		const currentCount = isSameDay ? playCount : 0;

		if (currentCount >= DAILY_LIMIT) {
			return message.reply(header + `⏳ ${fonts.bold("DAILY LIMIT:")} You have reached the ${fonts.monospace(DAILY_LIMIT)} spins limit for today.`);
		}

		if (user.money < bet)
			return message.reply(header + `💸 ${fonts.bold("INSUFFICIENT:")} You need ${formatMoney(bet - user.money)} more to play.`);

		const symbols = [
			{ emoji: "🍒", weight: 30 },
			{ emoji: "🍋", weight: 25 },
			{ emoji: "🍇", weight: 20 },
			{ emoji: "🍉", weight: 15 },
			{ emoji: "⭐", weight: 7 },
			{ emoji: "7️⃣", weight: 3 }
		];

		const roll = () => {
			const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
			let random = Math.random() * totalWeight;
			for (const symbol of symbols) {
				if (random < symbol.weight) return symbol.emoji;
				random -= symbol.weight;
			}
			return symbols[0].emoji;
		};

		const slot1 = roll();
		const slot2 = roll();
		const slot3 = roll();

		let winnings = 0;
		let outcome;
		let winType = "";
		let bonus = "";

		if (slot1 === "7️⃣" && slot2 === "7️⃣" && slot3 === "7️⃣") {
			winnings = bet * 10;
			outcome = fonts.fancy("MEGA JACKPOT! TRIPLE 7");
			winType = fonts.bold("💎 MAX WIN");
			bonus = `🎆 ${fonts.italic("BONUS: +3% total balance boost!")}`;
			await usersData.set(senderID, { money: user.money * 1.03 });
		} else if (slot1 === slot2 && slot2 === slot3) {
			winnings = bet * 5;
			outcome = fonts.fancy("JACKPOT! TRIPLE MATCH");
			winType = fonts.bold("💫 BIG WIN");
		} else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
			winnings = bet * 2;
			outcome = fonts.fancy("NICE! DOUBLE MATCH");
			winType = fonts.bold("🌟 WIN");
		} else if (Math.random() < 0.45) {
			winnings = bet * 1.5;
			outcome = fonts.fancy("LUCKY SPIN! BONUS WIN");
			winType = fonts.bold("🍀 SMALL WIN");
		} else {
			winnings = -bet;
			outcome = fonts.fancy("BETTER LUCK NEXT TIME");
			winType = fonts.bold("☠️ LOSS");
		}

		const newBalance = user.money + winnings;

		await usersData.set(senderID, {
			money: newBalance,
			"data.slotsDay": today,
			"data.slotsCount": currentCount + 1
		});

		const slotVisual = 
			`╭───────────╮\n` +
			`  [ ${slot1} | ${slot2} | ${slot3} ]  \n` +
			`╰───────────╯`;

		const resultStatus = winnings >= 0 ? `🟢 ${fonts.bold("PROFIT:")}` : `🔴 ${fonts.bold("LOSS:")}`;
		const resultAmount = formatMoney(Math.abs(winnings));

		const messageContent = 
			header +
			`${slotVisual}\n\n` +
			`🎯 ${fonts.sansSerif("RESULT:")} ${outcome}\n` +
			`🏆 ${fonts.sansSerif("TYPE:")} ${winType}\n` +
			`${bonus ? bonus + "\n" : ""}\n` +
			`${resultStatus} ${resultAmount}\n` +
			`💰 ${fonts.sansSerif("BALANCE:")} ${formatMoney(newBalance)}\n` +
			`🔄 ${fonts.sansSerif("SPINS:")} ${fonts.monospace(currentCount + 1)}/${fonts.monospace(DAILY_LIMIT)}\n\n` +
			`💡 ${fonts.italic("Higher bets increase jackpot probabilities!")}`;

		return message.reply(messageContent);
	}
};

import { Bot } from "../../src/Bot/Bot";
import { OrderAction, OrderItem } from "../../src/Bot/Order";
import { SubscriptionData } from "../../src/Bot/Subscription";

export const actionLinkBtcBuy = async (
	subscription: SubscriptionData
) => {
	Bot.log(`actionLinkBtcBuy`);
	let linkBtcKrakenBuy = Bot.getItem('order:linkBtcKrakenBuy') as OrderItem;
	linkBtcKrakenBuy.update({
		price: '-30%',
		quantity: '0.1%',
	});

	const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Open);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Edit);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Get);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Close);
	
	// TODO: To be refactored
	Bot.__devPrepareNextStateOrder(
		linkBtcKrakenBuy,
		linkBtcKrakenBuyResult
	);

	Bot.exit();
};

export const actionLinkBtcSell = async (
	subscription: SubscriptionData
) => {
	Bot.log(`actionLinkBtcSell`);
	let linkBtcKrakenSell = Bot.getItem('order:linkBtcKrakenSell') as OrderItem;
	linkBtcKrakenSell.update({
		price: '30%',
		quantity: '0.1%',
	});

	const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Open);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Edit);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Get);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Close);

	// TODO: To be refactored
	Bot.__devPrepareNextStateOrder(
		linkBtcKrakenSell,
		linkBtcKrakenSellResult
	);

	Bot.exit();
};

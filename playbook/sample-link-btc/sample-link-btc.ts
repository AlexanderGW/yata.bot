import { YATAB } from "../../src/YATAB/YATAB";
import { OrderAction, OrderItem } from "../../src/YATAB/Order";
import { SubscriptionData } from "../../src/YATAB/Subscription";

export const actionLinkBtcBuy = async (
	subscription: SubscriptionData
) => {
	YATAB.log(`actionLinkBtcBuy`);
	let linkBtcKrakenBuy = YATAB.getItem('yatab:playbook:sample-link-btc:order:linkBtcKrakenBuy') as OrderItem;
	linkBtcKrakenBuy.update({
		price: '-30%',
		quantity: '0.1%',
	});

	const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Open);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Edit);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Get);
	// const linkBtcKrakenBuyResult = await linkBtcKrakenBuy.execute(OrderAction.Close);
	
	// TODO: To be refactored
	YATAB.__devPrepareNextStateOrder(
		linkBtcKrakenBuy,
		linkBtcKrakenBuyResult
	);

	await YATAB.exit();
};

export const actionLinkBtcSell = async (
	subscription: SubscriptionData
) => {
	YATAB.log(`actionLinkBtcSell`);
	let linkBtcKrakenSell = YATAB.getItem('yatab:playbook:sample-link-btc:order:linkBtcKrakenSell') as OrderItem;
	linkBtcKrakenSell.update({
		price: '30%',
		quantity: '0.1%',
	});

	const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Open);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Edit);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Get);
	// const linkBtcKrakenSellResult = await linkBtcKrakenSell.execute(OrderAction.Close);

	// TODO: To be refactored
	YATAB.__devPrepareNextStateOrder(
		linkBtcKrakenSell,
		linkBtcKrakenSellResult
	);

	await YATAB.exit();
};

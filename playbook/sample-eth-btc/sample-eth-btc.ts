import { YATAB } from "../../src/YATAB/YATAB";
import { OrderAction } from "../../src/YATAB/Order";
import { SubscriptionData } from "../../src/YATAB/Subscription";

// Subscription `ethBtcKrakenBuy` action callback
export const actionEthBtcBuy = async (
	subscription: SubscriptionData
) => {
	// console.log(subscription);
	// YATAB.log(JSON.stringify(subscription));
	YATAB.log(`actionEthBtcBuy`);

	// NOTE: All items instanciated within a playbook, are prefixed with their item type
	// which gives the impression that you can use the same item `name` value everywhere.
	// The example below shows how to call a playbook instanciated order 
	// with `name` of `ethBtcKrakenSell`.

	// If you are setting up a bot without using the playbook functionality,
	// you will need to use unique `name` values within your items.
	
	// By default, if you add two items with the same `name` values to `YATAB.setItem`,
	// you will only get the first item that was added, when calling `YATAB.getItem`.
	// Use the item `uuid` instead for unique referencing.

	// For item `name` based overwriting, use `BOT_ITEM_NAME_OVERWRITE=1` on `.env`

	// let ethBtcKrakenSell = YATAB.getItem('yatab:playbook:sample-eth-btc:order.ethBtcKrakenSell');
	// console.log(ethBtcKrakenSell);

	// ethBtcKrakenSell.execute(OrderAction.Open);
	await YATAB.exit();
};

// Subscription `ethBtcKrakenSell` action callback
export const actionEthBtcSell = async (
	subscription: SubscriptionData
) => {
	YATAB.log(`actionEthBtcSell`);
	await YATAB.exit();
};
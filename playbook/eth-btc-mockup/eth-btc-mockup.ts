import { Bot } from "../../src/Bot/Bot";
import { OrderAction } from "../../src/Bot/Order";
import { SubscriptionData } from "../../src/Bot/Subscription";

// Subscription `ethBtcKrakenBuy` action callback
export const actionEthBtcBuy = (
	subscription: SubscriptionData
) => {
	// console.log(subscription);
	// Bot.log(JSON.stringify(subscription));
	Bot.log(`actionEthBtcBuy`);

	// NOTE: All items instanciated within a playbook, are prefixed with their item type
	// which gives the impression that you can use the same item `name` value everywhere.
	// The example below shows how to call a playbook instanciated order 
	// with `name` of `ethBtcKrakenSell`.

	// If you are setting up a bot without using the playbook functionality,
	// you will need to use unique `name` values within your items.
	
	// By default, if you add two items with the same `name` values to `Bot.setItem`,
	// you will only get the first item that was added, when calling `Bot.getItem`.
	// Use the item `uuid` instead for unique referencing.

	// For item `name` based overwriting, use `BOT_ITEM_NAME_OVERWRITE=1` on `.env`

	// let ethBtcKrakenSell = Bot.getItem('order.ethBtcKrakenSell');
	// console.log(ethBtcKrakenSell);

	// ethBtcKrakenSell.execute(OrderAction.Create);
};

// Subscription `ethBtcKrakenSell` action callback
export const actionEthBtcSell = (
	subscription: SubscriptionData
) => {
	Bot.log(`actionEthBtcSell`);
};
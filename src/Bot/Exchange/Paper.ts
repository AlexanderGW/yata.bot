import { Bot, Log } from '../Bot';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';
import { OrderDirection, OrderItem, OrderType } from '../Order';

const fs = require('fs');

export class PaperItem extends ExchangeItem {

	constructor (
		data: ExchangeData,
	) {
		super(data);
	}

	async order (
		order: OrderItem,
	) {
		let result: boolean = false;

		try {
			
			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${order.pair.a.symbol}X${order.pair.b.symbol}`;

			console.log({
				pair: pair,
				ordertype: order.type,
				type: order.direction,
				volume: order.amount,
			});

			result = true;
		} catch (error) {
			console.error(error);
		}

		return result;
	}
}

export const Paper = {
	new (
		data: ExchangeData,
	): PaperItem {
		let item = new PaperItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';
import { OrderDirection, OrderItem, OrderType } from '../Order';

import { uuid } from 'uuidv4';

const fs = require('fs');

export class PaperItem extends ExchangeItem {
	name: string;
	uuid: string;

	constructor (
		data: ExchangeData,
	) {
		super(data);
		this.name = data.name;
		this.uuid = data.uuid ?? uuid();
	}

	order (
		order: OrderItem,
	) {
		try {
			
			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${order.pair.a.symbol}X${order.pair.b.symbol}`;

			Bot.log(`Paper: Order ${pair} placed`);
			console.log({
				pair: pair,
				ordertype: order.type,
				type: order.direction,
				volume: order.amount,
			});
		} catch (error) {
			console.error(error);
		}
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
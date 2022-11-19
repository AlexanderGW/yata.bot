import { Bot } from '../Bot';
import { ExchangeData, ExchangeItem } from '../Exchange';
import { OrderItem } from '../Order';

const fs = require('fs');

export class PaperItem extends ExchangeItem {
	result: Array<OrderItem> = [];

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
			this.result.push(order);
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
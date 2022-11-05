import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";

export type AssetData = {
	exchange: ExchangeItem,
	name?: string,
	price?: number,
	symbol: string,
}

export class AssetItem implements AssetData {
	exchange: ExchangeItem;
	name?: string;
	price?: number;
	symbol: string;

	constructor (
		data: AssetData,
	) {
		this.exchange = data.exchange;
		if (data.name)
			this.name = data.name;
		if (data.price)
			this.price = data.price;
		this.symbol = data.symbol;
	}
}

export const Asset = {
	new (
		data: AssetData,
	) {
		let item = new AssetItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
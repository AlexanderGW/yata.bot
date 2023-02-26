import { Bot } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

export type AssetData = {
	name?: string,
	price?: number,
	symbol: string,
	uuid?: string,
}

export class AssetItem implements AssetData {
	name?: string;
	price?: number;
	symbol: string;
	uuid: string;

	constructor (
		data: AssetData,
	) {
		if (data.name)
			this.name = data.name;
		if (data.price)
			this.price = data.price;
		this.symbol = data.symbol;
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Asset = {
	new (
		data: AssetData,
	): AssetItem {
		let item = new AssetItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
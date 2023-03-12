import { AssetItem } from "./Asset";
import { Bot } from "./Bot";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";

export type PairData = {
	a: AssetItem,
	b: AssetItem,
	exchange: ExchangeItem,
	name?: string,
	priceA?: string,
	priceB?: string,
	uuid?: string,
}

export type PairPriceData = {
	asset: AssetItem,
	price: string,
}

export class PairItem implements PairData {
	a: AssetItem;
	b: AssetItem;
	exchange: ExchangeItem;
	name?: string;
	priceA: string = '0'; 
	priceB: string = '0'; 
	uuid: string; 

	constructor (
		data: PairData,
	) {
		// TODO: Compare exchange on assets
		this.a = data.a;
		this.b = data.b;
		this.exchange = data.exchange;
		if (data.name)
			this.name = data.name;
		this.uuid = data.uuid ?? uuidv4();
	}

	setPrice (
		data: PairPriceData
	) {
		
	}
}

export const Pair = {
	new (
		data: PairData,
	): PairItem {
		let item = new PairItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
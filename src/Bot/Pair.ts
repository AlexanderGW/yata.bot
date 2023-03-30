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
		_: PairData,
	) {
		// TODO: Compare exchange on assets
		this.a = _.a;
		this.b = _.b;
		this.exchange = _.exchange;
		if (_.name)
			this.name = _.name;
		this.uuid = _.uuid ?? uuidv4();
	}

	setPrice (
		_: PairPriceData
	) {
		
	}
}

export const Pair = {
	new (
		_: PairData,
	): PairItem {
		let item = new PairItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
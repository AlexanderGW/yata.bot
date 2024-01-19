import { AssetItem } from "./Asset";
import { Bot, ItemBaseData, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";

// export interface PairInterface {
// 	a: AssetItem;
// 	b: AssetItem;
// 	exchange: ExchangeItem;
// 	name?: string;
// 	uuid?: string;
// 	// getTicker: () => string;
// }

export type PairData = {
	a: AssetItem,
	b: AssetItem,
	exchange: ExchangeItem,
	name?: string,
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
	uuid: string;
	// getTicker: () => string;

	constructor (
		_: PairData,
	) {
		// TODO: Compare exchange on assets
		this.a = _.a;
		this.b = _.b;
		this.exchange = _.exchange;
		this.uuid = _.uuid ?? uuidv4();
		this.name = _.name ?? _.uuid;

		// this.getTicker = () => {
		// 	return `${this.a.symbol}-${this.b.symbol}`;
		// };
	}
}

export const Pair = {
	async new (
		_: PairData,
	): Promise<PairItem> {
		let item = new PairItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
import { AssetItem } from "./Asset";
import { Bot, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";

export type PairData = {
	a: AssetItem,
	b: AssetItem,
	exchange: ExchangeItem,
	name?: string,
	// priceA?: string,
	// priceB?: string,
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
	// priceA: string = '0'; 
	// priceB: string = '0'; 
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
}

export const Pair = {
	async new (
		_: PairData,
	): Promise<PairItem> {
		let assetASymbol = _.a.symbol;
		let assetBSymbol = _.b.symbol;
		let pairTicker = `${assetASymbol}-${assetBSymbol}`;
		
		let index = _.exchange.tickerIndex.indexOf(pairTicker);
		if (index < 0) {
			await _.exchange.getTicker(_);
			index = _.exchange.tickerIndex.indexOf(pairTicker);
			if (index < 0)
				Bot.log(`Exchange '${_.exchange.name}'; No ticker information for '${pairTicker}'`, Log.Warn);
		}
		
		let item = new PairItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
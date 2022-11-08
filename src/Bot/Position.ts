import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { uuid } from 'uuidv4';

export type PositionData = {
	amount?: string,
	exchange: ExchangeItem,
	live?: boolean,
	pair: PairItem,
	uuid?: string,
}

export class PositionItem implements PositionData {
	amount?: string = '0';
	exchange: ExchangeItem;
	live: boolean;
	pair: PairItem;
	uuid: string;

	constructor (
		data: PositionData,
	) {
		if (data.amount)
			this.amount = data.amount;
		this.exchange = data.exchange;
		if (data.hasOwnProperty('live'))
			this.live = data.live ? true : false;
		else if (process.env.BOT_LIVE)
			this.live = process.env.BOT_LIVE === '1' ? true : false;
		else
			this.live = false;
		this.pair = data.pair;
		this.uuid = data.uuid ?? uuid();
	}
}

export const Position = {
	new (
		data: PositionData,
	): PositionItem {
		let item = new PositionItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { v4 as uuidv4 } from 'uuid';

export type PositionData = {
	amount?: string,
	exchange: ExchangeItem,
	pair: PairItem,
	uuid?: string,
}

export class PositionItem implements PositionData {
	amount?: string = '0';
	exchange: ExchangeItem;
	pair: PairItem;
	uuid: string;

	constructor (
		data: PositionData,
	) {
		if (data.amount)
			this.amount = data.amount;
		this.exchange = data.exchange;
		this.pair = data.pair;
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Position = {
	new (
		data: PositionData,
	): Promise<PositionItem> {
		let item = new PositionItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(item.uuid);
	}
};
import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { State } from "./State";
import { uuid } from 'uuidv4';

export type PositionData = {
	amount?: string,
	exchange: ExchangeItem,
	pair: PairItem,
	state?: State,
	uuid?: string,
}

export class PositionItem implements PositionData {
	amount?: string = '0';
	exchange: ExchangeItem;
	pair: PairItem;
	state?: State = State.Open;
	uuid: string;

	constructor (
		data: PositionData,
	) {
		if (data.amount)
			this.amount = data.amount;
		this.exchange = data.exchange;
		this.pair = data.pair;
		if (data.state)
			this.state = data.state;
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
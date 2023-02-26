import { Bot } from "./Bot";
import { PairItem } from "./Pair";
import { v4 as uuidv4 } from 'uuid';

export type PositionData = {
	quantity?: string,
	pair: PairItem,
	uuid?: string,
}

export class PositionItem implements PositionData {
	quantity?: string = '0';
	pair: PairItem;
	uuid: string;

	constructor (
		data: PositionData,
	) {
		if (data.quantity)
			this.quantity = data.quantity;
		this.pair = data.pair;
		this.uuid = data.uuid ?? uuidv4();
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
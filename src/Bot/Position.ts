import { Bot } from "./Bot";
import { PairItem } from "./Pair";
import { v4 as uuidv4 } from 'uuid';

export type PositionData = {
	name?: string,
	pair: PairItem,
	quantity?: string,
	uuid?: string,
}

export class PositionItem implements PositionData {
	name?: string;
	pair: PairItem;
	quantity?: string = '0';
	uuid: string;

	constructor (
		data: PositionData,
	) {
		if (data.name)
			this.name = data.name;
		this.pair = data.pair;
		if (data.quantity)
			this.quantity = data.quantity;
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
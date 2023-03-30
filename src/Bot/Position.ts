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
		_: PositionData,
	) {
		if (_.name)
			this.name = _.name;
		this.pair = _.pair;
		if (_.quantity)
			this.quantity = _.quantity;
		this.uuid = _.uuid ?? uuidv4();
	}
}

export const Position = {
	new (
		_: PositionData,
	): PositionItem {
		let item = new PositionItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
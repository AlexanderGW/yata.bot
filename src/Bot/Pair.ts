import { AssetItem } from "./Asset";
import { Bot } from "./Bot";
import { uuid } from 'uuidv4';

export type PairData = {
	a: AssetItem,
	b: AssetItem,
	uuid?: string,
}

export class PairItem implements PairData {
	a: AssetItem;
	b: AssetItem;
	uuid: string; 

	constructor (
		data: PairData,
	) {
		this.a = data.a;
		this.b = data.b;
		this.uuid = data.uuid ?? uuid();
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
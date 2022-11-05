import { AssetItem } from "./Asset";
import { Bot } from "./Bot";

export type PairData = {
	a: AssetItem,
	b: AssetItem,
}

export class PairItem implements PairData {
	a: AssetItem;
	b: AssetItem;

	constructor (
		data: PairData,
	) {
		this.a = data.a;
		this.b = data.b;
	}
}

export const Pair = {
	new (
		data: PairData,
	) {
		let item = new PairItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
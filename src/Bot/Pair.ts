import { AssetItem } from "./Asset";
import { Bot } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

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
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Pair = {
	async new (
		data: PairData,
	): Promise<PairItem> {
		let item = new PairItem(data);
		let uuid = await Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
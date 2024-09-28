import { YATAB } from "./YATAB";
import { v4 as uuidv4 } from 'uuid';

export type AssetData = {
	name?: string,
	price?: number,
	symbol: string,
	uuid?: string,
}

export class AssetItem implements AssetData {
	name?: string;
	price?: number;
	symbol: string;
	uuid: string;

	constructor (
		_: AssetData,
	) {
		this.name = _.name ?? _.symbol;
		if (_.price)
			this.price = _.price;
		this.symbol = _.symbol;
		this.uuid = _.uuid ?? uuidv4();
	}
}

export const Asset = {
	new (
		_: AssetData,
	): AssetItem {
		let item = new AssetItem(_);
		let uuid = YATAB.setItem(item);

		return YATAB.getItem(uuid) as AssetItem;
	}
};
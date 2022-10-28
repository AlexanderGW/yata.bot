import { Exchange } from "./Exchange";

export type AssetData = {
	exchange: Exchange,
	name?: string,
	price?: number,
	symbol: string,
}

export class Asset implements AssetData {
	exchange: Exchange;
	name?: string;
	price?: number;
	symbol: string;

	constructor (
		data: AssetData,
	) {
		this.exchange = data.exchange;
		if (data.name)
			this.name = data.name;
		if (data.price)
			this.price = data.price;
		this.symbol = data.symbol;
	}
}
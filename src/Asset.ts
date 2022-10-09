export type AssetData = {
	name?: string,
	price?: number,
	symbol: string,
}

export class Asset implements AssetData {
	name?: string;
	price?: number;
	symbol: string;

	constructor (
		data: AssetData,
	) {
		this.symbol = data.symbol;
		if (data.name)
			this.name = data.name;
		if (data.price)
			this.price = data.price;
	}
}
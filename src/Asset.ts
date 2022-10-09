export type AssetData = {
	name?: string,
	symbol: string,
}

export class Asset implements AssetData {
	name?: string;
	symbol: string;

	constructor (
		data: AssetData,
	) {
		this.symbol = data.symbol;
		if (data.name)
			this.name = data.name;
	}
}
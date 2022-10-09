export class Asset {
	ticker: string;

	constructor (
		ticker: string,
	) {
		this.ticker = ticker;
	}

	setTicker (newTicker: string) {
		this.ticker = newTicker;
	}
}
export type CandleData = {
	change: string;
	changePercent: string;
	close: string;
	closeTime: number;
	high: string;
	low: string;
	open: string;
	openTime: number;
	tradeCount: number;
	volume: string;
};

export class Candle implements CandleData {
	change: string;
	changePercent: string;
	close: string;
	closeTime: number;
	high: string;
	low: string;
	open: string;
	openTime: number;
	tradeCount: number;
	volume: string;

	constructor (
		data: CandleData,
	) {
		this.change = data.change;
		this.changePercent = data.changePercent;
		this.close = data.close;
		this.closeTime = data.closeTime;
		this.high = data.high;
		this.low = data.low;
		this.open = data.open;
		this.openTime = data.openTime;
		this.tradeCount = data.tradeCount;
		this.volume = data.volume;
	}
}
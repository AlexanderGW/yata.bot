import { Exchange } from "./Exchange";

export type ChartData = {
	change: string[],
	changePercent: string[],
	close: string[],
	closeTime: number[],
	exchange: Exchange,
	high: string[],
	low: string[],
	open: string[],
	openTime: number[],
	tradeCount: number[],
	volume: string[],
	weightedAvePrice?: string[],
};

export class Chart implements ChartData {
	change: string[];
	changePercent: string[];
	close: string[];
	closeTime: number[];
	exchange: Exchange;
	high: string[];
	low: string[];
	open: string[];
	openTime: number[];
	tradeCount: number[];
	volume: string[];
	weightedAvePrice?: string[];

	constructor (
		data: ChartData,
	) {
		this.change = data.change;
		this.changePercent = data.changePercent;
		this.close = data.close;
		this.closeTime = data.closeTime;
		this.exchange = data.exchange;
		this.high = data.high;
		this.low = data.low;
		this.open = data.open;
		this.openTime = data.openTime;
		this.tradeCount = data.tradeCount;
		this.volume = data.volume;
		if (data.weightedAvePrice)
			this.weightedAvePrice = data.weightedAvePrice;
	}
}
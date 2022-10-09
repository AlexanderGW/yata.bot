import { Exchange } from "./Exchange";
import { Pair } from "./Pair";

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
	pair: Pair,
	timeframe: number, // Seconds
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
	pair: Pair;
	timeframe: number;
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
		this.pair = data.pair;
		this.timeframe = data.timeframe > 0 ? data.timeframe : 0;
		this.tradeCount = data.tradeCount;
		this.volume = data.volume;
		if (data.weightedAvePrice)
			this.weightedAvePrice = data.weightedAvePrice;
	}
}
import { Exchange } from "./Exchange";
import { Pair } from "./Pair";

export type ChartData = {
	exchange: Exchange,
	pair: Pair,
	timeframe: number, // Seconds
};

export type ChartCandleData = {
	change?: string[],
	changePercent?: string[],
	close?: string[],
	closeTime?: number[],
	high?: string[],
	low?: string[],
	open?: string[],
	openTime?: number[],
	tradeCount?: number[],
	volume?: string[],
	weightedAvePrice?: string[],
};

export class Chart implements ChartData, ChartCandleData {
	change?: string[];
	changePercent?: string[];
	close?: string[];
	closeTime?: number[];
	exchange: Exchange;
	high?: string[];
	low?: string[];
	open?: string[];
	openTime?: number[];
	pair: Pair;
	timeframe: number;
	tradeCount?: number[];
	volume?: string[];
	weightedAvePrice?: string[];

	constructor (
		data: ChartData & ChartCandleData,
	) {
		if (data.change)
			this.change = data.change;
		if (data.changePercent)
			this.changePercent = data.changePercent;
		if (data.close)
			this.close = data.close;
		if (data.closeTime)
			this.closeTime = data.closeTime;
		this.exchange = data.exchange;
		if (data.high)
			this.high = data.high;
		if (data.low)
			this.low = data.low;
		if (data.open)
			this.open = data.open;
		if (data.openTime)
			this.openTime = data.openTime;
		this.pair = data.pair;
		this.timeframe = data.timeframe > 0 ? data.timeframe : 0;
		if (data.tradeCount)
			this.tradeCount = data.tradeCount;
		if (data.volume)
			this.volume = data.volume;
		if (data.weightedAvePrice)
			this.weightedAvePrice = data.weightedAvePrice;
	}

	refresh (
		data: ChartCandleData,
	) {
		if (data.change)
			this.change = data.change;
		if (data.changePercent)
			this.changePercent = data.changePercent;
		if (data.close)
			this.close = data.close;
		if (data.closeTime)
			this.closeTime = data.closeTime;
		if (data.high)
			this.high = data.high;
		if (data.low)
			this.low = data.low;
		if (data.open)
			this.open = data.open;
		if (data.openTime)
			this.openTime = data.openTime;
		if (data.tradeCount)
			this.tradeCount = data.tradeCount;
		if (data.volume)
			this.volume = data.volume;
		if (data.weightedAvePrice)
			this.weightedAvePrice = data.weightedAvePrice;
	}
}
import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";

export type ChartData = {
	exchange: ExchangeItem,
	lastUpdateTime?: number, // Milliseconds
	pair: PairItem,
	pollTime?: number, // Seconds
	candleTime?: number, // Seconds
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

export class ChartItem implements ChartData, ChartCandleData {
	change?: string[];
	changePercent?: string[];
	close?: string[];
	closeTime?: number[];
	exchange: ExchangeItem;
	high?: string[];
	lastUpdateTime: number;
	low?: string[];
	open?: string[];
	openTime?: number[];
	pair: PairItem;
	pollTime: number;
	candleTime: number;
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
		if (data.lastUpdateTime)
			this.lastUpdateTime = data.lastUpdateTime > 0 ? data.lastUpdateTime : 0;
		else
			this.lastUpdateTime = 0;
		if (data.low)
			this.low = data.low;
		if (data.open)
			this.open = data.open;
		if (data.openTime)
			this.openTime = data.openTime;
		this.pair = data.pair;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60;
		else
			this.pollTime = 60;
		if (data.candleTime)
			this.candleTime = data.candleTime > 0 ? data.candleTime : 3600;
		else
			this.candleTime = 3600;
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
		this.lastUpdateTime = data.openTime?.length
			? (parseInt(data.openTime[data.openTime.length - 1]) * 1000)
			: Date.now();
		// let nnn = new Date(this.lastUpdateTime);
		// console.log(`this.lastUpdateTime: ${nnn.toISOString()}`);
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

export const Chart = {
	new (
		data: ChartData,
	) {
		let item = new ChartItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
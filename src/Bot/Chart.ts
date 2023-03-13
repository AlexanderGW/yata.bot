import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";

export type ChartData = {
	dataset?: ChartCandleData,
	datasetFile?: string,
	lastUpdateTime?: number, // Milliseconds
	name?: string,
	pair: PairItem,
	pollTime?: number, // Seconds
	candleTime?: number, // Seconds
	uuid?: string,
};

export type ChartCandleData = {
	[index: string]: any,
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
	weightedAvePrice?: string[], // TWAP
};

export class ChartItem implements ChartData {
	dataset?: ChartCandleData;
	datasetFile?: string;
	lastUpdateTime: number;
	name?: string;
	pair: PairItem;
	pollTime: number;
	candleTime: number;
	uuid: string;

	constructor (
		data: ChartData,
	) {
		this.dataset = data.dataset;
		if (data.datasetFile)
			this.datasetFile = data.datasetFile;
		if (data.lastUpdateTime)
			this.lastUpdateTime = data.lastUpdateTime > 0 ? data.lastUpdateTime : 0;
		else
			this.lastUpdateTime = 0;
		if (data.name)
			this.name = data.name;
		this.pair = data.pair;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60;
		else
			this.pollTime = 60;
		if (data.candleTime)
			this.candleTime = data.candleTime > 0 ? data.candleTime : 3600;
		else
			this.candleTime = 3600;
		this.uuid = data.uuid ?? uuidv4();

		if (this.datasetFile) {
			const fs = require('fs');
			console.log(fs.existsSync(this.datasetFile));
			if (!fs.existsSync(this.datasetFile)) {
				if (process.env.BOT_CHART_DATAFILE_FAIL_EXIT === '1')
					throw (`Chart '${this.name}'; Dataset not found '${this.datasetFile}'`);

				return;
			}

			try {
				let response: any = fs.readFileSync(
					this.datasetFile,
					'utf8',
					function (
						err: object,
						data: object
					) {
						if (err)
							console.error(err);
					}
				);
	
				let responseJson = JSON.parse(response);
				if (responseJson) {
					this.pair.exchange.refreshChart(
						this,
						responseJson,
					);
				}
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}
	}

	refresh (
		data: ChartCandleData,
	) {
		this.dataset = data;
		this.lastUpdateTime = Date.now();
		let lastUpdateDate = new Date(this.lastUpdateTime);

		let firstTime;
		let lastTime;
		let firstDate = new Date();
		let lastDate = new Date();

		let timeField: string = '';
		if (this.dataset?.openTime)
			timeField = 'openTime';
		else if (this.dataset?.closeTime)
			timeField = 'closeTime';
		
		if (this.dataset[timeField]) {
			firstTime = this.dataset[timeField]?.slice(0, 1);
			if (firstTime)
				firstDate.setTime(firstTime[0] * 1000);
			
			lastTime = this.dataset[timeField]?.slice(-1);
			if (lastTime)
				lastDate.setTime(lastTime[0] * 1000);
		}
		
		Bot.log(`Chart '${this.uuid}'; Refreshed '${lastUpdateDate.toISOString()}'; Begins (${timeField}) '${firstDate.toISOString()}'; Ends (${timeField}) '${lastDate.toISOString()}'`);
	}
}

export const Chart = {
	new (
		data: ChartData,
	): ChartItem {
		let item = new ChartItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
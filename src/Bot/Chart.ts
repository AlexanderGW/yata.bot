import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";

import { existsSync, readFileSync } from 'node:fs';

export const chartCandleFields = [
	'close',
	'closeTime',
	'high',
	'low',
	'open',
	'openTime',
	'tradeCount',
	'volume',
	'vwap',
];

export type ChartData = {
	candleTime?: number, // Seconds
	dataset?: ChartCandleData,
	datasetEndTime?: number, // Milliseconds
	datasetFile?: string,
	datasetNextTime?: number, // Milliseconds
	datasetStartTime?: number, // Milliseconds
	datasetSyncTime?: number, // Milliseconds
	datasetTimeField?: string,
	datasetUpdateTime?: number, // Milliseconds
	name?: string,
	pair: PairItem,
	pollTime?: number, // Seconds
	uuid?: string,
};

export type ChartCandleData = {
	[index: string]: any,
	close?: string[],
	closeTime?: number[],
	high?: string[],
	low?: string[],
	open?: string[],
	openTime?: number[],
	tradeCount?: number[],
	volume?: string[],
	vwap?: string[],
};

export class ChartItem implements ChartData {
	candleTime: number = 3600000; // One hour
	dataset?: ChartCandleData;
	datasetEndTime: number = 0;
	datasetFile?: string;
	datasetNextTime: number = 0;
	datasetStartTime: number = 0;
	datasetSyncTime: number = 0;
	datasetTimeField: string = '';
	datasetUpdateTime: number = 0;
	name?: string;
	pair: PairItem;
	pollTime: number = 0;
	uuid: string;

	constructor (
		_: ChartData,
	) {
		this.dataset = _.dataset;
		if (_.datasetFile)
			this.datasetFile = _.datasetFile;
		if (_.datasetEndTime)
			this.datasetEndTime = _.datasetEndTime;
		if (_.datasetStartTime)
			this.datasetStartTime = _.datasetStartTime;
		if (_.datasetSyncTime)
			this.datasetSyncTime = _.datasetSyncTime;
		if (_.datasetTimeField)
			this.datasetTimeField = _.datasetTimeField;
		if (_.datasetUpdateTime)
			this.datasetUpdateTime = _.datasetUpdateTime;
		if (_.datasetNextTime)
			this.datasetNextTime = _.datasetNextTime;
		this.pair = _.pair;
		if (_.pollTime)
			this.pollTime = _.pollTime;
		if (_.candleTime)
			this.candleTime = _.candleTime;
		this.uuid = _.uuid ?? uuidv4();

		// Set chart name
		this.name = _.name ?? this.uuid;

		if (this.datasetFile) {
			if (!existsSync(this.datasetFile)) {
				if (process.env.BOT_CHART_DATAFILE_FAIL_EXIT === '1')
					throw new Error(`Chart '${this.name}'; Dataset not found '${this.datasetFile}'`);

				return;
			}

			let response: any = readFileSync(
				this.datasetFile,
				'utf8',
			);

			let responseJson: ChartCandleData = JSON.parse(response);
			if (responseJson)
				this.dataset = responseJson;
		}

		this.refreshDataset();
	}

	refreshDataset () {
		let startTime: number[];
		let endTime: number[];
		let nextTime: number = 0;
		
		if (!this.datasetNextTime) {

			// Sync from when the chart was last updated
			if (this.datasetSyncTime > 0)
				nextTime = this.datasetSyncTime;
			else if (this.datasetUpdateTime > 0)
				nextTime = this.datasetUpdateTime;
			
			// Get a default number of candles
			else {
				let totalCandles: number = 100;
				if (process.env.BOT_CHART_DEFAULT_TOTAL_CANDLE)
					totalCandles = parseInt(process.env.BOT_CHART_DEFAULT_TOTAL_CANDLE);

				nextTime = Date.now() - (this.candleTime * totalCandles)
			}
		}
		
		// Set dataset time field
		if (!this.datasetTimeField?.length) {
			let timeField: string = '';
			if (this.dataset?.openTime)
				timeField = 'openTime';
			else if (this.dataset?.closeTime)
				timeField = 'closeTime';
			
			if (timeField.length)
				this.datasetTimeField = timeField;
		}

		// Get first and last chart dataset candle times
		if (
			this.dataset?.hasOwnProperty(this.datasetTimeField)
			&& this.dataset[this.datasetTimeField].length
		) {
			startTime = this.dataset[this.datasetTimeField]?.slice(0, 1);
			if (startTime) {
				const value = startTime[0] * 1000;
				this.datasetStartTime = value;
			}
			
			endTime = this.dataset[this.datasetTimeField]?.slice(-1);
			if (endTime) {
				const value = endTime[0] * 1000;
				this.datasetEndTime = value;
				nextTime = value;
			}
		}

		// Deduct one candle, to ensure we receive overlapping data 
		// and avoid missing delta
		if (nextTime)
			this.datasetNextTime = nextTime - this.candleTime;

		let logLine = `Chart '${this.name}'; Refreshed dataset`;

		if (this.datasetTimeField)
			logLine = `${logLine}; Field '${this.datasetTimeField}'`;

		if (this.datasetStartTime) {
			const startDate = new Date(this.datasetStartTime);
			logLine = `${logLine}; Start '${startDate.toISOString()}'`;
		}

		if (this.datasetEndTime) {
			const endDate = new Date(this.datasetEndTime);
			logLine = `${logLine}; End '${endDate.toISOString()}'`;
		}

		if (this.datasetUpdateTime) {
			const updateDate = new Date(this.datasetUpdateTime);
			logLine = `${logLine}; Update '${updateDate.toISOString()}'`;
		}

		if (this.datasetSyncTime) {
			const syncDate = new Date(this.datasetSyncTime);
			logLine = `${logLine}; Sync '${syncDate.toISOString()}'`;
		}

		if (this.datasetNextTime) {
			const nextDate = new Date(this.datasetNextTime);
			logLine = `${logLine}; Next '${nextDate.toISOString()}'`;
		}

		Bot.log(logLine);
	}

	updateDataset (
		_: ChartCandleData,
	) {
		let finalData: ChartCandleData | undefined = this.dataset;

		// Require OHLC
		// TODO: try/catch
		if (!_.open || !_.high || !_.low || !_.close)
			return Bot.log(`Incomplete OHLC dataset`, Log.Warn);

		// Update existing dataset
		if (
			finalData
			&& this.datasetEndTime
		) {

			// Get the index of `datasetEndTime` in current dataset
			let datasetEndTimeIndex: number = 0;
			if (this.dataset?.hasOwnProperty(this.datasetTimeField)) {
				datasetEndTimeIndex = this.dataset[this.datasetTimeField].lastIndexOf(this.datasetEndTime / 1000);

				// Index not found, default to end of dataset
				if (datasetEndTimeIndex < 0)
					datasetEndTimeIndex = this.dataset[this.datasetTimeField].length - 1;
			}

			Bot.log(
				`Chart '${this.name}'; updateDataset; datasetEndTimeIndex: ${datasetEndTimeIndex}`,
				Log.Verbose
			);

			let datasetOffset = datasetEndTimeIndex;


			// Get the index of `datasetEndTime` in new dataset
			let dataEndTimeIndex: number = _[this.datasetTimeField].lastIndexOf(this.datasetEndTime / 1000);

			// Index not found, default to start of new dataset
			if (dataEndTimeIndex < 0) {
				dataEndTimeIndex = 0;
				datasetOffset++;

				const datasetEndDate = new Date(this.datasetEndTime);
				Bot.log(
					`Chart '${this.name}'; updateDataset; Possible missing delta. Appending received dataset, as it does not include the last known dataset candle '${datasetEndDate.toISOString()}'`,
					Log.Warn
				);
			}

			Bot.log(
				`Chart '${this.name}'; updateDataset; dataEndTimeIndex: ${dataEndTimeIndex}`,
				Log.Verbose
			);

			// Merge new dataset, into exisiting, using the offsets of `datasetEndTime`
			for (
				let i = dataEndTimeIndex;
				i < _[this.datasetTimeField].length;
				i++
			) {
				for (let j in chartCandleFields) {
					let field = chartCandleFields[j];
					if (
						_.hasOwnProperty(field)
						&& _[field][i]
						&& finalData[field]
					) {
						let logLine = `Chart '${this.name}'; updateDataset; Mapping 'finalData[${field}][${datasetOffset}] = new[${field}][${i}]'`;

						if (finalData[field][datasetOffset]) {
							logLine = `${logLine}; From '${finalData[field][datasetOffset]}'`;
						}

						logLine = `${logLine}; To '${_[field][i]}'`;

						Bot.log(
							logLine,
							Log.Verbose
						);

						finalData[field][datasetOffset] = _[field][i];
					}
				}

				datasetOffset++;
			}
		}
		
		// Replace dataset with new data
		else
			finalData = _;

		this.dataset = finalData;
		this.datasetUpdateTime = Date.now();
	}
}

export const Chart = {
	new (
		_: ChartData,
	): ChartItem {
		let item = new ChartItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid) as ChartItem;
	}
};
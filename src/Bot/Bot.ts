import { ChartItem } from "./Chart";
import { TimeframeItem } from "./Timeframe";

const redis = require('redis');

const fs = require('fs');

/**
 * Logging levels
 */
export enum Log {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Err = 4,
}

/**
 * Event types
 */
export enum BotEvent {
	TimeframeResult = 100,
}

export type BotSubscribeCallbackData = (
	subscribe: BotSubscribeData,
) => void;

/**
 * Event subscriber data
 */
export type BotSubscribeData = {
	action: BotSubscribeCallbackData,
	condition: Array<[string, string, string]>,
	chart: ChartItem,
	name?: string,
	timeframeAny?: TimeframeItem[],
	timeframeTotal?: TimeframeItem[],
};

export type BotSubscribeConditionData = {
	valueA: string,
	valueAReal: number,
	operator: string,
	valueB: string | number,
	valueBReal: number,
};

export type BotSignalData = {
	high: number,
	low: number,
	total: number,
};

export type BotDespatchData = {
	event: BotEvent,
	uuid: string,
};

/**
 * Basic item structure, everything must have its own UUID
 */
 export type ItemBaseData = {
	name?: string,
	uuid: string,
}

export type BotData = {
	 subscriber: Array<BotSubscribeData>,
	 item: object[],
	 itemIndex: string[],
	 log: (
		string: string,
		level?: Log,
	 ) => void,
	 getItem: (
		uuid: string,
	 ) => Promise<any>,
	 setItem: (
		data: ItemBaseData,
	 ) => Promise<string>,
	 subscribe: (
		data: BotSubscribeData,
	 ) => void,
	 despatch: (
		data: BotDespatchData,
	 ) => void,
};

export const Bot: BotData = {

	/**
	 * Event subscribers
	 */
	subscriber: [],

	/**
	 * Legacy item storage
	 */
	item: [],

	/**
	 * Legacy item storage index
	 */
	itemIndex: [],

	/**
	 * Logging interface
	 * 
	 * @param string 
	 * @param level 
	 */
	log (
		string: string,
		level?: Log,
	) {
		let now = new Date();

		if (process.env.BOT_LOG_STDOUT && process.env.BOT_LOG_STDOUT === '1') {
			let consoleString = `${now.toISOString()}: ${string}`;

			if (level === Log.Err)
				console.error(consoleString);
			else if (level === Log.Warn)
				console.warn(consoleString);
			else if (level === Log.Debug)
				console.debug(consoleString);
			else
				console.log(consoleString);
		}

		if (process.env.BOT_LOG_FILE && process.env.BOT_LOG_FILE === '1') {
			let levelValue;
			if (level === Log.Err)
				levelValue = 'E';
			else if (level === Log.Warn)
				levelValue = 'W';
			else if (level === Log.Debug)
				levelValue = 'D';
			else
				levelValue = 'I';

			let consoleString = `${now.toISOString()}: ${levelValue}; ${string}`;

			const pad = (value: number) =>
				value.toString().length == 1
				? `0${value}`
				: value;

			let filenameParts = [
				now.getUTCFullYear(),
				pad(now.getUTCMonth() + 1),
				pad(now.getUTCDate()),
			];

			let filename = filenameParts.join('-');
			
			fs.appendFile(
				`./storage/log/${filename}.log`,
				`${consoleString}\n`,
				() => {
					// console.info(`APPEND: ./storage/log/${filename}.log`)
				}
			);
		}
	},

	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} uuid 
	 * @returns {object | false}
	 */
	async getItem (
		uuid: string,
	): Promise<string> {
		// let index = this.itemIndex.findIndex((_uuid : string) => _uuid === uuid);

		// if (index >= 0)
		// 	return this.item[index];
		// return false;
		let client: any = redis.createClient({
			// host: '127.0.0.1',
			// port: 6379,
		});
		return new Promise((resolve, reject) => {
			client.get(uuid, (err: any, result: any) => {
				if (err) return reject(err);
				resolve(JSON.parse(result));
			});
		});
	},

	/**
	 * Add or replace an exisiting item in general storage
	 * @todo Allow for different storage interfaces
	 * 
	 * @param {object} data - Base item strcuture for storage
	 * @returns {string} The items UUID
	 */
	async setItem (
		data: ItemBaseData,
	): Promise<string> {
		return new Promise((resolve, reject) => {
			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === data.uuid);

			// Reset existing item
			if (index >= 0)
				this.item[index] = data;
			
			// Store new item
			else {
				// let newIndex = this.item.length;
				this.item.push(data);
				this.itemIndex.push(data.uuid);
			}

			// return data.uuid;
			let client: any = redis.createClient({
				// host: '127.0.0.1',
				// port: 6379,
			});
			client.set(data.uuid, JSON.stringify(data), (err: any, result: any) => {
			if (err) return reject(err);
				resolve(result);
			});
		});
	},

	/**
	 * Event subscriber
	 * 
	 * @param data 
	 */
	subscribe (
		data: BotSubscribeData,
	) {
		this.subscriber.push(data);
	},

	/**
	 * Despatcher for event subscribers
	 * 
	 * @param data 
	 */
	despatch (
		data: BotDespatchData,
	) {
		// Bot.log(`Bot.despatch()`);
		// Bot.log(`event: ${data.event}`);
		// Bot.log(`uuid: ${data.uuid}`);

		switch (data.event) {

			/**
			 * A `Timeframe` has finished an iteration
			 */
			case BotEvent.TimeframeResult : {
				Object.entries(this.subscriber).forEach(function([
					key,
					val
				]: [
					string,
					BotSubscribeData
				]) {
					let index = val.timeframeAny?.findIndex(timeframe => timeframe.uuid === data.uuid);
					if (typeof index !== 'undefined' && index >= 0) {
						let timeField: string = '';

						if (val.chart.dataset?.hasOwnProperty('openTime'))
							timeField = 'openTime';
						else if (val.chart.dataset?.hasOwnProperty('closeTime'))
							timeField = 'closeTime';

						let signalResult: BotSignalData = {
							high: 0,
							low: 0,
							total: 0,
						};

						let signal: number[] = [];

						/**
						 * Aggregated results from any of the listed `Timeframe`
						 */
						if (val.timeframeAny?.length) {

							// Process timeframes
							for (let i = 0; i < val.timeframeAny.length; i++) {
								let timeframe = val.timeframeAny[i];

								for (let j = 0; j < timeframe.result.length; j++) {
									let result: any = timeframe.result[j];

									if (result?.length) {
										signal.push(result.length);
									}
								}
							}

							signalResult.high = Math.max(...signal);
							signalResult.low = Math.min(...signal);
							signalResult.total = signal.reduce(function (x, y) {
								return x + y;
							}, 0);
							
							// timeframeResult.push(result);

							Bot.log(`signalHigh: ${signalResult.high}, signalLow: ${signalResult.low}, signalTotal: ${signalResult.total}`);
						}

						let conditionMatch: Array<BotSubscribeConditionData> = [];

						let valueA: string;
						let valueAReal: number;
						let operator: string;
						let valueB: string;
						let valueBReal: number;

						for (let i = 0; i < val.condition.length; i++) {
							valueA = val.condition[i][0];
							operator = val.condition[i][1];
							valueB = val.condition[i][2];

							valueAReal = signalResult[valueA as keyof BotSignalData] ?? valueA;
							valueBReal = signalResult[valueB as keyof BotSignalData] ?? valueB;

							// Bot.log({
							// 	valueA: valueA,
							// 	valueAReal: valueAReal,
							// 	operator: operator,
							// 	valueB: valueB,
							// 	valueBReal: valueBReal,
							// });

							if (valueAReal) {
								switch (operator) {
									case '<': {
										if (valueAReal < valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
									case '<=': {
										if (valueAReal <= valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
		
									case '>': {
										if (valueAReal > valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
		
									case '>=': {
										if (valueAReal >= valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
		
									case '==': {
										if (valueAReal == valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
		
									case '!=': {
										if (valueAReal != valueBReal) {
											conditionMatch.push({
												valueA: valueA,
												valueAReal: valueAReal,
												operator: operator,
												valueB: valueB,
												valueBReal: valueBReal,
											});
										}
										break;
									}
								}
							}
						}

						// All conditions within the set, match on timeframe(s)
						if (
							conditionMatch.length === val.condition.length
							&& val.timeframeAny?.[index]
						) {
							Bot.log(`Timeframe '${val.timeframeAny?.[index].uuid}' triggered subscription callback (signalHigh: ${signalResult.high}, signalLow: ${signalResult.low}, signalTotal: ${signalResult.total}): ${val.name}`);
							
							// Callback action for subscriber, pass the `BotSubscribeData` data
							val.action(
								val
							);
						}
					}
				});

				break;
			}
		}
	}
};
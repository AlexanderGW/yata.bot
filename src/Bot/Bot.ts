import { ChartItem } from "./Chart";
import { TimeframeItem } from "./Timeframe";

const fs = require('fs');

/**
 * Logging levels
 */
export enum Log {
	Info = 0,
	Warn = 1,
	Err = 2,
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

export type BotEventData = {
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
	 ) => any,
	 setItem: (
		data: ItemBaseData,
	 ) => string,
	 subscribe: (
		data: BotSubscribeData,
	 ) => void,
	 despatch: (
		data: BotEventData,
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
			else
				console.log(consoleString);
		}

		if (process.env.BOT_LOG_FILE && process.env.BOT_LOG_FILE === '1') {
			let levelValue;
			if (level === Log.Err)
				levelValue = 2;
			else if (level === Log.Warn)
				levelValue = 1;
			else
				levelValue = 0;

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
	getItem (
		uuid: string,
	): any {
		let index = this.itemIndex.findIndex((_uuid : string) => _uuid === uuid);

		if (index >= 0)
			return this.item[index];
		return false;
	},

	/**
	 * Add or replace an exisiting item in general storage
	 * @todo Allow for different storage interfaces
	 * 
	 * @param {object} data - Base item strcuture for storage
	 * @returns {string} The items UUID
	 */
	setItem (
		data: ItemBaseData,
	): string {
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

		return data.uuid;
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
		data: BotEventData,
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
					// Bot.log(`subscriberIndex: ${key}`);
					// Bot.log(`${val.timeframeAny[0].uuid}`);
					// Bot.log(typeof val.timeframeAny);

					let index = val.timeframeAny?.findIndex(timeframe => timeframe.uuid === data.uuid);
					if (index && index >= 0) {
						let timeField: string = '';

						if (val.chart.dataset?.hasOwnProperty('openTime'))
							timeField = 'openTime';
						else if (val.chart.dataset?.hasOwnProperty('closeTime'))
							timeField = 'closeTime';

						// Bot.log(`subscriberTimeframeIndex: ${index}`);

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

							// Bot.log(`timeframeCount: ${val.timeframeAny.length}`);

							// Process timeframes
							for (let i = 0; i < val.timeframeAny.length; i++) {
								let timeframe = val.timeframeAny[i];
								// Bot.log(`Timeframe '${timeframe.uuid}'`);

								// Bot.log(`timeframeResultCount: ${timeframe.result.length}`);

								for (let j = 0; j < timeframe.result.length; j++) {
									let result: any = timeframe.result[j];
									// let uuid = timeframe.resultIndex[j];
									// Bot.log(`Strategy (${j}) '${uuid}'`);
									// Bot.log(`result.length: ${result?.length}`);

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
						if (conditionMatch.length === val.condition.length) {
							Bot.log(`Subscription triggered (condition match) callback: ${val.name}`);
							
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
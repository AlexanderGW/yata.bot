import { ChartItem } from "./Chart";
import { Subscription, SubscriptionActionCallbackModule, SubscriptionCallbackData, SubscriptionData } from "./Subscription";
import { TimeframeItem } from "./Timeframe";

const fs = require('fs');

/**
 * Logging levels
 */
export enum Log {
	Verbose = 0,
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
	item: object[],
	itemIndex: string[],
	itemNameIndex: string[],
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
	despatch: (
		data: BotDespatchData,
	) => void,
};

export const Bot: BotData = {

	/**
	 * Legacy item storage
	 */
	item: [],

	/**
	 * Legacy item storage index
	 */
	itemIndex: [],

	/**
	 * Legacy item storage name
	 */
	itemNameIndex: [],

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

		// Skip verbose messages if not required
		if (
			level === Log.Verbose
			&& !process.env.BOT_VERBOSE
			&& process.env.BOT_VERBOSE !== '1'
		)
			return true;

		// Handle console logging
		if (
			!process.env.BOT_LOG_STDOUT
			&& process.env.BOT_LOG_STDOUT !== '1'
		) {
			let consoleString = `${now.toISOString()}: ${string}`;

			if (level === Log.Err)
				console.error(`\x1b[31m ${consoleString}\x1b[0m`);
			else if (level === Log.Warn)
				console.warn(`\x1b[33m ${consoleString}\x1b[0m`);
			else if (level === Log.Verbose)
				console.debug(`\x1b[36m ${consoleString}\x1b[0m`);
			else
				console.info(`\x1b[32m ${consoleString}\x1b[0m`);
		}

		// Handle file logging
		if (
			process.env.BOT_LOG_FILE
			&& process.env.BOT_LOG_FILE === '1'
		) {
			let levelValue;
			if (level === Log.Err)
				levelValue = 'E';
			else if (level === Log.Warn)
				levelValue = 'W';
			else if (level === Log.Verbose)
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
			
			const logPath = `./storage/log/${filename}.log`;
			fs.appendFile(
				logPath,
				`${consoleString}\n`,
				() => {
					// if (process.env.BOT_VERBOSE === '1')
					// 	console.debug(`\x1b[36m APPEND LOG FILE: ${logPath}\x1b[0m`)
				}
			);
		}
	},

	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} identifier 
	 * @returns {object | false}
	 */
	getItem (
		identifier: string,
	): any {
		let index: number = 0;

		// Lookup `uuid`
		index = this.itemIndex.findIndex((x: string) => x === identifier);
		if (index >= 0)
			return this.item[index];

		// Lookup `name`
		index = this.itemNameIndex.findIndex((x: string) => x === identifier);
		if (index >= 0)
			return this.item[index];

		return false;
	},

	/**
	 * Add or replace an existing item in general storage
	 * @todo Allow for different storage interfaces
	 * 
	 * @param {object} data - Base item strcuture for storage
	 * @returns {string} The items UUID
	 */
	setItem (
		data: ItemBaseData,
	): string {
		let index: number = 0;

		// Lookup existing item by `uuid`, for overwrite
		index = this.itemIndex.findIndex((x: string) => x === data.uuid);
		
		// Item `name` based overwriting (if enabled)
		if (
			process.env.BOT_ITEM_NAME_OVERWRITE
			&& process.env.BOT_ITEM_NAME_OVERWRITE === '1'
			&& index < 0
		)
			index = this.itemNameIndex.findIndex((x: string) => x === data.name);

		// Reset existing item
		if (index >= 0)
			this.item[index] = data;
		
		// Store new item
		else {
			// let newIndex = this.item.length;
			
			// The `name` is optional, fallback to `uuid` if not set
			if (!data.hasOwnProperty('name') || !data.name?.length)
				data.name = data.uuid;

			this.item.push(data);
			this.itemIndex.push(data.uuid);
			this.itemNameIndex.push(data.name);
		}

		return data.uuid;
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
		// Bot.log(`uuid: ${data.name}`);

		switch (data.event) {

			/**
			 * A `Timeframe` has finished an iteration
			 */
			case BotEvent.TimeframeResult : {
				for (let i in Subscription.item) {
					const item = Subscription.item[i];

					let index = item.timeframeAny?.findIndex(timeframe => timeframe.uuid === data.uuid);
					if (typeof index !== 'undefined' && index >= 0) {
						let timeField: string = '';
						if (item.chart.dataset?.hasOwnProperty('openTime'))
							timeField = 'openTime';
						else if (item.chart.dataset?.hasOwnProperty('closeTime'))
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
						if (item.timeframeAny?.length) {

							// Process timeframes
							for (let i = 0; i < item.timeframeAny.length; i++) {
								let timeframe = item.timeframeAny[i];

								for (let j = 0; j < timeframe.result.length; j++) {
									let result: any = timeframe.result[j];

									if (result?.length) {
										signal.push(result.length);
									}
								}
							}

							if (signal.length) {
								signalResult.high = Math.max(...signal);
								signalResult.low = Math.min(...signal);
								signalResult.total = signal.reduce(function (x, y) {
									return x + y;
								}, 0);
							}

							Bot.log(`Subscription '${item.name}'; signalHigh: ${signalResult.high}, signalLow: ${signalResult.low}, signalTotal: ${signalResult.total}`, Log.Verbose);
						}

						let conditionMatch: Array<BotSubscribeConditionData> = [];

						let valueA: string;
						let valueAReal: number;
						let operator: string;
						let valueB: string;
						let valueBReal: number;

						for (let i = 0; i < item.condition.length; i++) {
							valueA = item.condition[i][0];
							operator = item.condition[i][1];
							valueB = item.condition[i][2];

							valueAReal = signalResult[valueA as keyof BotSignalData] ?? valueA;
							valueBReal = signalResult[valueB as keyof BotSignalData] ?? valueB;

							if (valueAReal) {
								let match = false;
								switch (operator) {
									case '<': {
										if (valueAReal < valueBReal)
											match = true;
										break;
									}
									case '<=': {
										if (valueAReal <= valueBReal)
											match = true;
										break;
									}
		
									case '>': {
										if (valueAReal > valueBReal)
											match = true;
										break;
									}
		
									case '>=': {
										if (valueAReal >= valueBReal)
											match = true;
										break;
									}
		
									case '==': {
										if (valueAReal == valueBReal)
											match = true;
										break;
									}
		
									case '!=': {
										if (valueAReal != valueBReal)
											match = true;
										break;
									}
								}

								if (match) {
									// Bot.log({
									// 	valueA: valueA,
									// 	valueAReal: valueAReal,
									// 	operator: operator,
									// 	valueB: valueB,
									// 	valueBReal: valueBReal,
									// });

									conditionMatch.push({
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
							}
						}

						// All conditions within the set, match on timeframe(s)
						if (
							conditionMatch.length === item.condition.length
							&& item.timeframeAny?.[index]
						) {
							Bot.log(`Timeframe '${item.timeframeAny?.[index].name}'; Triggered subscription '${item.name}'`);
							
							if (item.playbook) {

								// Playbook action module callback
								if (item.action) {

									// Import module
									let importPath = `../../playbook/${item.playbook}/${item.playbook}.ts`;
									import(importPath).then((module: SubscriptionActionCallbackModule) => {
										if (!item.action || !module.hasOwnProperty(item.action))
											throw (`Subscription action callback not found, or invalid.`);
				
										// Execute imported subscription callback on module
										try {
											module[item.action](
												item
											);
										} catch (err) {
											throw (`Failed to execute subscription action '${item.action}' callback.`);
										}
									}).catch(err => Bot.log(err.message, Log.Err));
								}
							}

							// Executer callback
							if (item.actionCallback) {
								item.actionCallback(item);
							}
						}
					}
				}

				break;
			}
		}
	}
};
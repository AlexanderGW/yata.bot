import { v4 as uuidv4 } from 'uuid';
import { Bot, BotStateTimeframeType, BotStateType, Log } from './Bot';
import { ChartCandleData, ChartItem } from './Chart';
import { OrderItem } from './Order';
import { StrategyItem } from "./Strategy";
import { TimeframeItem } from './Timeframe';

/**
 * Event types
 */
export enum SubscriptionEvent {
	TimeframeResult = 100,
}

export type SubscriptionConditionData = {
	valueA: string,
	valueAReal: number,
	operator: string,
	valueB: string | number,
	valueBReal: number,
};

export type SubscriptionSignalData = {
	[index: string]: number,
	eventHigh: number,
	eventLow: number,
	eventTotal: number,
	newHigh: number,
	newLow: number,
	newTotal: number,
	totalHigh: number,
	totalLow: number,
	total: number,
};

export type SubscriptionDespatchData = {
	event: SubscriptionEvent,
	lastState: BotStateTimeframeType,
	timeframe: TimeframeItem,
};

export type SubscriptionActionCallbackModule = {
	[index: string]: SubscriptionCallbackData
};

export type SubscriptionCallbackData = (
	subscription: SubscriptionData,
) => Promise<void>;

export type SubscriptionData = {
	action?: string,
	actionCallback?: SubscriptionCallbackData,
	condition: Array<[string, string, string]>,
	chart: ChartItem,
	match?: string,
	name?: string,
	playbook?: string,
	timeframeAny?: TimeframeItem[],
	timeframeTotal?: TimeframeItem[],
	uuid?: string,
}

export type SubscriptionInterface = {
	item: SubscriptionItem[],
	itemIndex: string[],
	despatch: (
		data: SubscriptionDespatchData,
	) => void,
	new: (
		data: SubscriptionData,
	) => void,
};

export class SubscriptionItem implements SubscriptionData {
	action?: string;
	actionCallback?: SubscriptionCallbackData;
	condition: Array<[string, string, string]>;
	chart: ChartItem;
	name?: string;
	match: string = 'new';
	playbook?: string;
	timeframeAny?: TimeframeItem[];
	timeframeTotal?: TimeframeItem[];
	uuid: string;

	constructor(
		data: SubscriptionData,
	) {
		if (data.action)
			this.action = data.action;
		if (data.actionCallback)
			this.actionCallback = data.actionCallback;
		this.condition = data.condition;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		if (data.match)
			this.match = data.match;
		if (data.playbook)
			this.playbook = data.playbook;
		if (data.timeframeAny)
			this.timeframeAny = data.timeframeAny;
		if (data.timeframeTotal)
			this.timeframeTotal = data.timeframeTotal;
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Subscription: SubscriptionInterface = {

	/**
	 * Legacy item storage
	 */
	item: [],

	/**
	 * Legacy item storage index
	 */
	itemIndex: [],

	despatch(
		data: SubscriptionDespatchData,
	): void {
		switch (data.event) {

			/**
			 * A `Timeframe` has finished with results
			 */
			case SubscriptionEvent.TimeframeResult: {
				for (let i in Subscription.item) {
					const item = Subscription.item[i];

					if (!item.timeframeAny)
						continue;

					let index = item.timeframeAny.findIndex(timeframe => timeframe.uuid === data.timeframe.uuid);
					// console.log(`index: ${index}`);
					if (index < 0)
						continue;

					let signalResult: SubscriptionSignalData = {
						eventHigh: 0,
						eventLow: 0,
						eventTotal: 0,
						newHigh: 0,
						newLow: 0,
						newTotal: 0,
						totalHigh: 0,
						totalLow: 0,
						total: 0,
					};

					let newSignal: number[] = [];
					let eventSignal: number[] = [];
					let totalSignal: number[] = [];

					// Collect timeframe results
					for (let j = 0; j < item.timeframeAny.length; j++) {
						let timeframe: TimeframeItem = item.timeframeAny[j];
						let timeframeSignal: any = [];

						let eventTimeframe = (timeframe.uuid === data.timeframe.uuid);

						for (let k = 0; k < timeframe.result.length; k++) {
							let result: any = timeframe.result[k];
							if (!result?.length)
								continue;
							
							totalSignal.push(result.length);

							// The timeframe that triggered the despatch
							if (eventTimeframe) {
								eventSignal.push(result.length);

								// Log the last candle datapoint time field, of each matching scenario
								for (let l = 0; l <= result.length; l++) {
									if (!result[l])
										continue;

									// TODO: Walk all strategies within timeframe
									const latestCandle = result[l].length - 1;
									const datapoint = result[l][latestCandle][0].datapoint;
									const timeField = timeframe.strategy[0].chart.datasetTimeField;
									if (timeframe.strategy[0].chart.dataset?.[timeField].hasOwnProperty(datapoint)) {
										// console.log(strategy.chart.dataset?[timeField][datapoint]);
										timeframeSignal.push(timeframe.strategy[0].chart.dataset?.[timeField][datapoint]);
									}
								}
							}
						}

						// Test for new results
						if (
							timeframeSignal.length
							&& data.lastState
						) {
							let index = data.lastState.resultIndex.findIndex(_name => _name === timeframe.name);
							// console.log(`index: ${index}`);
							if (index >= 0) {
								// console.log(`data.lastState.result[index]`);
								// console.log(data.lastState.result[index]);

								// console.log(`timeframeSignal`);
								// console.log(timeframeSignal);

								// Count number of current state results, not in last state
								let count = 0;
								for (let k = 0; k < timeframeSignal.length; k++) {
									if (data.lastState.result[index].indexOf(timeframeSignal[k]) < 0)
										count++;
								}

								if (count)
									newSignal.push(count);
							}
						}
					}

					if (eventSignal.length) {
						signalResult.eventHigh = Math.max(...eventSignal);
						signalResult.eventLow = Math.min(...eventSignal);
						signalResult.eventTotal = eventSignal.reduce(function (x, y) {
							return x + y;
						}, 0);
					}

					// This subscription only wants `new` signals
					if (!newSignal.length && item.match === 'new')
						return;

					if (newSignal.length) {
						signalResult.newHigh = Math.max(...newSignal);
						signalResult.newLow = Math.min(...newSignal);
						signalResult.newTotal = newSignal.reduce(function (x, y) {
							return x + y;
						}, 0);
					}

					if (totalSignal.length) {
						signalResult.totalHigh = Math.max(...totalSignal);
						signalResult.totalLow = Math.min(...totalSignal);
						signalResult.total = totalSignal.reduce(function (x, y) {
							return x + y;
						}, 0);
					}

					// Log signal information
					let logItem = [
						`Subscription '${item.name}'`,
					];
					for (let x in signalResult) {
						if (signalResult[x])
							logItem.push(` ${x} '${signalResult[x]}'`);
					}
					if (logItem.length > 1)
						Bot.log(
							logItem.join(';'),
							Log.Verbose
						);

					let conditionMatch: Array<SubscriptionConditionData> = [];

					let valueA: string;
					let valueAReal: number;
					let operator: string;
					let valueB: string;
					let valueBReal: number;

					for (let j = 0; j < item.condition.length; j++) {
						valueA = item.condition[j][0];
						operator = item.condition[j][1];
						valueB = item.condition[j][2];

						valueAReal = signalResult[valueA as keyof SubscriptionSignalData] ?? valueA;
						valueBReal = signalResult[valueB as keyof SubscriptionSignalData] ?? valueB;

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

						// Execute callback
						if (item.actionCallback) {
							item.actionCallback(item);
						}
					}
				}

				break;
			}

			default: {
				Bot.log(`Unknown subscription event '${data.event}'`, Log.Warn);
			}
		}
	},

	new(
		data: SubscriptionData,
	): SubscriptionItem {
		let item = new SubscriptionItem(data);
		let uuid = Bot.setItem(item);

		this.item.push(item);
		this.itemIndex.push(uuid);

		return Bot.getItem(uuid);
	}
};
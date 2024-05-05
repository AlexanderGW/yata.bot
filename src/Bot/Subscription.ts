import { v4 as uuidv4 } from 'uuid';
import { Bot, BotStateDataIndexType, BotStateType, Log } from './Bot';
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
	high: number,
	low: number,
	new: number,
	total: number,
};

export type SubscriptionDespatchData = {
	event: SubscriptionEvent,
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
		_: SubscriptionDespatchData,
	) => Promise<void>,
	new: (
		_: SubscriptionData,
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
		_: SubscriptionData,
	) {
		if (_.action)
			this.action = _.action;
		if (_.actionCallback)
			this.actionCallback = _.actionCallback;
		this.condition = _.condition;
		this.chart = _.chart;
		if (_.name)
			this.name = _.name;
		if (_.match)
			this.match = _.match;
		if (_.playbook)
			this.playbook = _.playbook;
		if (_.timeframeAny)
			this.timeframeAny = _.timeframeAny;
		if (_.timeframeTotal)
			this.timeframeTotal = _.timeframeTotal;
		this.uuid = _.uuid ?? uuidv4();
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

	async despatch (
		_: SubscriptionDespatchData,
	): Promise<void> {
		switch (_.event) {

			/**
			 * A `Timeframe` has finished with results
			 */
			case SubscriptionEvent.TimeframeResult: {
				for (let i in Subscription.item) {
					const item = Subscription.item[i];

					if (!item.timeframeAny)
						continue;

					let index = item.timeframeAny.findIndex(timeframe => timeframe.uuid === _.timeframe.uuid);
					// console.log(`index: ${index}`);
					if (index < 0)
						continue;

					let signalResult: SubscriptionSignalData = {
						high: 0,
						low: 0,
						new: 0,
						total: 0,
					};

					let newSignal: number = 0;
					let eventSignal: number[] = [];
					let totalSignal: number[] = [];

					// Collect timeframe results
					for (let j = 0; j < item.timeframeAny.length; j++) {
						let timeframe: TimeframeItem = item.timeframeAny[j];
						let timeframeSignal: any = [];

						let eventTimeframe = (timeframe.uuid === _.timeframe.uuid);

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

									const strategy: StrategyItem = Bot.getItem(timeframe.resultIndex[k]) as StrategyItem;
									
									const latestCandle = result[l].length - 1;
									const datapoint = result[l][latestCandle][0].datapoint;
									const timeField = strategy.chart.datasetTimeField;
									if (strategy.chart.dataset?.[timeField].hasOwnProperty(datapoint)) {
										// console.log(strategy.chart.dataset?[timeField][datapoint]);
										timeframeSignal.push(strategy.chart.dataset?.[timeField][datapoint]);
									}
								}
							}
						}

						// Test for new results
						if (
							timeframeSignal.length
							&& Bot.playbook?.lastState?.timeframeIndex
						) {
							let index = Bot.playbook.lastState.timeframeIndex.findIndex(_name => _name === timeframe.name);
							if (index >= 0) {

								// Count number of current state results, not in last state
								for (let k = 0; k < timeframeSignal.length; k++) {
									if (Bot.playbook.lastState.timeframe[index].indexOf(timeframeSignal[k]) < 0)
										newSignal++;
								}
							}
						}
					}

					// This subscription only wants `new` signals
					if (newSignal === 0 && item.match === 'new')
						return;

					signalResult.new = newSignal;

					if (totalSignal.length) {
						signalResult.high = Math.max(...totalSignal);
						signalResult.low = Math.min(...totalSignal);
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
							let matched = false;

							switch (operator) {
								case '<':
									matched = (valueAReal < valueBReal)
								case '<=':
									matched = (valueAReal <= valueBReal)
									break;
								case '>':
									matched = (valueAReal > valueBReal)
									break;
								case '>=':
									matched = (valueAReal >= valueBReal)
									break;
								case '==':
									matched = (valueAReal == valueBReal)
									break;
								case '!=':
									matched = (valueAReal != valueBReal)
									break;
							}

							if (matched) {
								const matchData: SubscriptionConditionData = {
									valueA: valueA,
									valueAReal: valueAReal,
									operator: operator,
									valueB: valueB,
									valueBReal: valueBReal,
								};
								conditionMatch.push(matchData);
							}
						}
					}

					// All conditions within the set, match on timeframe(s)
					if (
						conditionMatch.length === item.condition.length
						&& item.timeframeAny?.[index]
					) {
						Bot.log(`Timeframe '${item.timeframeAny?.[index].name}'; Triggered subscription '${item.name}'`);
						Bot.log(conditionMatch, Log.Verbose);

						// TODO: Refactor into `Playbook`?
						if (item.playbook) {

							// Playbook action module callback
							if (item.action) {

								// Import module
								let importPath = `../../playbook/${item.playbook}/${item.playbook}.ts`;

								await import(importPath).then((module: SubscriptionActionCallbackModule) => {
									if (!item.action || !module.hasOwnProperty(item.action))
										throw new Error(`Subscription action callback not found, or invalid.`);

									// Execute imported subscription callback on module
									try {
										module[item.action](
											item
										);
									} catch (error) {
										Bot.log(error, Log.Err);
										throw new Error(`Failed to execute subscription action '${item.action}' callback.`);
									}
								}).catch(error => Bot.log(error, Log.Err));
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
				Bot.log(`Unknown subscription event '${_.event}'`, Log.Warn);
			}
		}
	},

	new(
		_: SubscriptionData,
	): SubscriptionItem {
		let item = new SubscriptionItem(_);
		let uuid = Bot.setItem(item);

		this.item.push(item);
		this.itemIndex.push(uuid);

		return Bot.getItem(uuid) as SubscriptionItem;
	}
};
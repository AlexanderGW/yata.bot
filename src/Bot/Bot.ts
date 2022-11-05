import { ChartItem } from "./Chart";
import { TimeframeItem } from "./Timeframe";

enum Level {
	Info = 0,
	Warn = 1,
	Err = 2,
}

export enum BotEvent {
	TimeframeResult = 100,
}

export type BotSubscribeData = {
	action: CallableFunction,
	condition: Array<[string, string, string]>,
	chart: ChartItem,
	name?: string,
	timeframeAny?: TimeframeItem[],
	timeframeTotal?: TimeframeItem[],
};

export type BotEventData = {
	event: BotEvent,
	uuid: string,
};

export type ItemBaseData = {
	name?: string,
	uuid: string,
}

export const Bot = {
	subscriber: [],
	item: [],
	itemIndex: [],

	log (
		string: string,
		level?: Level,
	) {
		let now = new Date();
		let consoleString = `${now.toISOString()}: ${string}`;

		if (level === Level.Info)
			console.log(consoleString);
		else if (level === Level.Warn)
			console.warn(consoleString);
		else
			console.error(consoleString);
	},

	getItem (
		uuid: string,
	): any {
		let index = this.itemIndex.findIndex(_uuid => _uuid === uuid);

		if (index >= 0)
			return this.item[index];
		return false;
	},

	setItem (
		data: ItemBaseData,
	): string {
		let index = this.itemIndex.findIndex(_uuid => _uuid === data.uuid);

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

	subscribe (
		data: BotSubscribeData
	) {
		this.subscriber.push(data);
	},

	despatch (
		data: BotEventData
	) {
		// console.log(`Bot.despatch()`);
		// console.log(`event: ${data.event}`);
		// console.log(`uuid: ${data.uuid}`);

		switch (data.event) {
			case BotEvent.TimeframeResult : {
				Object.entries(this.subscriber).forEach(function([key, val]) {
					// console.log(`subscriberIndex: ${key}`);
					// console.log(`${val.timeframeAny[0].uuid}`);
					// console.log(typeof val.timeframeAny);

					let index = val.timeframeAny.findIndex(timeframe => timeframe.uuid === data.uuid);
					if (index >= 0) {
						let timeField: string = '';

						if (val.chart?.hasOwnProperty('openTime'))
							timeField = 'openTime';
						else if (val.chart?.hasOwnProperty('closeTime'))
							timeField = 'closeTime';

						// console.log(`subscriberTimeframeIndex: ${index}`);

						let signalResult = {
							high: 0,
							low: 0,
							total: 0,
						};

						let signal: number[] = [];

						if (val.timeframeAny?.length) {

							// console.log(`timeframeCount: ${val.timeframeAny.length}`);

							// Process timeframes
							for (let i = 0; i < val.timeframeAny.length; i++) {
								let timeframe = val.timeframeAny[i];
								// console.log(`Timeframe '${timeframe.uuid}'`);

								// console.log(`timeframeResultCount: ${timeframe.result.length}`);

								for (let j = 0; j < timeframe.result.length; j++) {
									let result = timeframe.result[j];
									let uuid = timeframe.resultIndex[j];
									// console.log(`Strategy (${j}) '${uuid}'`);
									// console.log(`result.length: ${result?.length}`);

									if (result?.length) {
										// console.info(`Strategy '${this.name}' scenario '${action[0].name}' analysis matches: ${signal.length}`);

										// console.log(`Leading data frame matches (by field: ${timeField.length ? timeField : 'index'})`);

										console.log(`signalCount: ${result.length}`);

										// let strategy = Strategy.getResult
										for (let k = 0; k < result.length; k++) {
											let latestCandle = result[k].length - 1;
											let matchFirstCond = result[k][latestCandle][0];
											let date = new Date(parseInt(val.chart[timeField][matchFirstCond.k]) * 1000);
											// resultTimes.push(date.toISOString());
											console.log(date.toISOString());
											
											// Output details on all matching scenario conditions
											// for (let l = 0; l < result[k].length; l++) {
											// 	console.log(result[k][l]);
											// }
										}

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

							// console.log(`signalHigh: ${signalResult.high}`);
							// console.log(`signalLow: ${signalResult.low}`);
							// console.log(`signalTotal: ${signalResult.total}`);
						}

						let conditionMatch: any = [];

						let valueA: string;
						let valueAReal: string;
						let operator: string;
						let valueB: string;
						let valueBReal: string;

						for (let i = 0; i < val.condition.length; i++) {
							valueA = val.condition[i][0];
							operator = val.condition[i][1];
							valueB = val.condition[i][2];

							valueAReal = signalResult[valueA] ?? valueA;
							valueBReal = signalResult[valueB] ?? valueB;

							// console.log({
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
							console.log(`Subscription match: ${val.name}`);
							
							// Callback action for subscriber
							val.action();
						}
					}
				});

				break;
			}
		}
	}
};
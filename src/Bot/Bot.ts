import { Chart } from "./Chart";
import { Timeframe, TimeframeData } from "./Timeframe";

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
	chart: Chart,
	name?: string,
	timeframeAny?: Timeframe[],
	timeframeTotal?: Timeframe[],
};

export type BotEventData = {
	event: BotEvent,
	uuid: string,
};

export const Bot = {
	subscriber: [],
	timeframe: [],
	timeframeIndex: [],

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

	getTimeframe (
		data: TimeframeData
	) {
		let index = this.timeframeIndex.findIndex(_uuid => _uuid === data.uuid);

		if (index >= 0)
			return this.timeframe[index];
		return false;
	},

	setTimeframe (
		data: TimeframeData
	) {
		let index = this.timeframeIndex.findIndex(_uuid => _uuid === data.uuid);

		// Reset existing timeframe
		if (index >= 0) {
			this.timeframe[index] = new Timeframe(data);

			return this.timeframe[index];
		}
		
		// Store new timeframe
		let newIndex = this.timeframe.length;
		this.timeframe.push(new Timeframe(data));
		this.timeframeIndex.push(data.uuid);

		return this.timeframe[newIndex];
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
				// console.log(``);

				// for (let i = 0; i < i; i++) {
				// 	let subscriber = this.subscriber[i];
				// 	if 
				// }

				// let signal = 0;

				Object.entries(this.subscriber).forEach(function([key, val]) {
					// console.log(`subscriberIndex: ${key}`);
					// console.log(`${val.timeframeAny[0].uuid}`);
					// console.log(typeof val.timeframeAny);

					let index = val.timeframeAny.findIndex(timeframe => timeframe.uuid === data.uuid);
					if (index >= 0) {
						let timeField: string = '';

						if (val.chart['openTime'])
							timeField = 'openTime';
						else if (val.chart['closeTime'])
							timeField = 'closeTime';

						// console.log(`subscriberTimeframeIndex: ${index}`);

						let signalResult = {
							high: 0,
							low: 0,
							total: 0,
						};

						let signal: number[] = [];

						if (val.timeframeAny.length) {

							// Process timeframes
							for (let i = 0; i < val.timeframeAny.length; i++) {
								let timeframe = val.timeframeAny[i];
								console.log(`Timeframe '${timeframe.uuid}'`);

								for (let j = 0; j < timeframe.result.length; j++) {
									let result = timeframe.result[i];
									let uuid = timeframe.resultIndex[i];
									// console.log(`Strategy (${j}) '${uuid}'`);
									// console.log(`result.length: ${result?.length}`);

									if (result?.length) {
										// console.info(`Strategy '${this.name}' scenario '${action[0].name}' analysis matches: ${signal.length}`);

										// console.log(`Leading data frame matches (by field: ${timeField.length ? timeField : 'index'})`);

										// console.log(`signalCount: ${result.length}`);

										// let strategy = Strategy.getResult
										for (let j = 0; j < result.length; j++) {
											let latestCandle = result[j].length - 1;
											let matchFirstCond = result[j][latestCandle][0];
											let date = new Date(parseInt(val.chart[timeField][matchFirstCond.k]) * 1000);
											// resultTimes.push(date.toISOString());
											console.log(date.toISOString());
											
											// Output details on all matching scenario conditions
											// for (let l = 0; l < result[j].length; l++) {
											// 	console.log(result[j][l]);
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

							console.log(`signalHigh: ${signalResult.high}`);
							console.log(`signalLow: ${signalResult.low}`);
							console.log(`signalTotal: ${signalResult.total}`);
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
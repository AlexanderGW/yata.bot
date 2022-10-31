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
		console.log(`Bot.despatch()`);
		console.log(`event: ${data.event}`);
		console.log(`uuid: ${data.uuid}`);

		switch (data.event) {
			case BotEvent.TimeframeResult : {
				console.log(``);

				// for (let i = 0; i < i; i++) {
				// 	let subscriber = this.subscriber[i];
				// 	if 
				// }

				Object.entries(this.subscriber).forEach(function([key, val]) {
					console.log(`subscriberKey: ${key}`);
					console.log(`${val.timeframeAny[0].uuid}`);

					let index = val.timeframeAny.findIndex(_uuid => _uuid === data.uuid);

					if (index >= 0) {
						console.log(`subscriberTimeframeMatch: ${index}`);

						if (val.timeframeAny.length) {
							for (let i = 0; i < val.timeframeAny.length; i++) {
								let timeframe = val.timeframeAny[i];

								for (let j = 0; j < timeframe.result.length; j++) {
									let result = timeframe.result[i];
									let uuid = timeframe.resultIndex[i];

									// if (result) {
									// 	// let strategy = Strategy.getResult
									// 	for (let j = 0; j < result.length; j++) {
									// 		let latestCandle = result[j].length - 1;
									// 		let matchFirstCond = result[j][latestCandle][0];
									// 		let date = new Date(parseInt(timeframe.strategy.chart[timeField][matchFirstCond.k]) * 1000);
									// 		// resultTimes.push(date.toISOString());
									// 		console.log(date.toISOString());
											
									// 		// Output details on all matching scenario conditions
									// 		for (let l = 0; l < result[j].length; l++) {
									// 			console.log(result[j][l]);
									// 		}
									// 	}
									// }
								}
							}
						}
					}
					
					// for (let j = 0; j < signal.length; j++) {
					// 	for (let k = 0; k < signal.length; k++) {
					// 		let latestCandle = signal[k].length - 1;
					// 		let matchFirstCond = signal[k][latestCandle][0];
					// 		let date = new Date(parseInt(this.chart[timeField][matchFirstCond.k]) * 1000);
					// 		// signalTimes.push(date.toISOString());
					// 		console.log(date.toISOString());
							
					// 		// Output details on all matching scenario conditions
					// 		// for (let l = 0; l < signal[k].length; l++) {
					// 		// 	console.log(signal[k][l]);
					// 		// }
					// 	}
					// }
				});

				break;
			}
		}
	}
};
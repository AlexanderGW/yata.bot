import { Chart } from "./Chart";
import { Timeframe } from "./Timeframe";

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
	subscribers: [],

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

	subscribe (
		data: BotSubscribeData
	) {
		this.subscribers.push(data);
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

				break;
			}
		}
	}
};
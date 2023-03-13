import { v4 as uuidv4 } from 'uuid';
import { Bot, BotEvent, Log } from './Bot';
import { ChartCandleData } from './Chart';
import { StrategyItem } from "./Strategy";

export type TimeframeData = {
	interval?: any,
	intervalTime?: number, // Milliseconds
	lastEndTime?: number, // Milliseconds
	lastStartTime?: number, // Milliseconds
	keepalive?: boolean,
	name?: string,
	pollTime?: number, // Milliseconds
	strategy: Array<StrategyItem>,
	uuid?: string,
	windowTime?: number, // Milliseconds
}

export class TimeframeItem implements TimeframeData {
	interval: any;
	intervalTime: number;
	keepalive: boolean;
	lastEndTime: number = 0;
	lastStartTime: number;
	name?: string;
	pollTime: number;
	result: object[] = [];
	resultIndex: string[] = [];
	strategy: Array<StrategyItem>;
	uuid: string;
	windowTime: number;

	constructor (
		data: TimeframeData,
	) {
		if (data.lastStartTime)
			this.lastStartTime = data.lastStartTime > 0 ? data.lastStartTime : 0;
		else
			this.lastStartTime = 0;
		this.interval = 0;
		if (data.intervalTime)
			this.intervalTime = data.intervalTime > 0 ? data.intervalTime : 60000;
		else
			this.intervalTime = 60000;
		if (data.hasOwnProperty('keepalive'))
			this.keepalive = data.keepalive ? true : false;
		else
			this.keepalive = true;
		if (data.name)
			this.name = data.name;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60000;
		else
			this.pollTime = 60000;
		this.strategy = data.strategy;
		this.uuid = data.uuid ?? uuidv4();
		if (data.windowTime)
			this.windowTime = data.windowTime > 0 ? data.windowTime : 900000;
		else
			this.windowTime = 900000;

		// Start the interval, if timeframe is marked as active
		if (this.keepalive === true) {
			setTimeout(
				function (timeframe) {
					timeframe.execute();
				},
				10,
				this
			);
			this.activate();
		}
	}

	activate () {
		this.keepalive = true;
		this.interval = setInterval(
			function (timeframe) {
				timeframe.execute();
			},
			this.intervalTime,
			this
		);
	}

	deactivate () {
		this.keepalive = false;
		clearInterval(this.interval);
	}

	/**
	 * Return (if exists) previously collected strategy results
	 * 
	 * @param strategy 
	 * @returns 
	 */
	getResult (
		strategy: StrategyItem
	) {
		let index = this.resultIndex.findIndex(_uuid => _uuid === strategy.uuid);

		if (index >= 0)
			return this.result[index];
		return false;
	}

	async execute () {
		if (!this.keepalive)
			Bot.log(`Timeframe '${this.name}'; Executed (interval: ${this.intervalTime}ms)`);

		const startTime = Date.now();

		if ((startTime - this.lastStartTime) < this.intervalTime)
			throw (`Timeframe '${this.name}'; Interval time has not yet passed`);

		// Clear result set for new execution
		this.result = [];
		this.resultIndex = [];

		Bot.log(`Timeframe '${this.name}'; Last run: ${this.lastStartTime} (time since: ${startTime - this.lastStartTime}ms)`, Log.Debug);

		// Callback testing
		// Bot.despatch({
		// 	event: BotEvent.TimeframeResult,
		// 	uuid: this.uuid,
		// });
		
		// Process strategies
		for (let i = 0; i < this.strategy.length; i++) {
			let strategy = this.strategy[i];

			// Request chart update, if over one second old, and past poll time
			if (
				(Date.now() - strategy.chart.lastUpdateTime) > 1000
				&& (startTime - strategy.chart.lastUpdateTime) >= strategy.chart.pollTime
			) {
				let fromTime: number = 0;

				// Sync from when the chart was last updated
				if (strategy.chart.lastUpdateTime > 0)
					fromTime = strategy.chart.lastUpdateTime;
				
				// Sync from start of the timeframe window
				else if (this.windowTime > 0)
					fromTime = Date.now() - this.windowTime;

				// Default to the last 50 candles
				else
					fromTime = Date.now() - (strategy.chart.candleTime * 50);

				let fromDate = new Date(fromTime);
				Bot.log(`Strategy '${strategy.uuid}'; Chart '${strategy.chart.uuid}'; Sync from: ${fromDate.toISOString()}`);

				// try {
				// 	await strategy.chart.pair.exchange.syncChart(
				// 		strategy.chart
				// 	);
				// } catch (err) {
				// 	Bot.log(err as string, Log.Err);
				// }

				// const fs = require('fs');

				// if (!fs.existsSync(playbookTemplate))
				// 	throw (`Playbook '${playbookName}' not found '${playbookTemplate}'`);

				

				// let response: any = fs.readFileSync(
				// 	'./storage/dataset/Kraken/ETHBTC/2023/03/13/Kraken-ETHBTC-2023-03-13-19-15-24.json',
				// 	'utf8',
				// 	function (
				// 		err: object,
				// 		data: object
				// 	) {
				// 		if (err)
				// 			console.error(err);
				// 	}
				// );
	
				// let responseJson = JSON.parse(response);
				// if (responseJson) {
				// 	strategy.chart.pair.exchange.refreshChart(
				// 		strategy.chart,
				// 		responseJson,
				// 	);
				// }
			}

			// Try strategy
			try {
				let signal = strategy.execute({
					windowTime: this.windowTime,
					timeframe: this,
				});

				// Duplicate strategy result set within this timeframe
				// if (this.getResult(strategy))
				// 	throw (`Timeframe '${this.name}', strategy '${strategy.name}' result duplication.`);

				this.result.push(signal);
				this.resultIndex.push(strategy.uuid);
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}

		// Send a despatch to indicate the timeframe has results.
		if (this.result.length) {
			Bot.despatch({
				event: BotEvent.TimeframeResult,
				uuid: this.uuid,
			});
		}

		this.lastEndTime = Date.now();
		this.lastStartTime = startTime;
	}
}

export const Timeframe = {
	new (
		data: TimeframeData,
	): TimeframeItem {
		let item = new TimeframeItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
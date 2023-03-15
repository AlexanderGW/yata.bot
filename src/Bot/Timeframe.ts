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
	interval: any = 0;
	intervalTime: number = 60000; // Sixty seconds
	keepalive: boolean = true;
	lastEndTime: number = 0;
	lastStartTime: number;
	name?: string;
	pollTime: number = 60000; // Sixty seconds
	result: object[] = [];
	resultIndex: string[] = [];
	strategy: Array<StrategyItem>;
	uuid: string;
	windowTime: number = 900000; // Fifteen minutes

	constructor (
		data: TimeframeData,
	) {
		if (data.lastStartTime)
			this.lastStartTime = data.lastStartTime > 0 ? data.lastStartTime : 0;
		else
			this.lastStartTime = 0;
		if (data.intervalTime && data.intervalTime >= 1000)
			this.intervalTime = data.intervalTime;
		if (data.hasOwnProperty('keepalive'))
			this.keepalive = data.keepalive ? true : false;
		if (data.name)
			this.name = data.name;
		if (data.pollTime && data.pollTime >= 1000)
			this.pollTime = data.pollTime;
		this.strategy = data.strategy;
		this.uuid = data.uuid ?? uuidv4();
		if (data.windowTime && data.windowTime >= 1000)
			this.windowTime = data.windowTime;
	}

	activate () {
		this.keepalive = true;
		this.interval = setInterval(
			async function (timeframe) {
				await timeframe.execute();
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
		const startTime = Date.now();

		let logLine = `Timeframe '${this.name}'; Executed; Interval '${this.intervalTime}ms'`;

		if (this.lastStartTime) {
			logLine = `${logLine}; Last run '${this.lastStartTime}'`;
			logLine = `${logLine}; Time since '${startTime - this.lastStartTime}ms''`;
		}

		Bot.log(logLine);

		// if ((startTime - this.lastStartTime) < this.intervalTime)
		// 	throw (`Timeframe '${this.name}'; Interval time has not yet passed`);

		// Clear result set for new execution
		this.result = [];
		this.resultIndex = [];
		
		// Process strategies
		for (let i = 0; i < this.strategy.length; i++) {
			let strategy = this.strategy[i];

			if (

				// If timeframe chart syncing is not disabled
				(!process.env.BOT_TIMEFRAME_CHART_SYNC || process.env.BOT_TIMEFRAME_CHART_SYNC === '1')

				// Chart is overdue `pollTime`
				&& (startTime - strategy.chart.datasetUpdateTime) >= strategy.chart.pollTime
			) {
				try {
					await strategy.chart.pair.exchange.syncChart(
						strategy.chart
					);
				} catch (err) {
					Bot.log(err as string, Log.Err);
				}
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
		Bot.log(`Timeframe '${this.name}'; Finished; Run time '${this.lastEndTime - startTime}ms'`);
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
/**
 * @name Tradebot (can't think of a name)
 * @author Alexander Gailey-White
 * @date 2024
 */

const fs = require('fs');

/**
 * Logging levels
 */
export enum Log {
	Err = 4,
	Info = 1,
	Warn = 2,
	Verbose = 0,
}

export type BotStateDataIndexType = {
	data: Array<any>,
	dataIndex: Array<string>,
};

export type BotStateType = {
	timeframe: BotStateDataIndexType,
	chart: BotStateDataIndexType,
	order: BotStateDataIndexType,
	updateTime: number,
};

/**
 * Basic item structure, everything must have its own UUID
 */
 export type 	ItemBaseData = {
	name?: string,
	uuid: string,
}

export type BotInitData = {
	dryrun?: boolean,
	backtest?: boolean,
};

export type BotData = {
	backtest: boolean,
	dryrun: boolean,
	initialized: boolean,
	item: object[],
	itemIndex: string[],
	itemNameIndex: string[],
	init: (
		_: BotInitData
	) => void,
	log: (
		input: unknown,
		level?: Log,
	) => void,
	getItem: (
		uuid: string,
	) => any,
	setItem: (
		_: ItemBaseData,
	) => string
};

export const Bot: BotData = {
	backtest: false,
	dryrun: true,
	initialized: false,

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
	 * 
	 * @param _ 
	 * @returns 
	 */
	init (
		_: BotInitData,
	): void {
		if (this.initialized)
			return;

		this.backtest = _.backtest ?? false;
		this.dryrun = _.dryrun ?? true;
		this.initialized = true;
		Bot.log(`Y:A:TA:B; Backtest: ${this.backtest ? `1` : `0`}; Dryrun: ${this.dryrun ? `1` : `0`}`, Log.Verbose);
	},

	/**
	 * Logging interface
	 * 
	 * @param input 
	 * @param level 
	 */
	log (
		_input: unknown,
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

		// Handle input
		let input: string = '';
		if (_input instanceof Error) {
			input = JSON.stringify(_input);
		} else {
			input = JSON.stringify(_input);
		}

		// Handle console logging
		if (
			!process.env.BOT_LOG_STDOUT
			&& process.env.BOT_LOG_STDOUT !== '1'
		) {
			let consoleString = `${now.toISOString()}: ${input}`;

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

			let consoleString = `${now.toISOString()}: ${levelValue}; ${input}`;

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
		index = this.itemIndex.indexOf(identifier);
		if (index >= 0)
			return this.item[index];

		// Lookup `name`
		index = this.itemNameIndex.indexOf(identifier);
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
		_: ItemBaseData,
	): string {
		let index: number = 0;

		// Lookup existing item by `uuid`, for overwrite
		index = this.itemIndex.findIndex((x: string) => x === _.uuid);
		
		// Item `name` based overwriting (if enabled)
		if (
			process.env.BOT_ITEM_NAME_OVERWRITE
			&& process.env.BOT_ITEM_NAME_OVERWRITE === '1'
			&& index < 0
		)
			index = this.itemNameIndex.findIndex((x: string) => x === _.name);

		// Reset existing item
		if (index >= 0)
			this.item[index] = _;
		
		// Store new item
		else {
			// let newIndex = this.item.length;
			
			// The `name` is optional, fallback to `uuid` if not set
			if (!_.hasOwnProperty('name') || !_.name?.length)
				_.name = _.uuid;

			this.item.push(_);
			this.itemIndex.push(_.uuid);
			this.itemNameIndex.push(_.name);
		}

		return _.uuid;
	},
};
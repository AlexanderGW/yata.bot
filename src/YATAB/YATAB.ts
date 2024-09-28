/**
 * @name Yet Another Technical Analysis YATAB (YATAB)
 * @author Alexander Gailey-White
 * @date 2024
 */

import { appendFileSync } from 'node:fs';
import { StorageItem } from './Storage';
import { ChartCandleData } from './Chart';
import { OrderBaseData, OrderData, OrderItem } from './Order';
import { ParallelArray } from './Helper';

/**
 * Logging levels
 */
export enum Log {
	Err = 4,
	Info = 1,
	Warn = 2,
	Verbose = 0,
}

export type YATABStateDataIndexType = ParallelArray;

export type YATABStateType = {
	candle: Array<ChartCandleData>,
	candleIndex: Array<string>,
	order: Array<OrderData>,
	orderIndex: Array<string>,
	timeframe: Array<Array<number>>,
	timeframeIndex: Array<string>,
	updateTime: number,
};

/**
 * Basic item structure, everything must have its own UUID
 */
 export type ItemBaseData = {
	name?: string,
	uuid: string,
}

export type YATABInitData = {
	dryrun?: boolean,
	backtest?: boolean,
};

export type YATABPlaybookData = {
	name: string,
	storage?: StorageItem | null,
	storageUuid?: string,
	lastState?: YATABStateType | undefined,
	nextState?: YATABStateType | undefined,
};

export type YATABData = {
	backtest: boolean,
	dryrun: boolean,
	initialized: boolean,
	item: ItemBaseData[],
	itemIndex: string[],
	itemNameIndex: string[],
	itemClass: string[],
	itemClassIndex: number[][],
	playbook?: YATABPlaybookData | undefined,
	__devPrepareNextStateOrder: (
		order: OrderItem,
		result: OrderBaseData,
	) => boolean,
	exit: () => Promise<void>,
	init: (
		_: YATABInitData
	) => void,
	log: (
		input: unknown,
		level?: Log,
	) => void,
	getItem: (
		uuid: string,
	) => ItemBaseData | null,
	getItemsByClass: (
		type: string,
	) => ItemBaseData[] | null,
	setItem: (
		_: ItemBaseData,
	) => string
};

export const YATAB_VERSION = 10000;
export const YATAB_LABEL = '1.0.0-dev';

export const YATAB: YATABData = {
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
	 * List of item class names
	 */
	itemClass: [],

	/**
	 * Index against list class names, containing lists of item storage index keys
	 */
	itemClassIndex: [],

	__devPrepareNextStateOrder (
		order: OrderItem,
		result: OrderBaseData,
	) {
		if (result) {
			const orderIndex = YATAB.playbook?.nextState?.orderIndex.findIndex((x: string) => x === order.name);
	
			if (
				orderIndex
				&& orderIndex >= -1
				&& YATAB.playbook?.nextState?.order[orderIndex]
			) {
				if (result.transactionId)
					YATAB.playbook.nextState.order[orderIndex].transactionId = [
						...order.transactionId,
						...result.transactionId
					];
	
				// TODO: Implement validation on state `status`, `responseStatus`?
				if (result.responseStatus)
					YATAB.playbook.nextState.order[orderIndex].responseStatus = result.responseStatus;
				if (result.responseTime)
					YATAB.playbook.nextState.order[orderIndex].responseTime = result.responseTime;
				if (result.referenceId)
					YATAB.playbook.nextState.order[orderIndex].referenceId = result.referenceId;
				if (result.status)
					YATAB.playbook.nextState.order[orderIndex].status = result.status;

				return true;
			}
		}

		return false;
	},

	async exit () {
		if (!YATAB.playbook?.nextState)
			return YATAB.log(`No next playback state`, Log.Verbose);

		// Persist playbook state for next iteration
		YATAB.playbook.nextState.updateTime = Date.now();

		// YATAB.log(`YATAB.playbook.nextState`, Log.Verbose);
		// console.log(YATAB.playbook.nextState);

		// TODO: To be refactored; If `pair` not removed, the `OrderItem.pair` will be replaced with primative object, on next run
		YATAB.playbook.nextState.order.forEach(order => {
			delete order.pair;
		});

		const setItemResult = await YATAB.playbook.storage?.setItem(
			YATAB.playbook.name,
			YATAB.playbook.nextState
		);
		if (setItemResult) {
			YATAB.log(`Updated playback state: '${YATAB.playbook.name}'`);
		}
		// YATAB.log(`setItemResult`, Log.Verbose);
		// YATAB.log(setItemResult, Log.Verbose);
		
		await YATAB.playbook.storage?.disconnect();

		// TODO: Process exit event/functions to be implemented/refactorered
		process.exit(0);
	},

	/**
	 * 
	 * @param _ 
	 * @returns 
	 */
	init (
		_: YATABInitData,
	): void {
		if (this.initialized)
			return;

		this.backtest = _.backtest ?? false;
		this.dryrun = _.dryrun ?? true;
		this.initialized = true;
		YATAB.log(`YATAB:${YATAB_LABEL} '${YATAB_VERSION}'; Backtest: ${this.backtest ? `1` : `0`}; Dryrun: ${this.dryrun ? `1` : `0`}`, Log.Verbose);
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
			input = _input.message;
			if (_input.stack)
				console.error(_input.stack);
		} else {
			input = JSON.stringify(_input);
		}

		// Handle console logging
		if (
			!process.env.BOT_LOG_STDOUT
			&& process.env.BOT_LOG_STDOUT !== '1'
		) {
			let consoleString = `${now.toISOString()} ${input}`;

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

			let consoleString = `${now.toISOString()} ${levelValue}; ${input}`;

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
			appendFileSync(
				logPath,
				`${consoleString}\n`,
				// () => {
				// 	// if (process.env.BOT_VERBOSE === '1')
				// 	// 	console.debug(`\x1b[36m APPEND LOG FILE: ${logPath}\x1b[0m`)
				// }
			);
		}
	},

	getItemsByClass (
		type: string,
	) {
		let index: number = 0;

		index = this.itemClass.indexOf(type);
		if (index < 0) {
			return null;
		}

		const itemList = this.itemClassIndex[index];

		let items: ItemBaseData[] = [];
		// for (let j = 0; j <= itemList.length; j++) {
		// 	items.push(this.item[itemList[j]]);
		// }
		itemList.forEach(itemIndex => items.push(this.item[itemIndex]));

		return items;
	},

	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} identifier 
	 * @returns {object | false}
	 */
	getItem (
		identifier: string,
	) {
		let index: number = 0;

		// Lookup `uuid`
		index = this.itemIndex.indexOf(identifier);
		if (index >= 0)
			return this.item[index];

		// Lookup `name`
		index = this.itemNameIndex.indexOf(identifier);
		if (index >= 0)
			return this.item[index];

		return null;
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

			const itemIndex = this.item.length;

			this.item.push(_);
			this.itemIndex.push(_.uuid);
			this.itemNameIndex.push(_.name);

			// Get item class index
			const className: string = _.constructor.name;
			index = this.itemClass.indexOf(className);
			if (index < 0) {
				index = this.itemClass.length;
				this.itemClass.push(className);
				this.itemClassIndex.push([]);
			}

			// Add item index to class item list
			this.itemClassIndex[index].push(itemIndex);
		}

		return _.uuid;
	},
};

process.on('exit', async (code) => {
	const used = process.memoryUsage().heapUsed / 1024 / 1024;
	YATAB.log(`The bot used approximately ${Math.round(used * 100) / 100} MB`, Log.Verbose);
  YATAB.log(`Exit code: ${code}`, Log.Verbose);
});

// Persist playbook state, on exit for next run.
// TODO: Refactor into process exit - issue within `process.on('exit')` and `redis.setItem()` where no response/error is received.
// process.on('exit', async (code) => {
// 	const used = process.memoryUsage().heapUsed / 1024 / 1024;
// 	console.log(`The bot used approximately ${Math.round(used * 100) / 100} MB`);

// 	if (YATAB.playbook) {
// 		if (YATAB.playbook.nextState) {

// 			// Persist playbook state for next iteration
// 			YATAB.playbook.nextState.updateTime = Date.now();
// 			YATAB.log(`YATAB.playbook.nextState.updateTime`, Log.Verbose);
// 			YATAB.log(YATAB.playbook.nextState.updateTime, Log.Verbose);

// 			// delete YATAB.playbook.nextState.order.pair;
	
// 			const setItemResult = await YATAB.playbook.storage?.setItem(YATAB.playbook.name, YATAB.playbook.nextState);
// 			YATAB.log(`setItemResult`, Log.Verbose);
// 			YATAB.log(setItemResult, Log.Verbose);
// 		}
		
// 		await YATAB.playbook.storage?.disconnect();
// 	}

//   console.log(`Exit code: ${code}`);
// });
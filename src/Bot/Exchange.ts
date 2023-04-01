import { ChartCandleData, ChartItem } from "./Chart";
import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { OrderExchangeReponseData, OrderItem, OrderStatus } from "./Order";

const fs = require('fs');

export type ExchangeData = {
	class?: string,
	name?: string,
	key?: string,
	secret?: string,	
	uuid?: string,
}

export interface ExchangeInterface {
	syncChart: (
		chart: ChartItem,
	) => Promise<void>;

	closeOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeReponseData>;

	openOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeReponseData>;

	editOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeReponseData>;
}

export interface ExchangeStorageInterface {
	refreshChart: (
		chart: ChartItem,
		_: object,
	) => void;
}

export class ExchangeItem implements ExchangeData, ExchangeInterface, ExchangeStorageInterface {
	class: string = '';
	name: string;
	order: Array<OrderItem> = [];
	orderIndex: string[] = [];
	uuid: string;
	
	constructor (
		_: ExchangeData,
	) {
		this.class = _.class as string;
		if (_.hasOwnProperty('name'))
			this.name = _.name as string;
		else if (_.hasOwnProperty('class'))
			this.name = _.class as string;
		else
			this.name = 'Paper';
		
		this.uuid = _.uuid ?? uuidv4();
	}

	async closeOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeReponseData = {
			status: OrderStatus.Close,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Close; Paper`);
		return orderResponse;
	}

	async openOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeReponseData = {
			status: OrderStatus.Open,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Open; Paper`);
		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeReponseData = {
			status: OrderStatus.Edit,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Edit; Paper`);
		return orderResponse;
	}

	async syncOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeReponseData = {
			status: OrderStatus.Unknown,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Sync; Paper`);
		return orderResponse;
	}

	compat (
		chart: ChartItem,
	) {
		if (chart.pair.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	refreshChart (
		chart: ChartItem,
		_: ChartCandleData
	) {
		chart.updateDataset(_);
		chart.refreshDataset();

		// Check if datasets need to be stored
		if (!process.env.BOT_EXCHANGE_STORE_DATASET || process.env.BOT_EXCHANGE_STORE_DATASET !== '1')
			return true;

		const pad = (value: number) =>
			value.toString().length == 1
			? `0${value}`
			: value;

		const now = new Date();

		const candleTimeMinutes = chart.candleTime / 60000;

		const pathParts = [
			chart.pair.exchange.name,
			chart.pair.a.symbol + chart.pair.b.symbol,
			now.getUTCFullYear(),
			pad(now.getUTCMonth() + 1),
			pad(now.getUTCDate()),
			candleTimeMinutes,
		];
		const path = pathParts.join('/');
		// Bot.log(path);

		const filenameParts = [

			// Exchange
			chart.pair.exchange.name,

			// Pair
			[
				chart.pair.a.symbol,
				chart.pair.b.symbol,
			].join(''),

			// Candle size in minutes to save space
			candleTimeMinutes,

			// Timestamp
			[
				now.getUTCFullYear(),
				pad(now.getUTCMonth() + 1),
				pad(now.getUTCDate()),
				pad(now.getUTCHours()),
				pad(now.getUTCMinutes()),
				pad(now.getUTCSeconds()),
			].join(''),

			// Number of candles
			_.open?.length,
		];

		const filename = filenameParts.join('-');
		// Bot.log(filename);

		const responseJson = JSON.stringify(_);

		const storagePath = `./storage/dataset/${path}`;
		const storageFile = `${storagePath}/${filename}.json`;

		try {
			if (!fs.existsSync(storagePath)) {
				fs.mkdirSync(
					storagePath,
					{
						recursive: true
					},
					(err: object) => {
						if (err)
							throw err;

						Bot.log(`Exchange.refreshChart; Path created: ${storagePath}`, Log.Verbose);
					}
				)
			}
		} catch (err: any) {
			return Bot.log(`Exchange.refreshChart; mkdirSync; ${JSON.stringify(err)}`, Log.Err);
		}

        try {
			fs.writeFile(
				storageFile,
				responseJson,
				function (
					err: object
				) {
					if (err)
						throw err;
					
					Bot.log(`Exchange.refreshChart; Dataset written: ${storageFile}`, Log.Verbose);
				}
			);
		} catch (err: any) {
			return Bot.log(`Exchange.refreshChart; writeFile; ${JSON.stringify(err)}`, Log.Err);
		}
	}

	async syncChart (
		chart: ChartItem,
	) {
		Bot.log(`Chart '${chart.name}' sync`);
	}
}

export const Exchange = {
	async new (
		_: ExchangeData,
	): Promise<ExchangeItem> {
		let item: any;

		// Exchange class specified
		if (_.class?.length) {
			let importPath = `./Exchange/${_.class}`;
			Bot.log(`Exchange import: ${importPath}`);

			const className = `${_.class}Item`;
				
			// Import exchange extension
			await import(importPath).then(module => {
				let newItem: any = new module[className](_);

				if (newItem.constructor.name === className) {
					let uuid = Bot.setItem(newItem);

					item = Bot.getItem(uuid);
				}
			}).catch(err => Bot.log(err.message, Log.Err));
		}

		// Default to base `Exchange` with paper trading
		else {
			let newItem: any = new ExchangeItem(_);
			let uuid = Bot.setItem(newItem);

			item = Bot.getItem(uuid);
		}

		return item;
	}
};
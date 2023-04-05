import { ChartCandleData, ChartItem } from "./Chart";
import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { OrderExchangeData, OrderItem, OrderStatus } from "./Order";
import { PairData, PairItem } from "./Pair";

const fs = require('fs');

export type ExchangeTickerData = {
	[index: string]: any,
	ask: string,
	bid: string,
	high: string,
	low: string,
	open: number,
	price: string,
	tradeCount: number,
	volumeMin: string,
};

export type ExchangeData = {
	balance?: string[],
	balanceIndex?: string[],
	class?: string,
	name?: string,
	key?: string,
	secret?: string,
	symbolLocal?: string[],
	symbolForeign?: string[],
	ticker?: Array<ExchangeTickerData>,
	tickerIndex?: string[],
	uuid?: string,
}

export interface ExchangeInterface {
	closeOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	editOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	getBalances: () => Promise<void>;

	getOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	getTicker: (
		_: PairData,
	) => Promise<void>;

	openOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	symbolToLocal: (
		symbol: string,
	) => string;

	symbolToForeign: (
		symbol: string,
	) => string;

	syncChart: (
		chart: ChartItem,
	) => Promise<void>;
}

export interface ExchangeStorageInterface {
	refreshChart: (
		chart: ChartItem,
		_: object,
	) => void;
}

export class ExchangeItem implements ExchangeData, ExchangeInterface, ExchangeStorageInterface {
	balance: string[] = [];
	balanceIndex: string[] = [];
	class: string = '';
	name: string;
	// order: Array<OrderItem> = [];
	// orderIndex: string[] = [];
	symbolForeign: string[] = [];
	symbolLocal: string[] = [];
	ticker: ExchangeTickerData[] = [];
	tickerIndex: string[] = [];
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
		const orderResponse: OrderExchangeData = {
			status: OrderStatus.Close,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Close; Paper`);
		return orderResponse;
	}

	async openOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeData = {
			status: OrderStatus.Open,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Open; Paper`);
		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeData = {
			status: OrderStatus.Edit,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Edit; Paper`);
		return orderResponse;
	}

	async getBalances () {
		return;
	}

	async getOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderExchangeData = {
			status: OrderStatus.Unknown,
			responseTime: Date.now(),
		};
		Bot.log(`Order '${_.name}'; Sync; Paper`);
		return orderResponse;
	}

	async getTicker (
		_: PairData,
	) {
		return;
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

	symbolToLocal (
		symbol: string,
	) {
		const index = this.symbolForeign.indexOf(symbol);
		if (index >= 0)
			return this.symbolLocal[index];

		return symbol;
	}

	symbolToForeign (
		symbol: string,
	) {
		const index = this.symbolLocal.indexOf(symbol);
		if (index >= 0)
			return this.symbolForeign[index];

		return symbol;
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
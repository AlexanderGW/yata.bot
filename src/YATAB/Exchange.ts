import { ChartCandleData, ChartItem } from "./Chart";
import { v4 as uuidv4 } from 'uuid';
import { YATAB, Log } from "./YATAB";
import { OrderBaseData, OrderData, OrderItem } from "./Order";
import { Pair, PairData } from "./Pair";

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

export type ExchangeBalanceData = {
	[index: string]: number | undefined,
	available?: number,
	balance?: number,
	credit?: number,
	creditUsed?: number,
	tradeHeld?: number,
};

export type ExchangeTickerData = {
	[index: string]: number | undefined,
	ask?: number,
	bid?: number,
	decimals?: number,
	high?: number,
	low?: number,
	open?: number,
	price?: number,
	tradeCount?: number,
	volume?: number,
	vwap?: number,
	// liquidity?: number,
};

export type ExchangeData = {
	[index: string]: any,
	api: ExchangeOrderApiInterface | ExchangeTickerApiInterface | undefined,
	balance?: ExchangeBalanceData[],
	balanceIndex?: string[],
	class?: string,
	name?: string,
	key?: string,
	secret?: string,
	ticker?: ExchangeTickerData[],
	tickerIndex?: string[],
	uuid?: string,
}

export type ExchangeApiBalanceData = {
	[index: string]: any,
	balance?: ExchangeBalanceData[],
	balanceIndex?: string[],
}

export type ExchangeApiTickerData = {
	[index: string]: any,
	ticker?: ExchangeTickerData[],
	tickerIndex?: string[],
}

export type ExchangeApiData = {
	name: string,
	key?: string,
	secret?: string,
	uuid: string,
}

export type ExchangeApiBaseInterface = {
	name: string,
	uuid: string,

	symbolLocal?: string[],
	symbolForeign?: string[],
}

export type ExchangeOrderApiInterface = ExchangeApiBaseInterface & {
	getBalance: (
		symbol?: string[],
	) => Promise<ExchangeApiBalanceData>;

	closeOrder: (
		_: OrderItem,
	) => Promise<OrderBaseData>;

	editOrder: (
		_: OrderItem,
	) => Promise<OrderBaseData>;

	getOrder: (
		_: OrderItem,
	) => Promise<OrderBaseData>;

	openOrder: (
		_: OrderItem,
	) => Promise<OrderBaseData>;
}

export type ExchangeTickerApiInterface = ExchangeApiBaseInterface & {
	getTicker: (
		_: PairData,
		amount?: string | number,
	) => Promise<ExchangeApiTickerData>;

	syncChart: (
		chart: ChartItem,
	) => Promise<ChartCandleData>;

	// TODO: Move to ExchangeItem
	// refreshChart: (
	// 	chart: ChartItem,
	// 	_: object,
	// ) => void;
}

export type ExchangeApiInterface = ExchangeOrderApiInterface | ExchangeTickerApiInterface;

export type ExchangeOrderInterface = {
	api: ExchangeOrderApiInterface,
	balance: ExchangeBalanceData[];
	balanceIndex: string[];

	getBalance: (
		symbol: string,
	) => Promise<ExchangeApiBalanceData>;
}

export type ExchangeTickerInterface = {
	api: ExchangeTickerApiInterface,

	getTicker: (
		_: PairData,
	) => Promise<ExchangeTickerData>;

	syncChart: (
		chart: ChartItem,
	) => Promise<void>;
}

export type ExchangeInterface = ExchangeOrderInterface & ExchangeTickerInterface & {
	api: ExchangeOrderApiInterface & ExchangeTickerApiInterface,
}

export class ExchangeItem implements ExchangeData {
	api: ExchangeOrderApiInterface | ExchangeTickerApiInterface | undefined;
	balance: ExchangeBalanceData[] = [];
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

	async getBalance (
		symbol?: string,
	) {
		
		// No support on exchange API
		if (!this.api || !("getBalance" in this.api))
			throw new Error(`Exchange '${this.name}'; Order API not supported.`);

		let symbolList: string[] = [];
		let returnData: ExchangeApiBalanceData = {};
		returnData.balance = [];
		returnData.balanceIndex = [];

		// No symbol specified, get all defined pair symbols, for this exchange
		if (!symbol) {
			const pairs = Pair.getAllByExchange(this.uuid);
			// console.log(`pairs`, pairs);
			pairs?.forEach(pair => {
				symbolList.push(pair.a.symbol);
				symbolList.push(pair.b.symbol);
			});
		} else {
			symbolList.push(symbol);
		}

		// Request syumbols on the exchange API
		const response = await this.api?.getBalance(symbolList);
		YATAB.log(`Exchange '${this.name}'; api.getBalance; Response: '${JSON.stringify(response)}'`, Log.Verbose);

		if (response && response?.balance && response?.balanceIndex) {
			for (let i = 0; i < response.balance.length; i++) {
				const index = this.balanceIndex.indexOf(response.balanceIndex[i]);
				if (index < 0) {
					this.balance.push(response.balance[i]);
					this.balanceIndex.push(response.balanceIndex[i]);
				} else {
					this.balance[index] = response.balance[i];
				}
			}
		}

		// No symbol specified, return all for exchange
		if (!symbol) {
			returnData.balance = this.balance;
			returnData.balanceIndex = this.balanceIndex;

			return returnData;
		}

		// Attempt to return requested symbol
		for (let i = 0; i < symbolList.length; i++) {
			const assetBalanceIndex = this.balanceIndex.indexOf(symbolList[i]);
			if (assetBalanceIndex < 0)
				throw new Error(`Exchange '${this.name}'; Symbol '${symbolList[i]}' not found.`);
	
			returnData.balance.push(this.balance[assetBalanceIndex]);
			returnData.balanceIndex.push(this.balanceIndex[assetBalanceIndex]);
		}

		return returnData;
	}

	async getTicker (
		_: PairData,
	) {

		// No support on exchange API
		if (!this.api || !("getTicker" in this.api))
			throw new Error(`Exchange '${this.name}'; Ticker API not supported.`);

		if (_.exchange.uuid !== this.uuid)
			throw new Error(`Exchange '${this.name}'; Pair '${_.name}'; Incompatible exchange pair`);

		const pairTicker = `${_.a.symbol}-${_.b.symbol}`;
		
		let pairTickerIndex = this.tickerIndex.indexOf(pairTicker);
		if (pairTickerIndex < 0) {
			
			// TODO: Check and sync ticker data - track last poll?
			const response = await this.api?.getTicker(_);
			if (response?.ticker && response?.tickerIndex) {
				this.ticker = [
					...this.ticker,
					...response.ticker
				];
				this.tickerIndex = [
					...this.tickerIndex,
					...response.tickerIndex
				];
			}

			pairTickerIndex = this.tickerIndex.indexOf(pairTicker);
			if (pairTickerIndex < 0)
				throw new Error(`Exchange '${this.name}'; No ticker information for '${pairTicker}'`);
		}

		return this.ticker[pairTickerIndex];
	}

	compat (
		chart: ChartItem,
	) {
		if (chart.pair.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	async syncChart (
		chart: ChartItem,
	) {
		YATAB.log(`Chart '${chart.name}'; syncChart`);

		if (!this.api || !("syncChart" in this.api))
			throw new Error(`Exchange '${this.name}'; Ticker API not supported.`);

		if (!this.compat(chart))
			throw new Error('This chart belongs to a different exchange.');
		
		const etlData = await this.api?.syncChart(chart);

		await this.refreshChart(
			chart,
			etlData,
		);
	}

	async refreshChart (
		chart: ChartItem,
		_: ChartCandleData
	) {
		YATAB.log(`Chart '${chart.name}'; refreshChart`);

		if (!this.api || !("syncChart" in this.api))
			throw new Error(`Exchange '${this.name}'; Ticker API not supported.`);

		if (!this.compat(chart))
			throw new Error('This chart belongs to a different exchange.');
		
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
		// YATAB.log(path);

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
		// YATAB.log(filename);

		const responseJson = JSON.stringify(_);

		const storagePath = `./storage/dataset/${path}`;
		const storageFile = `${storagePath}/${filename}.json`;

		try {
			if (!existsSync(storagePath)) {
				mkdirSync(
					storagePath,
					{
						recursive: true
					},
					// (err: object) => {
					// 	if (err)
					// 		throw new Error(JSON.stringify(err));

					// 	YATAB.log(`Exchange '${this.name}'; api.refreshChart; Path created: ${storagePath}`, Log.Verbose);
					// }
				)
			}
		} catch (error) {
			YATAB.log(error, Log.Err);
			YATAB.log(`Exchange '${this.name}'; api.refreshChart; mkdirSync`, Log.Err);
		}

		try {

			// TODO: Refactor into a storage interface
			writeFileSync(
				storageFile,
				responseJson,
			);
		} catch (error) {
			YATAB.log(error, Log.Err);
			YATAB.log(`Exchange '${this.name}'; api.refreshChart; writeFileSync`, Log.Err);
		}
	}
}

export const Exchange = {
	async new (
		_: ExchangeData,
	): Promise<ExchangeItem> {
		if (!_.class)
			_.class = 'Paper';

		let exchangeItem: ExchangeItem = new ExchangeItem(_);

		let importPath = `./Exchange/${_.class}`;

		const className = `${_.class}Exchange`;

		// Add API backend
		await import(importPath).then(module => {
			let exchangeApi: ExchangeApiInterface = new module[className](_);
			if (exchangeApi.constructor.name !== className)
				throw new Error(`Failed to instanciate Exchange API class '${className}'`);

			exchangeItem.api = exchangeApi;
			exchangeItem.api.uuid = exchangeItem.uuid;
		}).catch(error => YATAB.log(error, Log.Err));

		let uuid = YATAB.setItem(exchangeItem);
		const item = YATAB.getItem(uuid) as ExchangeItem;

		YATAB.log(`Exchange '${item.name}'; API initialised`, Log.Verbose);

		return item;
	}
};
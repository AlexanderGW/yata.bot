import { ChartCandleData, ChartItem } from "./Chart";
import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { OrderExchangeData, OrderItem, OrderStatus } from "./Order";
import { PairData, PairItem } from "./Pair";

const fs = require('fs');

export type ExchangeBalanceData = {
	[index: string]: any,
	available?: number,
	balance?: number,
	credit?: number,
	creditUsed?: number,
	tradeHeld?: number,
};

export type ExchangeTickerData = {
	[index: string]: any,
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
};

export type ExchangeData = {
	[index: string]: any,
	// api?: ExchangeApiInterface,
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

export type ExchangeApiInterface = {
	name: string,
	uuid: string,

	symbolLocal?: string[],
	symbolForeign?: string[],

	// doApi: () => Promise<ExchangeApiInterface>;

	getBalance: () => Promise<ExchangeApiBalanceData>;

	// TODO: Collate all defined ticker symbols - then call en-masse?
	// syncTickers: () => Promise<void>;

	getTicker: (
		_: PairData,
	) => Promise<ExchangeApiTickerData>;

	closeOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	editOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	getOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;

	openOrder: (
		_: OrderItem,
	) => Promise<OrderExchangeData>;
}

export type ExchangeBaseInterface = {
	api?: ExchangeApiInterface,

	getBalance: (
		symbol: string,
	) => Promise<ExchangeBalanceData>;

	getTicker: (
		_: PairData,
	) => Promise<ExchangeTickerData>;
}

export type ExchangeInterface = {
	syncChart: (
		chart: ChartItem,
	) => Promise<void>;
}

export type ExchangeStorageInterface = {
	refreshChart: (
		chart: ChartItem,
		_: object,
	) => void;
}

export class ExchangeItem implements ExchangeData, ExchangeBaseInterface, ExchangeInterface {
	api?: ExchangeApiInterface;
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
		// Import exchange extension
		// await import(importPath).then(module => {
		// 	let newItem: any = new module[className](_);

		// 	if (newItem.constructor.name === className) {
		// 		let uuid = Bot.setItem(newItem);

		// 		item = Bot.getItem(uuid);
		// 	}
		// }).catch(err => Bot.log(err.message, Log.Err));
		
		// if (_.hasOwnProperty('api'))
		// 	this.api = await this.doApi(_);
		this.class = _.class as string;
		if (_.hasOwnProperty('name'))
			this.name = _.name as string;
		else if (_.hasOwnProperty('class'))
			this.name = _.class as string;
		else
			this.name = 'Paper';
		
		this.uuid = _.uuid ?? uuidv4();
	}

	// async doApi (
	// 	_: ExchangeData,
	// ): Promise<ExchangeApiInterface> {
		
	// }

	// return both symbol balances?
	async getBalance (
		symbol: string
	) {
		try {
			let assetBalanceIndex = this.balanceIndex.indexOf(symbol);
			if (assetBalanceIndex < 0) {
				// Bot.log(`Do api.getBalance`);
				const response = await this.api?.getBalance();
				// Bot.log(`RESPONSE api.getBalance`);
				// Bot.log(response);

				if (response?.balance && response?.balanceIndex) {
					this.balance = [
						...this.balance,
						...response.balance
					];
					this.balanceIndex = [
						...this.balanceIndex,
						...response.balanceIndex
					];
					// Bot.log(`this.balance`);
					// Bot.log(this.balance);
					// Bot.log(`this.balanceIndex`);
					// Bot.log(this.balanceIndex);
				}

				assetBalanceIndex = this.balanceIndex.indexOf(symbol);
				if (assetBalanceIndex < 0)
					throw new Error(`Exchange '${this.name}'; Symbol '${symbol}' not found.`);
			}

			return this.balance[assetBalanceIndex];
		} catch(error) {
			Bot.log(error, Log.Err);
			return {};
		}
	}

	async getTicker (
		_: PairData,
	) {
		try {
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
		} catch (error) {
			Bot.log(error, Log.Err);
			return {};
		}
	}

	// async getTicker (
	// 	_: PairData,
	// ) {
	// 	if (_.exchange.uuid !== this.uuid)
	// 		throw new Error(`Exchange '${this.name}'; Pair '${_.name}'; Incompatible exchange pair`);

	// 	const assetASymbol = _.a.symbol;
	// 	const assetBSymbol = _.b.symbol;
	// 	const pairTicker = `${assetASymbol}-${assetBSymbol}`;

	// 	const pairTickerIndex = this.tickerIndex.indexOf(pairTicker);
	// 	if (pairTickerIndex < 0)
	// 		throw new Error(`Exchange '${this.name}'; No ticker information for '${pairTicker}'`);
		
	// 	return this.ticker[pairTickerIndex];
	// }

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
		Bot.log(`Chart '${chart.name}' sync`);

		if (!this.compat(chart))
			throw new Error('This chart belongs to a different exchange.');

		// 
	}
}

// IDEA: Implement exchanges as a drop in interface? Or as an instance defiend within the `Exchange` item? - this will avoid having to redefine/implment all functions - instead allows calling `Exchange`, with underlying sub-class instance for ticket/balance lookups.?

// OR - Define all within `Exchange` such as `getBalance` - exchange backend classes then either call the default `getBalance` - or implmement something else

export const Exchange = {
	async new (
		_: ExchangeData,
	): Promise<ExchangeItem> {
		let item: any;

		if (!_.class)
			_.class = 'Paper';

		let exchangeItem: ExchangeItem = new ExchangeItem(_);




		let importPath = `./Exchange/${_.class}`;
		Bot.log(`Exchange import: ${importPath}`);

		const className = `${_.class}Exchange`;

		await import(importPath).then(module => {
			let exchangeApi: any = new module[className](_);

			if (exchangeApi.constructor.name !== className)
				throw new Error(`Failed to instanciate class`);

			exchangeItem.api = exchangeApi;
		}).catch(err => Bot.log(err.message, Log.Err));




		let uuid = Bot.setItem(exchangeItem);

		item = Bot.getItem(uuid);

		return item;
	}
};
import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeApiBalanceData, ExchangeApiData, ExchangeApiInterface, ExchangeApiTickerData, ExchangeBalanceData, ExchangeTickerData } from '../Exchange';
import { OrderSide, OrderItem, OrderType, OrderStatus, OrderData, OrderBaseData } from '../Order';
import { PairData } from '../Pair';

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

export type KrakenExchangeResponse = {
	result: any,
	error?: string[],
};

export type KrakenExchangeInterface = {
	symbolToLocal: (
		symbol: string,
	) => string;

	symbolToForeign: (
		symbol: string,
	) => string;

	refreshChart: (
		chart: ChartItem,
		_: object,
	) => void;
}

export class KrakenExchange implements ExchangeApiInterface, KrakenExchangeInterface {
	name: string;
	uuid: string;

	handle?: {
		api: (type: string, options?: object) => Promise<KrakenExchangeResponse>,
	};

	symbolForeign = [
		'BTC',
		'ETH',
		'EUR',
		'EUR',
		// 'XGBP',
		'GBP',
		'USD',
		'XDG',
		'XBT',
		'XXBT',
		'XETH',
	];

	symbolLocal = [
		'BTC',
		'ETH',
		'EUR',
		'EUR',
		// 'GBP',
		'GBP',
		'USD',
		'DOGE',
		'BTC',
		'BTC',
		'ETH',
	];

	constructor (
		_: ExchangeApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;

		const KrakenClient = require('kraken-api');
		this.handle = new KrakenClient(
			process.env.KRAKEN_CLIENT_KEY!,
			process.env.KRAKEN_CLIENT_SECRET!
		);
	}

	_handleError (
		_: KrakenExchangeResponse
	) {
		if (_.error) {
			for (let i = 0; i < _.error.length; i++) {
				Bot.log(_.error[i], Log.Err);
			}
		}

		if (_.result.status === 'Err')
			throw new Error(_.result.error_message);
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

	async openOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		let assetASymbol = this.symbolToForeign(_.pair.a.symbol);
		let assetBSymbol = this.symbolToForeign(_.pair.b.symbol);
		let pair = `${assetASymbol}/${assetBSymbol}`;

		// Set empty `referenceId` as current time
		if (_.referenceId === 0) {
			orderResponse.referenceId = Math.floor(Date.now());
		}

		const requestOptions = {

			// Order type
			ordertype: this.getOrderTypeValue(_),

			// Order type
			pair: pair,

			// Order price
			price: _.priceActual,

			// Order direction (buy/sell)
			type: _.side === OrderSide.Buy ? 'buy' : 'sell',

			// Set order `referenceId`
			userref: _.referenceId,

			// Validate inputs only. Do not submit order.
			validate: _.dryrun,

			// Order quantity in terms of the base asset
			volume: _.quantityActual,
		};
		Bot.log(requestOptions, Log.Verbose);

		let responseJson = await this.handle?.api(

			// Type
			'AddOrder',

			// Options
			requestOptions
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.openOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (responseJson) {

			// Handle any errors
			this._handleError(responseJson);
			
			// Confirmed
			if (responseJson.result.txid) {
				orderResponse.responseStatus = OrderStatus.Open;
				orderResponse.status = OrderStatus.Open;
				orderResponse.responseTime = Date.now();
				orderResponse.transactionId = orderResponse.transactionId
					? [
						...orderResponse.transactionId,
						responseJson.result.txid[0]
					]
					: [responseJson.result.txid[0]];
			}
		}

		return orderResponse;
	}

	async closeOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		// Get latest order transaction ID index
		let lastTransactionIdx = 0;
		if (_.transactionId?.length)
			lastTransactionIdx = _.transactionId.length - 1;

		let responseJson = await this.handle?.api(

			// Type
			'CancelOrder',

			// Options
			{

				// Transaction ID
				txid: _.transactionId[lastTransactionIdx],
			}
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.closeOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (responseJson) {

			// Handle any errors
			this._handleError(responseJson);

			// Response either in pending state, or count is zero
			if (
				responseJson.result.pending === true
				|| responseJson.result.count === 0
			) {
				orderResponse.responseStatus = OrderStatus.Pending;
			}
			
			// Successful
			else {
				orderResponse.responseStatus = OrderStatus.Close;
			}

			orderResponse.responseTime = Date.now();
		}

		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		// Get latest order transaction ID index
		let lastTransactionIdx = 0;
		if (_.transactionId?.length)
			lastTransactionIdx = _.transactionId.length - 1;

		let assetASymbol = this.symbolToForeign(_.pair.a.symbol);
		let assetBSymbol = this.symbolToForeign(_.pair.b.symbol);
		let pair = `${assetASymbol}/${assetBSymbol}`;

		// Set empty `referenceId` as current time
		if (_.referenceId === 0) {
			orderResponse.referenceId = Math.floor(Date.now());
		}

		let responseJson = await this.handle?.api(

			// Type
			'EditOrder',

			// Options
			{

				// Order type
				ordertype: this.getOrderTypeValue(_),

				// Order type
				pair: pair,

				// Order price
				price: _.priceActual,

				// Transaction ID
				txid: _.transactionId[lastTransactionIdx],

				// Order direction (buy/sell)
				type: _.side === OrderSide.Buy ? 'buy' : 'sell',

				// Set order `referenceId`
				userref: _.referenceId,

				// Validate inputs only. Do not submit order.
				validate: _.dryrun,

				// Order quantity in terms of the base asset
				volume: _.quantityActual,
			}
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.editOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (responseJson) {

			// Handle any errors
			this._handleError(responseJson);

			// Response carries previous, new foreign 
			// transaction ID, and status is `ok`
			if (
				responseJson.result.originaltxid === _.transactionId[lastTransactionIdx]
				&& responseJson.result.txid
				&& responseJson.result.status === 'ok'
			) {
				orderResponse.responseStatus = OrderStatus.Open;
				orderResponse.status = OrderStatus.Open;
				orderResponse.responseTime = Date.now();
				orderResponse.transactionId = orderResponse.transactionId
					? [
						...orderResponse.transactionId,
						responseJson.result.txid
					]
					: [responseJson.result.txid];
			}
		}

		return orderResponse;
	}

	async getBalance (
		symbol?: string[],
	) {
		// if (!symbol)
		// 	throw new Error(`Not implemented`);

		// Get balances on exchange
		let responseJson = await this.handle?.api(

			// Type
			// TODO: Need to manually add to `kraken-api` for testing
			'BalanceEx',
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.getBalance; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (!responseJson)
			throw new Error(`Invalid response`);

		// Handle any errors
		this._handleError(responseJson);

		let returnData: ExchangeApiBalanceData = {};
		returnData.balance = [];
		returnData.balanceIndex = [];

		// Walk all balances
		for (let resultSymbol in responseJson.result) {
			const resultBalance: {
				balance?: string,
				credit?: string,
				credit_used?: string,
				hold_trade?: string,
			} = responseJson.result[resultSymbol];

			const symbolLocal = this.symbolToLocal(resultSymbol);
			const balance = Number(resultBalance.balance);
			const credit = Number(resultBalance.credit);
			const creditUsed = Number(resultBalance.credit_used);
			const holdTrade = Number(resultBalance.hold_trade);

			const balanceData: ExchangeBalanceData = {
				available: balance, // TODO: balance + credit - creditUsed - holdTrade,
				balance: balance,
				credit: credit,
				creditUsed: creditUsed,
				tradeHeld: holdTrade,
			};

			const index = returnData?.balanceIndex.indexOf(symbolLocal);
			if (index < 0) {
				returnData.balance.push(balanceData);
				returnData.balanceIndex.push(symbolLocal);
			} else
				returnData.balance[index] = balanceData;
		}

		return returnData;
	}

	async getOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderData = {};

		// Get latest order transaction ID index
		let lastTransactionIdx = 0;
		if (!_.transactionId?.length)
			throw new Error(`Unknown transaction ID`);

		lastTransactionIdx = _.transactionId.length - 1;

		// Options
		let requestOptions: {
			txid: string,
			userref?: number,
		} = {

			// Transaction ID
			// txid: _.transactionId.reverse().join(','), // Provide all order transaction, newest first
			txid: _.transactionId[lastTransactionIdx],
		};

		// Set order `referenceId` if we have one
		if (_.referenceId)
			requestOptions.userref = _.referenceId;

		Bot.log(requestOptions, Log.Verbose);
		// return orderResponse;

		let responseJson = await this.handle?.api(

			// Type
			'QueryOrders',

			// Options
			requestOptions
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.getOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (!responseJson)
			return orderResponse;
		
		// Handle any errors
		this._handleError(responseJson);

		// Walk all transactions
		for (let resultTxId in responseJson.result) {
			const transaction = responseJson.result[resultTxId];
			console.log(transaction);

			// The requested transasction
			if (

				// Transaction within top-level results
				// _.transactionId.indexOf(resultTxId) >= 0 // Is one of the orders transactions
				_.transactionId[lastTransactionIdx] !== resultTxId

				// Referral order transaction ID that created this order
				&& transaction.refid !== _.transactionId[lastTransactionIdx]
			)
				return orderResponse;
			
			// TODO: Compare response pair

			if (transaction.closetm)
				orderResponse.closeTime = transaction.closetm;
		
			// Order type
			switch (transaction.descr.ordertype) {
				case 'limit':
					orderResponse.type = OrderType.Limit;
					break;
				case 'market':
					orderResponse.type = OrderType.Market;
					break;
				case 'stop-loss':
					orderResponse.type = OrderType.StopLoss;
					break;
				case 'take-profit':
					orderResponse.type = OrderType.TakeProfit;
					break;
				default:
					orderResponse.type = OrderType.Unknown;
					break;
			}

			// Order side
			switch (transaction.descr.type) {
				case 'buy':
					orderResponse.side = OrderSide.Buy;
					break;
				case 'sell':
					orderResponse.side = OrderSide.Sell;
					break;
				default:
					orderResponse.side = OrderSide.Unknown;
					break;
			}

			if (transaction.expiretm)
				orderResponse.expireTime = transaction.expiretm;
			if (transaction.limitprice)
				orderResponse.limitPrice = transaction.limitprice;
			if (transaction.opentm)
				orderResponse.openTime = transaction.opentm;
			if (transaction.price)
				orderResponse.price = transaction.price;
			orderResponse.responseTime = Date.now();
			if (transaction.starttm)
				orderResponse.startTime = transaction.starttm;

			// Order status
			switch (transaction.status) {
				case 'canceled':
					orderResponse.status = OrderStatus.Cancel;
					break;
				case 'closed':
					orderResponse.status = OrderStatus.Close;
					break;
				case 'expired':
					orderResponse.status = OrderStatus.Expired;
					break;
				case 'open':
					orderResponse.status = OrderStatus.Open;
					break;
				case 'pending':
					orderResponse.status = OrderStatus.Pending;
					break;
				default:
					orderResponse.status = OrderStatus.Unknown;
					break;
			}

			orderResponse.responseStatus = orderResponse.status;

			if (transaction.stopprice)
				orderResponse.stopPrice = transaction.stopprice;
			if (transaction.vol)
				orderResponse.quantity = transaction.vol;
			if (transaction.vol_exec)
				orderResponse.quantityFilled = transaction.vol_exec;

			// Transaction was matched as a referral, add 
			// the `resultTxId` to the order
			if (_.transactionId[lastTransactionIdx] !== resultTxId)
				_.transactionId.push(resultTxId);
		}

		return orderResponse;
	}

	async getTicker (
		_: PairData,
	): Promise<ExchangeApiTickerData> {
		// TODO: fix
		// if (_.exchange.uuid !== this.uuid)
		// 	throw new Error(`Exchange '${this.name}'; api.Pair '${_.name}'; api.Incompatible exchange pair`);

		let assetASymbolForeign = this.symbolToForeign(_.a.symbol);
		let assetBSymbolForeign = this.symbolToForeign(_.b.symbol);
		
		const pair = `${_.a.symbol}-${_.b.symbol}`;
		const pairForeign = `${assetASymbolForeign}${assetBSymbolForeign}`;

		Bot.log(`Exchange '${this.name}'; api.getTicker; Pair: '${pair}'; Foreign: '${pairForeign}'`, Log.Verbose);

		// Get balances on exchange
		let responseTickerJson = await this.handle?.api(

			// Type
			'Ticker',

			{
				pair: pairForeign,
			}
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.getTicker; Response: '${JSON.stringify(responseTickerJson)}'`, Log.Verbose);

		if (!responseTickerJson)
			throw new Error(`Invalid 'Ticker' response`);

		// Handle any ticker errors
		this._handleError(responseTickerJson);

		let returnData: ExchangeApiTickerData = {};
		returnData.ticker = [];
		returnData.tickerIndex = [];

		// Walk all balances
		for (let resultPair in responseTickerJson.result) {
			// Get asset pair information on exchange
			// TODO: Refactor for batch `pair` calls, and possible caching?
			let responseAssetPairsJson = await this.handle?.api(

				// Type
				'AssetPairs',

				{
					pair: resultPair,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}'; api.getTicker; Response: '${JSON.stringify(responseAssetPairsJson)}'`, Log.Verbose);

			if (!responseAssetPairsJson)
				throw new Error(`Invalid 'AssetPairs' response`);

			// Handle any errors
			this._handleError(responseAssetPairsJson);

			const resultPairASymbolForeign = resultPair.substring(0, 4);
			const resultPairBSymbolForeign = resultPair.substring(4);
			const resultPairASymbolLocal = this.symbolToLocal(resultPairASymbolForeign);
			const resultPairBSymbolLocal = this.symbolToLocal(resultPairBSymbolForeign);
			const pairTicker = `${resultPairASymbolLocal}-${resultPairBSymbolLocal}`;
			
			const ticker: {
				a: string[],
				b: string[],
				c: string[],
				v: string[],
				p: string[],
				t: string[],
				l: string[],
				h: string[],
				o: string,
			} = responseTickerJson.result[resultPair];

			const tickerData: ExchangeTickerData = {
				ask: Number(ticker.a[0]),
				bid: Number(ticker.b[0]),
				// decimals: countDecimals(ticker.c[0]),
				decimals: Number(responseAssetPairsJson.result[resultPair].pair_decimals ?? 5),
				high: Number(ticker.h[0]),
				low: Number(ticker.l[0]),
				open: Number(ticker.o),
				price: Number(ticker.c[0]),
				tradeCount: Number(ticker.t[0]),
				volume: Number(ticker.v[0]),
				vwap: Number(ticker.p[0]),
			};

			const index = returnData.tickerIndex.indexOf(pairTicker);
			if (index < 0) {
				returnData.ticker.push(tickerData);
				returnData.tickerIndex.push(pairTicker);
			} else
				returnData.ticker[index] = tickerData;
		}

		return returnData;
	}

	// compat (
	// 	chart: ChartItem,
	// ) {
	// 	if (chart.pair.exchange.uuid === this.uuid)
	// 		return true;
	// 	return false;
	// }

	async syncChart (
		chart: ChartItem,
	) {
		let assetASymbol = this.symbolToForeign(chart.pair.a.symbol);
		let assetBSymbol = this.symbolToForeign(chart.pair.b.symbol);
		let pair: string = `${assetASymbol}/${assetBSymbol}`;

		let nextDate = new Date(chart.datasetNextTime);
		Bot.log(`Chart '${chart.name}'; api.syncChart; From: ${nextDate.toISOString()}`);

		const requestOptions = {
			interval: chart.candleTime / 60000,
			pair: pair,
			since: Math.floor(chart.datasetNextTime / 1000),
		};
		// Bot.log(requestOptions, Log.Warn);
		
		// Kraken times are in minutes
		let responseJson = await this.handle?.api(

			// Type
			'OHLC',

			// Options
			requestOptions
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.syncChart; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		let etlData: ChartCandleData = {
			close: [],
			high: [],
			low: [],
			open: [],
			openTime: [],
			tradeCount: [],
			volume: [],
			vwap: [],
		};

		// Extract, transform, load response to chart
		if (!responseJson?.result?.hasOwnProperty(pair))
			throw new Error(`Invalid response from Kraken`);

		let pairData = responseJson.result[pair];

		let p: {
			0: number,
			1: string,
			2: string,
			3: string,
			4: string,
			5: string,
			6: string,
			7: number,
		};

		for (let i = 0; i < pairData.length; i++) {
			p = pairData[i];
			// Bot.log(p[0]);return;
			etlData.close?.push(p[4]);
			etlData.high?.push(p[2]);
			etlData.low?.push(p[3]);
			etlData.open?.push(p[1]);
			etlData.openTime?.push(p[0]);
			etlData.tradeCount?.push(p[7]);
			etlData.volume?.push(p[6]);
			etlData.vwap?.push(p[5]);
		}

		this.refreshChart(
			chart,
			etlData,
		);
	}

	getOrderTypeValue (
		order: OrderItem,
	) {
		switch (order.type) {
			case OrderType.Limit:
				return 'limit';
			case OrderType.StopLoss:
				return 'stop-loss';
			case OrderType.TakeProfit:
				return 'take-profit';
			case OrderType.Market:
				return 'market';
			default:
				throw new Error(`Unknown order type '${order.type}'`);
		}
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
			if (!existsSync(storagePath)) {
				mkdirSync(
					storagePath,
					{
						recursive: true
					},
					// (err: object) => {
					// 	if (err)
					// 		throw new Error(JSON.stringify(err));

					// 	Bot.log(`Exchange '${this.name}'; api.refreshChart; Path created: ${storagePath}`, Log.Verbose);
					// }
				)
			}
		} catch (error) {
			Bot.log(error, Log.Err);
			Bot.log(`Exchange '${this.name}'; api.refreshChart; mkdirSync`, Log.Err);
		}

		try {

			// TODO: Refactor into a storage interface
			writeFileSync(
				storageFile,
				responseJson,
			);
		} catch (error) {
			Bot.log(error, Log.Err);
			Bot.log(`Exchange '${this.name}'; api.refreshChart; writeFileSync`, Log.Err);
		}
	}
}

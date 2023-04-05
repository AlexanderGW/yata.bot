import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';
import { OrderSide, OrderItem, OrderType, OrderStatus, OrderExchangeData, Order } from '../Order';
import { PairData, PairItem } from '../Pair';

const fs = require('fs');

export type KrakenExchangeResponse = {
	result: any,
	error?: string[],
};

export class KrakenItem extends ExchangeItem implements ExchangeInterface {
	handle?: {
		api: (type: string, options?: object) => Promise<KrakenExchangeResponse>,
	};

	symbolForeign = [
		'XXBT',
		'XETH',
		'XEUR',
		'ZEUR',
		'XGBP',
		'ZGBP',
		'ZUSD',
		'XXDG',
	];

	symbolLocal = [
		'BTC',
		'ETH',
		'EUR',
		'EUR',
		'GBP',
		'GBP',
		'USD',
		'DOGE',
	];

	constructor (
		_: ExchangeData,
	) {
		super(_);

		const KrakenClient = require('kraken-api');
		this.handle = new KrakenClient(
			_.key,
			_.secret
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

		if (_.result.status === 'Err') {
			throw _.result.error_message;
		}
	}

	async openOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderExchangeData = {};

		try {
			let assetASymbol = this.symbolToForeign(_.pair.a.symbol);
			let assetBSymbol = this.symbolToForeign(_.pair.b.symbol);
			let pair = `${assetASymbol}${assetBSymbol}`;

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
				price: _.price,

				// Order direction (buy/sell)
				type: _.side === OrderSide.Buy ? 'buy' : 'sell',

				// Set order `referenceId`
				userref: _.referenceId,

				// Validate inputs only. Do not submit order.
				validate: _.dryrun,

				// Order quantity in terms of the base asset
				volume: _.quantity,
			};
			console.log(requestOptions);

			let responseJson = await this.handle?.api(

				// Type
				'AddOrder',

				// Options
				requestOptions
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {

				// Handle any errors
				this._handleError(responseJson);
				
				// Confirmed
				if (responseJson.result.count > 0) {
					orderResponse.status = OrderStatus.Open;
					orderResponse.responseTime = Date.now();
					orderResponse.transactionId?.push(responseJson.result.txid);
				}
			}
		} catch (error) {
			orderResponse.status = OrderStatus.Error;
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return orderResponse;
	}

	async closeOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderExchangeData = {};

		try {

			// Get latest order transaction ID index
			let lastTransactionIdx = 0;
			if (_.transactionId?.length)
				lastTransactionIdx = _.transactionId.length - 1;

			let responseJson = await this.handle?.api(

				// Type
				'CloseOrder',

				// Options
				{

					// Transaction ID
					txid: _.transactionId[lastTransactionIdx],
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {

				// Handle any errors
				this._handleError(responseJson);

				// Response either in pending state, or count is zero
				if (
					responseJson.result.pending === true
					|| responseJson.result.count === 0
				) {
					orderResponse.status = OrderStatus.Pending;
				}
				
				// Successful
				else {
					orderResponse.status = OrderStatus.Close;
				}

				orderResponse.responseTime = Date.now();
			}
		} catch (error) {
			orderResponse.status = OrderStatus.Error;
			Bot.log(`Order '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderExchangeData = {};

		try {

			// Get latest order transaction ID index
			let lastTransactionIdx = 0;
			if (_.transactionId?.length)
				lastTransactionIdx = _.transactionId.length - 1;

			let assetASymbol = this.symbolToForeign(_.pair.a.symbol);
			let assetBSymbol = this.symbolToForeign(_.pair.b.symbol);
			let pair = `${assetASymbol}${assetBSymbol}`;

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
					price: _.price,

					// Transaction ID
					txid: _.transactionId[lastTransactionIdx],

					// Order direction (buy/sell)
					type: _.side === OrderSide.Buy ? 'buy' : 'sell',

					// Set order `referenceId`
					userref: _.referenceId,

					// Validate inputs only. Do not submit order.
					validate: _.dryrun,

					// Order quantity in terms of the base asset
					volume: _.quantity,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {

				// Handle any errors
				this._handleError(responseJson);

				// Response carries previous, new foreign 
				// transaction ID, and status is `Ok`
				if (
					responseJson.result.originaltxid === _.transactionId[lastTransactionIdx]
					&& responseJson.result.txid
					&& responseJson.result.status === 'Ok'
				) {
					orderResponse.status = OrderStatus.Edit;
					orderResponse.responseTime = Date.now();
					orderResponse.transactionId?.push(responseJson.result.txid);
				}
			}
		} catch (error) {
			orderResponse.status = OrderStatus.Error;
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return orderResponse;
	}

	async getTicker (
		_: PairData,
	) {
		try {
			let assetASymbol = _.a.symbol;
			let assetBSymbol = _.b.symbol;
			
			// Get balances on exchange
			let responseJson = await this.handle?.api(

				// Type
				'Ticker',

				{
					pair: `${assetASymbol}/${assetBSymbol}`,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {

				// Handle any errors
				this._handleError(responseJson);

				// Walk all balances
				for (let resultPair in responseJson.result) {
					const pairTicker = `${assetASymbol}-${assetBSymbol}`;
					const ticker = responseJson.result[resultPair];
					const tickerData = {
						ask: ticker.a[0],
						bid: ticker.b[0],
						open: ticker.o,
						high: ticker.h[0],
						low: ticker.l[0],
						price: ticker.c[0],
						tradeCount: ticker.t[0],
						volumeMin: '',
					};
					const index = this.tickerIndex.indexOf(pairTicker);
					if (index < 0) {
						this.ticker.push(tickerData);
						this.tickerIndex.push(pairTicker);
					} else
						this.ticker[index] = tickerData;
				}

				console.log(`this.tickerIndex`);
				console.log(this.tickerIndex);
				console.log(`this.ticker`);
				console.log(this.ticker);
			}
		} catch (error) {
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}
	}

	async getBalances () {
		try {
			
			// Get balances on exchange
			let responseJson = await this.handle?.api(

				// Type
				'Balance',
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {

				// Handle any errors
				this._handleError(responseJson);

				// Walk all balances
				for (let symbol in responseJson.result) {
					const symbolLocal = this.symbolToLocal(symbol);
					const balance = responseJson.result[symbol];
					const index = this.balanceIndex.indexOf(symbolLocal);
					if (index < 0) {
						this.balance.push(balance);
						this.balanceIndex.push(symbolLocal);
					} else
						this.balance[index] = balance;
				}

				console.log(`this.balanceIndex`);
				console.log(this.balanceIndex);
				console.log(`this.balance`);
				console.log(this.balance);
			}
		} catch (error) {
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}
	}

	async getOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderExchangeData = {};

		try {

			// Get latest order transaction ID index
			let lastTransactionIdx = 0;
			if (_.transactionId?.length)
				lastTransactionIdx = _.transactionId.length - 1;

			// Options
			let requestOptions: any = {

				// Transaction ID
				// txid: _.transactionId.reverse().join(','), // Provide all order transaction, newest first
				txid: _.transactionId[lastTransactionIdx],
			};

			// Set order `referenceId` if we have one
			if (_.referenceId)
				requestOptions.userref = _.referenceId;

			// console.log(requestOptions);
			// return orderResponse;

			let responseJson = await this.handle?.api(

				// Type
				'QueryOrders',

				// Options
				requestOptions
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (!responseJson)
				return orderResponse;
			
			// Handle any errors
			this._handleError(responseJson);

			// Walk all transactions
			for (let resultTxId in responseJson.result) {
				const transaction = responseJson.result[resultTxId];

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
		} catch (error) {
			orderResponse.status = OrderStatus.Error;
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return orderResponse;
	}

	async syncChart (
		chart: ChartItem,
	) {
		if (!this.compat(chart))
			throw ('This chart belongs to a different exchange.');

		try {
			let assetASymbol = this.symbolToForeign(chart.pair.a.symbol);
			let assetBSymbol = this.symbolToForeign(chart.pair.b.symbol);
			let pair: string = `${assetASymbol}${assetBSymbol}`;

			let nextDate = new Date(chart.datasetNextTime);
			Bot.log(`Chart '${chart.name}'; Sync from: ${nextDate.toISOString()}`);

			let responseJson = await this.handle?.api(

				// Type
				'OHLC',

				// Options
				// Kraken times are in minutes
				{
					interval: chart.candleTime / 60000,
					pair: pair,
					since: chart.datasetNextTime / 1000,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

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
			if (responseJson?.result?.hasOwnProperty(pair)) {
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
			} else {
				throw 'Invalid response from Kraken';
			}
		} catch (err) {
			Bot.log(err as string, Log.Err);
		}
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
			default:
				return 'market';
		}
	}
}

export const Kraken = {
	new (
		_: ExchangeData,
	): KrakenItem {
		let item = new KrakenItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
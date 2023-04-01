import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';
import { OrderSide, OrderItem, OrderType, OrderStatus } from '../Order';

const fs = require('fs');

export class KrakenItem extends ExchangeItem implements ExchangeInterface {
	handle?: {
		api: (type: string, options: object) => Promise<{
			result: any,
			error?: string[],
		}>,
	};

	// Omitting 4th char prefix of `X`, added on `pair` assignment
	symbols: {
		[index: string]: string,
	} = {
		BTC: 'XBT',
	};

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

	translateSymbol (
		symbol: string,
	) {
		if (this.symbols[symbol])
			return this.symbols[symbol];

		return symbol;
	}

	async openOrder (
		_: OrderItem,
	) {
		try {
			let assetASymbol = this.translateSymbol(_.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(_.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Set empty `referenceId` as current time
			if (_.referenceId === 0) {
				_.referenceId = Math.floor(Date.now());
			}

			let responseJson = await this.handle?.api(

				// Type
				'AddOrder',

				// Options
				{

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
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}
				
				// Confirmed
				if (responseJson.result.count > 0) {
					_.confirmStatus = OrderStatus.Open;
					_.confirmTime = Date.now();
					_.transactionId = responseJson.result.txid;
				}
			}
		} catch (error) {
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return _;
	}

	async closeOrder (
		_: OrderItem,
	) {
		try {
			let responseJson = await this.handle?.api(

				// Type
				'CloseOrder',

				// Options
				{

					// Transaction ID
					txid: _.transactionId,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Verbose);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					} 
				}

				// Response either in pending state, or count is zero
				if (
					responseJson.result.pending === true
					|| responseJson.result.count === 0
				) {
					_.confirmStatus = OrderStatus.Pending;
				}
				
				// Successful
				else {
					_.confirmStatus = OrderStatus.Close;
				}

				_.confirmTime = Date.now();
			}
		} catch (error) {
			Bot.log(`Order '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return _;
	}

	async editOrder (
		_: OrderItem,
	) {
		try {
			let assetASymbol = this.translateSymbol(_.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(_.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Set empty `referenceId` as current time
			if (_.referenceId === 0) {
				_.referenceId = Math.floor(Date.now());
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
					txid: _.transactionId,

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
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}

				// Get latest transaction ID index
				let lastTransactionIdx = 0;
				if (_.transactionId?.length) {
					lastTransactionIdx = _.transactionId.length - 1;
				}

				// Response carries previous, new foreign 
				// transaction ID, and status is `Ok`
				if (
					responseJson.result.originaltxid === _.transactionId[lastTransactionIdx]
					&& responseJson.result.txid
					&& responseJson.result.status === 'Ok'
				) {
					_.confirmStatus = OrderStatus.Edit;
					_.confirmTime = Date.now();
					_.transactionId?.push(responseJson.result.txid);
				}

				// Throw error
				else if (responseJson.result.status === 'Err') {
					throw responseJson.result.error_message;
				}

			}
		} catch (error) {
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return _;
	}

	async syncOrder (
		_: OrderItem,
	) {
		try {
			let assetASymbol = this.translateSymbol(_.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(_.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Set empty `referenceId` as current time
			if (_.referenceId === 0) {
				_.referenceId = Math.floor(Date.now());
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
					txid: _.transactionId,

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
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}

				// Get latest transaction ID index
				let lastTransactionIdx = 0;
				if (_.transactionId?.length) {
					lastTransactionIdx = _.transactionId.length - 1;
				}

				// Response carries previous, new foreign 
				// transaction ID, and status is `Ok`
				if (
					responseJson.result.originaltxid === _.transactionId[lastTransactionIdx]
					&& responseJson.result.txid
					&& responseJson.result.status === 'Ok'
				) {
					_.confirmStatus = OrderStatus.Edit;
					_.confirmTime = Date.now();
					_.transactionId?.push(responseJson.result.txid);
				}

				// Throw error
				else if (responseJson.result.status === 'Err') {
					throw responseJson.result.error_message;
				}

			}
		} catch (error) {
			Bot.log(`Exchange '${this.name}'; ${JSON.stringify(error)}`, Log.Err);
		}

		return _;
	}

	async syncChart (
		chart: ChartItem,
	) {
		if (!this.compat(chart))
			throw ('This chart belongs to a different exchange.');

		try {
			let assetASymbol = this.translateSymbol(chart.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(chart.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair: string = `X${assetASymbol}X${assetBSymbol}`;

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
		let ordertype: string;

		switch (order.type) {

			case OrderType.Limit:
				ordertype = 'limit';
				break;

			case OrderType.StopLoss:
				ordertype = 'stop-loss';
				break;

			case OrderType.TakeProfit:
				ordertype = 'take-profit';
				break;

			default:
				ordertype = 'market';
				break;
		}

		return ordertype;
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
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
		data: ExchangeData,
	) {
		super(data);

		const KrakenClient = require('kraken-api');
		this.handle = new KrakenClient(
			data.key,
			data.secret
		);
	}

	translateSymbol (
		symbol: string,
	) {
		if (this.symbols[symbol])
			return this.symbols[symbol];

		return symbol;
	}

	async createOrder (
		order: OrderItem,
	) {
		let orderResult: OrderItem = order;

		try {
			let assetASymbol = this.translateSymbol(order.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(order.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Set empty `referenceId` as current time
			if (order.referenceId === 0) {
				order.referenceId = Math.floor(Date.now() / 1000);
			}

			let responseJson = await this.handle?.api(

				// Type
				'AddOrder',

				// Options
				{

					// Order type
					ordertype: this.getOrderTypeValue(order),

					// Order type
					pair: pair,

					// Order price
					price: order.price,

					// Order direction (buy/sell)
					type: order.side === OrderSide.Buy ? 'buy' : 'sell',

					// Set order `referenceId`
					userref: order.referenceId,

					// Validate inputs only. Do not submit order.
					validate: order.dryrun,

					// Order quantity in terms of the base asset
					volume: order.quantity,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Debug);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}

				orderResult.confirmed = false;
				
				// Confirmed
				if (responseJson.result.count > 0) {
					orderResult.confirmed = true;
					orderResult.status = OrderStatus.Open;
					orderResult.transactionId = responseJson.result.txid;
				}
			}
		} catch (error) {
			console.error(error);
		}

		return orderResult;
	}

	async cancelOrder (
		order: OrderItem,
	) {
		let orderResult: OrderItem = order;

		try {
			let responseJson = await this.handle?.api(

				// Type
				'CancelOrder',

				// Options
				{

					// Transaction ID
					txid: order.transactionId,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Debug);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}

				orderResult.confirmed = false;
				
				// Response contains a count of one, with no pending state
				if (
					responseJson.result.count === 1
					&& responseJson.result.pending === false
				) {
					orderResult.confirmed = true;
					orderResult.status = OrderStatus.Cancelled;
				}
			}
		} catch (error) {
			console.error(error);
		}

		return orderResult;
	}

	async editOrder (
		order: OrderItem,
	) {
		let orderResult: OrderItem = order;

		try {
			let assetASymbol = this.translateSymbol(order.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(order.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Set empty `referenceId` as current time
			if (order.referenceId === 0) {
				order.referenceId = Math.floor(Date.now() / 1000);
			}

			let responseJson = await this.handle?.api(

				// Type
				'EditOrder',

				// Options
				{

					// Order type
					ordertype: this.getOrderTypeValue(order),

					// Order type
					pair: pair,

					// Order price
					price: order.price,

					// Transaction ID
					txid: order.transactionId,

					// Order direction (buy/sell)
					type: order.side === OrderSide.Buy ? 'buy' : 'sell',

					// Set order `referenceId`
					userref: order.referenceId,

					// Validate inputs only. Do not submit order.
					validate: order.dryrun,

					// Order quantity in terms of the base asset
					volume: order.quantity,
				}
			);

			// Log raw response
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Debug);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}

				orderResult.confirmed = false;

				// Response carries previous, new foreign 
				// transaction ID, and status is `Ok`
				if (
					responseJson.result.originaltxid === order.transactionId
					&& responseJson.result.txid
					&& responseJson.result.status === 'Ok'
				) {
					orderResult.confirmed = true;
					orderResult.transactionId = responseJson.result.txid;
				}

				// Throw error
				else if (responseJson.result.status === 'Err') {
					throw responseJson.result.error_message;
				}

			}
		} catch (error) {
			console.error(error);
		}

		return orderResult;
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
			Bot.log(`Exchange '${this.name}' response; ` + JSON.stringify(responseJson), Log.Debug);

			let etlData: ChartCandleData = {
				close: [],
				high: [],
				low: [],
				open: [],
				openTime: [],
				tradeCount: [],
				volume: [],
				weightedAvePrice: [],
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
					etlData.weightedAvePrice?.push(p[5]);
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
		data: ExchangeData,
	): KrakenItem {
		let item = new KrakenItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
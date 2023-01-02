import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';
import { OrderSide, OrderItem, OrderType } from '../Order';

const fs = require('fs');

export class KrakenItem extends ExchangeItem implements ExchangeInterface {
	handle?: {
		api: (type: string, options: object) => {
			result: any,
			error?: string[],
		},
	};

	// Omitting 4th char prefix of `X`, added on `pair` assignment
	symbols: any = {
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
		if (this.symbols.hasOwnProperty(symbol))
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

			// TODO: Order types order.type
			let ordertype = 'market';

			let responseJson = await this.handle?.api(

				// Type
				'AddOrder',

				// Options
				{
					pair: pair,
					ordertype: ordertype,
					type: order.side === OrderSide.Buy ? 'buy' : 'sell',
					volume: order.amount,
				}
			);

			if (responseJson) {
				if (responseJson.error) {
					for (let i = 0; i < responseJson.error.length; i++) {
						Bot.log(responseJson.error[i], Log.Err);
					}
				}
				order.confirmed = true;
				order.transactionId = responseJson.result.txid;
			}
		} catch (error) {
			console.error(error);
		}

		return orderResult;
	}

	// async cancelOrder (
	// 	order: OrderItem,
	// ) {
	// 	let orderResult: OrderItem = order;
	// 	return orderResult;
	// }

	// async editOrder (
	// 	order: OrderItem,
	// ) {
	// 	let orderResult: OrderItem = order;
	// 	return orderResult;
	// }

	async syncChart (
		chart: ChartItem,
	) {
		if (!this.compat(chart))
			throw ('This chart belongs to a different exchange.');

		try {
			let assetASymbol = this.translateSymbol(chart.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(chart.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Kraken intervals are in minutes
			let interval = chart.candleTime / 60;

			// TODO: Check exisiting data points, and adjust to continue from last on storage
			let maxCandles = Math.ceil(
				((Date.now() - chart.lastUpdateTime) / 1000)
				/ chart.candleTime
			);
			if (maxCandles > 720)
				maxCandles = 720;

			// Default to the last 100 data points (candles), round down to nearest day start
			let date = new Date();
			date.setTime(
				(date.getTime() - (date.getTimezoneOffset() * 60000))
				- ((chart.candleTime * maxCandles)* 1000));
			date.setUTCHours(0);
			date.setUTCMinutes(0);
			date.setUTCSeconds(0);
			date.setUTCMilliseconds(0);

			let since = date.getTime() / 1000;

			// Bot.log(`since: ${since}`);
			// return true;

			let responseJson = await this.handle?.api(

				// Type
				'OHLC',

				// Options
				{
					interval: interval,
					pair: pair,
					since: since,
				}
			);
			// Bot.log(JSON.stringify(responseJson));

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
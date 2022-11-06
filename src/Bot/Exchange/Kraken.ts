import { Bot } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeData, ExchangeInterface, ExchangeItem } from '../Exchange';

const fs = require('fs');

export class KrakenItem extends ExchangeItem implements ExchangeInterface {

	// Omitting 4th char prefix of `X`, added on `pair` assignment
	symbols = {
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

	async primeChart (
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

			// console.log(`since: ${since}`);
			// return true;

			let responseJson: any = await this.handle?.api(

				// Type
				'OHLC',

				// Options
				{
					interval: interval,
					pair: pair,
					since: since,
				}
			);

			let etlData = this.etl(
				responseJson
			);
			
			this.refreshChart(
				chart,
				etlData,
			);
		} catch (error) {
			console.error(error);
		}
	}

	etl (
		rawData: object,
	) {
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
		for (let i = 0; i < rawData.result[pair].length; i++) {
			let p: any = rawData.result[pair][i];
			// console.log(p[0]);return;
			etlData.close.push(p[4]);
			etlData.high.push(p[2]);
			etlData.low.push(p[3]);
			etlData.open.push(p[1]);
			etlData.openTime.push(p[0]);
			etlData.tradeCount.push(p[7]);
			etlData.volume.push(p[6]);
			etlData.weightedAvePrice.push(p[5]);
		}

		// console.log(etlData);return;
		return etlData;
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
			date.setUTCMinutes(0);
			date.setUTCSeconds(0);
			date.setUTCMilliseconds(0);

			let since = date.getTime() / 1000;

			console.log(`Requesting data since: ${date.toISOString()}`);
			// return true;

			// console.log(`Now: ${Date.now()}`);
			// console.log(`chart.lastDate: ${chart.lastUpdateTime}`);
			// console.log(`maxCandles: ${maxCandles}`);
			return;

			let responseJson: any = await this.handle?.api(

				// Type
				'OHLC',

				// Options
				{
					interval: interval,
					pair: pair,
					since: since,
				}
			);

			let etlData = this.etl(
				responseJson
			);
			
			this.refreshChart(
				chart,
				etlData,
			);
		} catch (error) {
			console.error(error);
		}
	}
}

export const Kraken = {
	new (
		data: ExchangeData,
	) {
		let item = new KrakenItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
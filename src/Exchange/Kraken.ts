import { Chart, ChartCandleData } from '../Chart';
import { Exchange, ExchangeData, ExchangeInterface } from '../Exchange';

const fs = require('fs');

export class Kraken extends Exchange implements ExchangeInterface {

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
		if (this.symbols[symbol])
			return this.symbols[symbol];

		return symbol;
	}

	async primeChart (
		chart: Chart,
	) {
		if (!this.compat(chart))
			throw ('This chart belongs to a different exchange.');

		try {
			let assetASymbol = this.translateSymbol(chart.pair.a.symbol);
			let assetBSymbol = this.translateSymbol(chart.pair.b.symbol);

			// All response assets are prefixed with an `X`. Add one to ease lookups
			let pair = `X${assetASymbol}X${assetBSymbol}`;

			// Default to 900 seconds (15 min)
			if (!chart.candleTime)
				chart.candleTime = 900;

			// Kraken intervals are in minutes
			let interval = chart.candleTime / 60;

			// TODO: Check exisiting data points, and adjust to continue from last on storage
			let maxCandles = 720;

			// Default to the last 100 data points (candles), round down to nearest day start
			let date = new Date();
			date.setTime(date.getTime() - ((chart.candleTime * maxCandles) * 1000));
			date.setUTCHours(0);
			date.setUTCMinutes(0);
			date.setUTCSeconds(0);

			let since = date.getTime() / 1000;

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
			for (let i = 0; i < responseJson.result[pair].length; i++) {
				let p: any = responseJson.result[pair][i];
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

			this.refreshChart(
				chart,
				etlData,
			);
		} catch (error) {
			console.error(error);
		}
	}

	syncChart (
		chart: Chart,
	) {
		
	}
}
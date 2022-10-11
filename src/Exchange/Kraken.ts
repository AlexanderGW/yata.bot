import { Chart, ChartCandleData } from '../Chart';
import { Exchange, ExchangeData, ExchangeInterface } from '../Exchange';

const fs = require('fs');

export class Kraken extends Exchange implements ExchangeInterface {
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

	}

	primeChart (
		chart: Chart,
	) {
		if (!this.compat(chart))
			throw ('This chart belongs to a different exchange.');

		try {
			// response = await this.handle?.api(

			// 	// Type
			// 	'OHLC',

			// 	// Options
			// 	{
			// 		pair: `${chart.pair.a}${chart.pair.b}`
			// 	}
			// );

			// TESTNG
			let response: any = fs.readFileSync('./storage/test.json', 'utf8', function (err: object,data: object) {
                if (err) console.error(err);
            });
            let responseJson = JSON.parse(response);

			let pair = 'XXDGXXBT';
			// TESING

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

			// Extract, transform, load response to chart
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
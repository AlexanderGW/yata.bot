import * as dotenv from 'dotenv';

import { Kraken } from './Exchange/Kraken';
import { Asset } from './Asset';
import { Pair } from './Pair';
import { Analysis } from './Analysis';
import { Chart } from './Chart';
import { Strategy } from './Strategy';
import { Scenario } from './Scenario';

dotenv.config();

const fs = require('fs');

// TODO: Monitor strategy signals within a timeframe; At Nth, trigger buy, sell, SL, etc.
// TODO: Currently parses the entire dataset, implement a progressive chart for active strategies.

// Create Kraken exchange client
const exchangeKraken = new Kraken({
	name: 'Kraken',
	key: process.env.KRAKEN_CLIENT_KEY,
	secret: process.env.KRAKEN_CLIENT_SECRET,
});

// Create ETH asset
let assetEth = new Asset({
	symbol: 'ETH'
});

// Create BTC asset
let assetBtc = new Asset({
	symbol: 'BTC'
});

// Create ETH BTC pair of assets
let pairEthBtc = new Pair({
	a: assetEth,
	b: assetBtc
});

// Create a ETHBTC pair chart, and 1 minute, for Kraken exchange data
let chartKrakenEthBtc4h = new Chart({
	exchange: exchangeKraken,
	pair: pairEthBtc,
	pollTime: 300, // 5m in seconds
	candleTime: 14400 // 4h in seconds
});

// Push Kraken exchange data to chart (if exchange/chart are compatible)
try {
	// Request from Kraken
	// exchangeKraken.primeChart(
	// 	chartKrakenEthBtc4h
	// );

	// Load from storage
	let response: any = fs.readFileSync(
		'./test/2022-10-15-ethbtc-4h-700.json',
		'utf8',
		function (err: object,data: object) {
	    	if (err)
				console.error(err);
		}
	);

	let responseJson = JSON.parse(response);
	if (responseJson) {
		exchangeKraken.refreshChart(
			chartKrakenEthBtc4h,
			responseJson,
		);
	}
	// console.log(response);
} catch (err) {
	console.error(err);
}

// Create an existing position on exchange
// let pos1 = new Position({
// 	exchange: exchangeKraken,
// 	pair: pairEthBtc,
// 	amount: '2.23523552'
// });

// Relative Strength Index (RSI) 100
let analysisRsi14 = new Analysis({
	name: 'RSI',
	config: {
		inRealField: 'close',
		optInTimePeriod: 14,
		startIndex: 14,
	}
});
// console.log(analysisRsi14.explain());

// Exponential Moving Average (SMA) 20
let analysisEma20 = new Analysis({
	name: 'EMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
	}
});
// console.log(analysisEma20.explain());

// Exponential Moving Average (SMA) 100
let analysisEma100 = new Analysis({
	name: 'EMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 100,
	}
});

// Simple Moving Average (SMA) 20
let analysisSma20 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
		// startIndex: 20,
	}
});
// console.log(analysisSma20.explain());

// Simple Moving Average (SMA) 50
let analysisSma50 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 50,
	}
});

// Simple Moving Average (SMA) 200
let analysisSma200 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 200,
	}
});

// Bolinger Bands (dependent on SMA20 result)
let analysisBolingerBands = new Analysis({
	name: 'BBANDS',
	config: {
		inRealAnalysis: analysisSma20,
		inRealField: 'outReal',
		optInTimePeriod: 20,
		startIndex: 21,
	}
});
// console.log(analysisBolingerBands.explain());

// Moving Average Convergence/Divergence (MACD) with defaults
let analysisMacd = new Analysis({
	name: 'MACD',
	config: {
		inRealField: 'close',
	}
});
// console.log(analysisMacd.explain());

// Scenario for analysis events
let scenarioBullishRsiOversold = new Scenario({
	analysis: [
		analysisRsi14
	],
	condition: [

		// Previous candle
		[
			['outReal', '<=', 30],
		],

		// Latest candle
		[
			// ['open', '<=', 0.067],
			['outReal', '>=', 30],
		],
	],
	name: 'scenarioBullishRsiOversold',
});

let scenarioBullishMacdCrossover = new Scenario({
	analysis: [
		analysisMacd
	],
	condition: [

		// Previous candle
		[
			['outMACDHist', '<', 0],
		],

		// Latest candle
		[
			['outMACDHist', '>=', 0],
		],

		// Fields: outMACD, outMACDSignal, outMACDHist
	],
	name: 'scenarioBullishMacdCrossover',
});

let scenarioBolingerOverreach = new Scenario({
	analysis: [
		analysisSma20, // Must execute before `analysisBolingerBands`
		analysisBolingerBands, // Depends on `analysisSma20` result
	],
	condition: [

		// Three candles back
		[
			['close', '<', 'outRealLowerBand'],
		],

		// Two...
		[
			['close', '<', 'outRealLowerBand'],
		],

		// Previous candle
		[
			['close', '<', 'outRealLowerBand'],
		],

		// Latest candle
		[
			['close', '>=', 'outRealLowerBand'],
		],

		// Fields: outRealUpperBand, outRealLowerBand, outRealMiddleBand
	],
	name: 'scenarioBolingerOverreach',
});

// Candles closing about the 20 SMA
let scenarioSma20CrossUp = new Scenario({
	analysis: [
		analysisSma20,
	],
	condition: [

		// Latest candle
		[
			['close', '<', 'outReal'],
		],

		// Latest candle
		[
			['close', '<', 'outReal'],
		],

		// Latest candle
		[
			['close', '>=', 'outReal'],
		],

		// Latest candle
		[
			['close', '>=', 'outReal'],
		],
	],
	name: 'scenarioSma20CrossUp',
});

// RSI crossing upward into 30 range
let stratBullishRsiOversold = new Strategy({
	action: [
		[scenarioBullishRsiOversold],
	],
	analysis: [
		analysisRsi14,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBullishRsiOversold',
});

// MACD crossing upward
let stratBullishMacdCrossover = new Strategy({
	action: [
		[scenarioBullishMacdCrossover, stratBullishRsiOversold],
		// [scenarioBullishMacdCrossover],
	],
	analysis: [
		analysisMacd,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBullishMacdCrossover',
});

let stratBolingerOverreach = new Strategy({
	action: [
		[scenarioBolingerOverreach, stratBullishRsiOversold],
		// [scenarioBolingerOverreach],
	],
	analysis: [
		analysisSma20, // Must execute before `analysisBolingerBands`
		analysisBolingerBands, // Depends on `analysisSma20` result
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBolingerOverreach',
});

let stratSma20CrossUp = new Strategy({
	action: [
		[scenarioSma20CrossUp],
	],
	analysis: [
		analysisSma20,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBolingerOverreach',
});

// Execute all strategy analysis
try {
	// stratBullishMacdCrossover.execute();
	stratBullishRsiOversold.execute();
	// stratBolingerOverreach.execute();
	// stratSma20CrossUp.execute();
} catch (err) {
	console.error(err);
}
import * as dotenv from 'dotenv';

import { Kraken } from './Bot/Exchange/Kraken';
import { Asset } from './Bot/Asset';
import { Pair } from './Bot/Pair';
import { Chart } from './Bot/Chart';
import { Strategy } from './Bot/Strategy';
import {
	BollingerBullishLowerCross as scenarioBollingerBullishLowerCross,
	BullishMacd12_26_9Crossover as scenarioBullishMacdDefaultCrossover,
	BullishRsiOversold as scenarioBullishRsiOversold,
	analysisSma20CrossUp as scenarioanalysisSma20CrossUp
} from './Helper/Scenario';
import {
	BollingerDefault as analysisBollingerDefault,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from './Helper/Analysis';
import { Window } from './Bot/Window';

dotenv.config();

const fs = require('fs');

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
} catch (err) {
	console.error(err);
}

// Create an existing position on exchange
// let pos1 = new Position({
// 	exchange: exchangeKraken,
// 	pair: pairEthBtc,
// 	amount: '2.23523552'
// });

// RSI crossing upward into 30 range
let stratBullishRsiOversold = new Strategy({
	action: [
		[scenarioBullishRsiOversold],
	],
	analysis: [
		analysisRsi14,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishRsiOversold',
});

// MACD crossing upward
let stratBullishMacdDefaultCrossover = new Strategy({
	action: [

		// Trigger another strategy, if this scenario matches
		[scenarioBullishMacdDefaultCrossover, stratBullishRsiOversold],
		// [scenarioBullishMacdDefaultCrossover],
	],
	analysis: [
		analysisMacd12_26_9,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishMacdDefaultCrossover',
});

let stratBullishBollingerLowerCross = new Strategy({
	action: [

		// Trigger another strategy, if this scenario matches
		[scenarioBollingerBullishLowerCross, stratBullishRsiOversold],
	],
	analysis: [
		analysisSma20, // Must execute before `analysisBollingerDefault`
		analysisBollingerDefault, // Depends on `analysisSma20` result
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishBollingerLowerCross',
});

let stratBullishSma20Cross = new Strategy({
	action: [
		[scenarioanalysisSma20CrossUp],
	],
	analysis: [
		analysisSma20,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishBollingerLowerCross',
});

let defaultWindow = new Window({
	strategy: [
		// stratBullishMacdDefaultCrossover,
		// stratBullishRsiOversold,
		stratBullishBollingerLowerCross,
		// stratBullishSma20Cross,
	],
});

setInterval(function() {
	defaultWindow.execute();
}, 1000);
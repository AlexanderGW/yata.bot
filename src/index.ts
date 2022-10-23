import * as dotenv from 'dotenv';

import { Kraken } from './Bot/Exchange/Kraken';
import { Asset } from './Bot/Asset';
import { Pair } from './Bot/Pair';
import { Chart } from './Bot/Chart';
import { Strategy } from './Bot/Strategy';
import { BollingerBullishLowerCross, BullishMacdCrossover, BullishRsiOversold, Sma20CrossUp } from './Helper/Scenario';
import { BollingerBands20, Macd, Rsi14, Sma20 } from './Helper/Analysis';
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
		[BullishRsiOversold],
	],
	analysis: [
		Rsi14,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBullishRsiOversold',
});

// MACD crossing upward
let stratBullishMacdCrossover = new Strategy({
	action: [

		// Trigger another strategy, if this scenario matches
		[BullishMacdCrossover, stratBullishRsiOversold],
		// [scenarioBullishMacdCrossover],
	],
	analysis: [
		Macd,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBullishMacdCrossover',
});

let stratBollingerBullishLowerCross = new Strategy({
	action: [

		// Trigger another strategy, if this scenario matches
		[BollingerBullishLowerCross, stratBullishRsiOversold],
	],
	analysis: [
		Sma20, // Must execute before `BollingerBands20`
		BollingerBands20, // Depends on `Sma20` result
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBollingerBullishLowerCross',
});

let stratSma20CrossUp = new Strategy({
	action: [
		[Sma20CrossUp],
	],
	analysis: [
		Sma20,
	],
	chart: chartKrakenEthBtc4h,
	name: 'stratBollingerBullishLowerCross',
});

let defaultWindow = new Window({
	strategy: [
		// stratBullishMacdCrossover,
		// stratBullishRsiOversold,
		stratBollingerBullishLowerCross,
		// stratSma20CrossUp,
	],
});

setInterval(function() {
	defaultWindow.execute();
}, 1000);
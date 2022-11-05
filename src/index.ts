import * as dotenv from 'dotenv';

import { Asset } from './Bot/Asset';
import { Bot } from './Bot/Bot';
import { Chart } from './Bot/Chart';
import { Kraken } from './Bot/Exchange/Kraken';
import { Pair } from './Bot/Pair';
import { Strategy } from './Bot/Strategy';
import { Timeframe } from './Bot/Timeframe';

// Helpers
import {
	BollingerBullishLowerCrossover as scenarioBollingerBullishLowerCrossover,
	BullishMacd12_26_9Crossover as scenarioBullishMacd12_26_9Crossover,
	BullishRsi14Oversold as scenarioBullishRsi14Oversold,
	Sma20CrossUp as scenarioSma20CrossUp
} from './Helper/Scenario';
import {
	Bollinger20 as analysisBollinger20,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from './Helper/Analysis';

dotenv.config();

const fs = require('fs');

// TODO: UNIT TESTING - CHAI?

// Create Kraken exchange client
const exchangeKraken = Kraken.new({
	name: 'Kraken',
	key: process.env.KRAKEN_CLIENT_KEY,
	secret: process.env.KRAKEN_CLIENT_SECRET,
});

// Create ETH asset
let assetEth = Asset.new({
	exchange: exchangeKraken,
	symbol: 'ETH'
});

// Create BTC asset
let assetBtc = Asset.new({
	exchange: exchangeKraken,
	symbol: 'BTC'
});

// Create ETH BTC pair of assets
let pairEthBtc = Pair.new({
	a: assetEth,
	b: assetBtc
});

// Create a ETHBTC pair chart, and 1 minute, for Kraken exchange data
let chartKrakenEthBtc4h = Chart.new({
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
		function (
			err: object,
			data: object
		) {
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
// let pos1 = Position.new({
// 	exchange: exchangeKraken,
// 	pair: pairEthBtc,
// 	amount: '2.23523552'
// });

// RSI crossing upward into 30 range
let stratBullishRsi14Oversold = Strategy.new({
	action: [
		[scenarioBullishRsi14Oversold],
	],
	analysis: [
		analysisRsi14,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishRsi14Oversold',
});

// MACD crossing upward
let stratBullishMacd12_26_9Crossover = Strategy.new({
	action: [

		// Trigger another strategy, if this scenario matches
		[scenarioBullishMacd12_26_9Crossover, stratBullishRsi14Oversold],
		// [scenarioBullishMacd12_26_9Crossover],
	],
	analysis: [
		analysisMacd12_26_9,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishMacd12_26_9Crossover',
});

let stratBullishBollinger20LowerCross = Strategy.new({
	action: [

		// Trigger another strategy, if this scenario matches
		// [scenarioBollingerBullishLowerCrossover, stratBullishRsi14Oversold],
		[scenarioBollingerBullishLowerCrossover],
	],
	analysis: [
		analysisSma20, // Must execute before `analysisBollinger20`
		analysisBollinger20, // Depends on `analysisSma20` result
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishBollingerLowerCross',
});

let stratBullishSma20Cross = Strategy.new({
	action: [
		[scenarioSma20CrossUp],
	],
	analysis: [
		analysisSma20,
	],
	chart: chartKrakenEthBtc4h,
	name: 'BullishSma20Cross',
});

// Timeframes will trigger by default
let defaultTimeframe = Timeframe.new({
	// active: false,
	intervalTime: 1000, // 1 second
	maxTime: 86400000 * 100, // last 100 days
	strategy: [
		// stratBullishMacd12_26_9Crossover,
		// stratBullishRsi14Oversold,
		stratBullishBollinger20LowerCross,
		// stratBullishSma20Cross,
	],
});

// Timeframes will trigger by default
let testTimeframe = Timeframe.new({
	// active: false,
	intervalTime: 1500, // 1 second
	maxTime: 86400000 * 50, // last 50 days
	strategy: [
		// stratBullishMacd12_26_9Crossover,
		stratBullishRsi14Oversold,
		// stratBullishBollinger20LowerCross,
		// stratBullishSma20Cross,
	],
});

// Check pot, allow action of fixed val, or %
const actionEthBtcBuy = () => {
	console.log(`do: actionEthBtcBuy`);
};

// TODO: Fix issue with multiple timeframes
// signal results only show for one timeframe - others are missing

Bot.subscribe({
	action: actionEthBtcBuy,
	chart: chartKrakenEthBtc4h,
	condition: [
		['total', '>=', '3'],
	],
	// event: BotEvent.TimeframeResult,
	name: 'buyEthBtcKraken',
	timeframeAny: [
		defaultTimeframe,
		testTimeframe,
	],
});

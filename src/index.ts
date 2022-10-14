import { Kraken } from './Exchange/Kraken';
import { Asset } from './Asset';
import { Pair } from './Pair';
import { Analysis } from './Analysis';
import { Chart } from './Chart';
import { Strategy } from './Strategy';
import { Scenario } from './Scenario';

// --------------------------------------------------------

// Create Kraken exchange client
const exchangeKraken = new Kraken({
	name: 'Kraken',
	key: '',
	secret: '',
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
console.log(analysisMacd.explain());

// Create a ETHBTC pair chart, and 1 minute, for Kraken exchange data
let chartKrakenEthBtc4h = new Chart({
	exchange: exchangeKraken,
	pair: pairEthBtc,
	pollTime: 300, // 5m in seconds
	candleTime: 14400 // 4h in seconds
});

// Push Kraken exchange data to chart (if exchange/chart are compatible)
try {
	exchangeKraken.primeChart(
		chartKrakenEthBtc4h
	);
} catch (err) {
	console.error(err);
}

// Scenario for analysis events
let scenarioBullishRsiOversold = new Scenario({
	analysis: [
		analysisRsi14
	],
	name: 'scenarioBullishRsiOversold',
	condition: [
		[
			['outReal', '<=', '30'],
		],
		[
			['outReal', '>', '30'],
		],
	]
});

let scenarioBullishMacdCrossover = new Scenario({
	analysis: [
		analysisMacd
	],
	name: 'scenarioBullishMacdCrossover',
	condition: [

		// Previous candle
		[
			['outMACDHist', '<=', '0'],
		],

		// Latest candle
		[
			['outMACDHist', '>', '0'],
			['outMACDHist', '<', '4'],
		],
	]
});

// TODO: Trigger an scenario, on a TA event
// make an scenario (collection of ok TA metrics) fire a callback? which can contain more complex shite
// how best to handle this
// what if we want to check multiple candleTimes, before final decision

let stratFoobar = new Strategy({
	analysis: [
		analysisRsi14,
	],
	chart: chartKrakenEthBtc4h,
	action: [
		[scenarioBullishRsiOversold],
	],
});

// Create new stategy
let stratTopLevel = new Strategy({
	analysis: [
		// analysisSma20, // Must execute before `analysisBolingerBands`
		// analysisBolingerBands, // Depends on `analysisSma20` result
		// analysisEma20,
		// analysisEma100,
		analysisMacd,
		// analysisRsi14,
		// analysisSma50,
		// analysisSma200,
	],
	chart: chartKrakenEthBtc4h,
	action: [
		[scenarioBullishMacdCrossover, stratFoobar]
	],
});

// Execute all strategy analysis
try {
	stratTopLevel.execute();
} catch (err) {
	console.error(err);
}





// let strat1Result1 = strat1.getResult(analysisRsi14);
// console.log(strat1Result1);

// let strat1Result2 = strat1.getResult(analysisSma50);
// console.log(strat1Result2);

// let strat1Result3 = strat1.getResult(analysisSma200);
// console.log(strat1Result3);

// let strat1Result4 = strat1.getResult(analysisBolingerBands);
// console.log(strat1Result4);

// let strat1Result5 = strat1.getResult(analysisMacd);
// console.log(strat1Result5);

// Change chart and run strategy again
// try {
// 	strat1.setChart(chartKrakenEthBtc1h); // i.e. ETHBTC at 1 hour intervals
// 	strat1.execute();
// } catch (err) {
// 	console.error(err);
// }
// console.log(strat1Result2);
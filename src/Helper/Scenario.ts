import { Scenario } from "../Bot/Scenario";
import {
	Bollinger20 as analysisBollinger20,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from "../Helper/Analysis";

// Scenario for analysis events
export const BullishRsi14Oversold = new Scenario({
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
	name: 'scenarioBullishRsi14Oversold',
});

export const BullishMacd12_26_9Crossover = new Scenario({
	analysis: [
		analysisMacd12_26_9,
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
	name: 'scenarioBullishMacd12_26_9Crossover',
});

export const BollingerBullishLowerCrossover = new Scenario({
	analysis: [
		analysisSma20, // Must execute before `analysisBollinger20`
		analysisBollinger20, // Depends on `analysisSma20` result
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
	name: 'scenarioBollingerBullishLowerCrossover',
});

// Candles closing about the 20 SMA
export const Sma20CrossUp = new Scenario({
	analysis: [
		analysisSma20,
	],
	condition: [

		// Three candles back
		[
			['close', '<', 'outReal'],
		],

		// Two...
		[
			['close', '<', 'outReal'],
		],

		// Previous candle
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
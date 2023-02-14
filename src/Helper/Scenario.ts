import { Scenario } from "../Bot/Scenario";
import {
	Bollinger20 as analysisBollinger20,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from "../Helper/Analysis";

// Scenario for analysis events
export const BullishRsi14Oversold = Scenario.new({
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

export const BullishMacd12_26_9Crossover = Scenario.new({
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

export const BollingerBullishLowerCrossover = Scenario.new({
	analysis: [
		analysisSma20, // Must execute before `analysisBollinger20`
		analysisBollinger20, // Depends on `analysisSma20` result
	],
	condition: [

		// Four candles back
		[
			['close', '<', 'outRealLowerBand'],
		],

		// Three...
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

export const BollingerBearishUpperCrossover = Scenario.new({
	analysis: [
		analysisSma20, // Must execute before `analysisBollinger20`
		analysisBollinger20, // Depends on `analysisSma20` result
	],
	condition: [

		// Four candles back
		[
			['close', '>', 'outRealUpperBand'],
		],

		// Three...
		[
			['close', '>', 'outRealUpperBand'],
		],

		// Two...
		[
			['close', '>', 'outRealUpperBand'],
		],

		// Previous candle
		[
			['close', '>', 'outRealUpperBand'],
		],

		// Latest candle
		[
			['close', '<=', 'outRealUpperBand'],
		],

		// Fields: outRealUpperBand, outRealLowerBand, outRealMiddleBand
	],
	name: 'scenarioBollingerBearishUpperCrossover',
});

// Closing about the 20 SMA
export const Sma20CrossUp = Scenario.new({
	analysis: [
		analysisSma20,
	],
	condition: [

		// Three...
		[
			['close', '<', 'outReal'],
		],

		// Two candles back
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

// Closing below the 20 SMA
export const Sma20CrossDown = Scenario.new({
	analysis: [
		analysisSma20,
	],
	condition: [

		// Three...
		[
			['close', '>', 'outReal'],
		],

		// Two candles back
		[
			['close', '>', 'outReal'],
		],

		// Previous candle
		[
			['close', '<=', 'outReal'],
		],

		// Latest candle
		[
			['close', '<=', 'outReal'],
		],
	],
	name: 'scenarioSma20CrossDown',
});
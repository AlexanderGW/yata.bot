import { Scenario } from "../Bot/Scenario";
import { BollingerBands20, Macd, Rsi14, Sma20 } from "../Helper/Analysis";

// Scenario for analysis events
export const BullishRsiOversold = new Scenario({
	analysis: [
		Rsi14
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

export const BullishMacdCrossover = new Scenario({
	analysis: [
		Macd,
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

export const BollingerBullishLowerCross = new Scenario({
	analysis: [
		Sma20, // Must execute before `BollingerBands20`
		BollingerBands20, // Depends on `Sma20` result
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
	name: 'scenarioBollingerBullishLowerCross',
});

// Candles closing about the 20 SMA
export const Sma20CrossUp = new Scenario({
	analysis: [
		Sma20,
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
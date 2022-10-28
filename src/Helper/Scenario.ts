import { Scenario } from "../Bot/Scenario";
import { analysisBollingerDefault, Macd12_26_9, analysisRsi14, analysisSma20 } from "../Helper/Analysis";

// Scenario for analysis events
export const BullishRsiOversold = new Scenario({
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

export const BullishMacd12_26_9Crossover = new Scenario({
	analysis: [
		Macd12_26_9,
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
	name: 'scenarioBullishMacdDefaultCrossover',
});

export const BollingerBullishLowerCross = new Scenario({
	analysis: [
		analysisSma20, // Must execute before `analysisBollingerDefault`
		analysisBollingerDefault, // Depends on `analysisSma20` result
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
export const analysisSma20CrossUp = new Scenario({
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
	name: 'scenarioanalysisSma20CrossUp',
});
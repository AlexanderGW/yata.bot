import { Scenario } from "../Bot/Scenario";
import {
	Bollinger20 as analysisBollinger20,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from "../Helper/Analysis";

export const Rsi14BearishOverbought = Scenario.new({
	analysis: [
		analysisRsi14
	],
	condition: [

		// Previous candle
		[
			['outReal', '>=', 70],
		],

		// Latest candle
		[
			['outReal', '<=', 70],
		],
	],
	name: 'scenarioRsi14BearishOversold',
});

export const Rsi14BearishOversold = Scenario.new({
	analysis: [
		analysisRsi14
	],
	condition: [

		// Previous candle
		[
			['outReal', '>=', 30],
		],

		// Latest candle
		[
			['outReal', '<=', 30],
		],
	],
	name: 'scenarioRsi14BearishOversold',
});

export const Macd12_26_9BearishCross = Scenario.new({
	analysis: [
		analysisMacd12_26_9,
	],
	condition: [

		// Previous candle
		[
			['outMACDHist', '>', 0],
		],

		// Latest candle
		[
			['outMACDHist', '<=', 0],
		],

		// Fields: outMACD, outMACDSignal, outMACDHist
	],
	name: 'scenarioMacd12_26_9BearishCross',
});

export const BollingerBearishUpperCross = Scenario.new({
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
	name: 'scenarioBollingerBearishUpperCross',
});

export const Sma20BearishCross = Scenario.new({
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
	name: 'scenarioSma20BearishCross',
});



export const Rsi14BullishOverbought = Scenario.new({
	analysis: [
		analysisRsi14
	],
	condition: [

		// Previous candle
		[
			['outReal', '<=', 70],
		],

		// Latest candle
		[
			['outReal', '>=', 70],
		],
	],
	name: 'scenarioRsi14BullishOversold',
});

export const Rsi14BullishOversold = Scenario.new({
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
			['outReal', '>=', 30],
		],
	],
	name: 'scenarioRsi14BullishOversold',
});

export const Macd12_26_9BullishCross = Scenario.new({
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
	name: 'scenarioMacd12_26_9BullishCross',
});

export const BollingerBullishLowerCross = Scenario.new({
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
	name: 'scenarioBollingerBullishLowerCross',
});

export const Sma20BullishCross = Scenario.new({
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
	name: 'scenarioSma20BullishCross',
});
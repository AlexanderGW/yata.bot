import { Analysis } from "../Bot/Analysis";

// Relative Strength Index (RSI) 14
export const Rsi14 = new Analysis({
	name: 'RSI',
	config: {
		inRealField: 'close',
		optInTimePeriod: 14,
		startIndex: 14,
	}
});
// console.log(analysisRsi14.explain());

// Exponential Moving Average (SMA) 20
export const Ema20 = new Analysis({
	name: 'EMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
	}
});
// console.log(analysisEma20.explain());

// Exponential Moving Average (SMA) 100
export const Ema100 = new Analysis({
	name: 'EMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 100,
	}
});

// Simple Moving Average (SMA) 20
export const Sma20 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
		// startIndex: 20,
	}
});
// console.log(analysisSma20.explain());

// Simple Moving Average (SMA) 50
export const Sma50 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 50,
	}
});

// Simple Moving Average (SMA) 200
export const Sma200 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		optInTimePeriod: 200,
	}
});

// Bollinger Bands (dependent on SMA20 result)
export const BollingerBands20 = new Analysis({
	name: 'BBANDS',
	config: {
		inRealAnalysis: Sma20,
		inRealField: 'outReal',
		optInTimePeriod: 20,
		startIndex: 21,
	}
});
// console.log(analysisBollingerBands.explain());

// Moving Average Convergence/Divergence (MACD) with defaults
export const Macd = new Analysis({
	name: 'MACD',
	config: {
		inRealField: 'close',
	}
});
// console.log(analysisMacd.explain());
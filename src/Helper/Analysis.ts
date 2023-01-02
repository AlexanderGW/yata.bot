import { Analysis } from "../Bot/Analysis";
import { Bot } from "../Bot/Bot";

// Relative Strength Index (RSI) 14
export const Rsi14 = Analysis.new({
	name: 'RSI',
	config: {
		inRealField: 'close',
		optInTimePeriod: 14,
		startIndex: 14,
	},
	type: 'RSI',
});
// Bot.log(analysisanalysisRsi14.explain);

// Exponential Moving Average (SMA) 20
export const Ema20 = Analysis.new({
	name: 'EMA20',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
	},
	type: 'EMA',
});
// Bot.log(analysisEma20.explain);

// Exponential Moving Average (SMA) 100
export const Ema100 = Analysis.new({
	name: 'EMA100',
	config: {
		inRealField: 'close',
		optInTimePeriod: 100,
	},
	type: 'EMA',
});

// Simple Moving Average (SMA) 20
export const Sma20 = Analysis.new({
	name: 'SMA20',
	config: {
		inRealField: 'close',
		optInTimePeriod: 20,
	},
	type: 'SMA',
});
// Bot.log(Sma20.explain);

// Simple Moving Average (SMA) 50
export const Sma50 = Analysis.new({
	name: 'SMA50',
	config: {
		inRealField: 'close',
		optInTimePeriod: 50,
	},
	type: 'SMA',
});

// Simple Moving Average (SMA) 200
export const Sma200 = Analysis.new({
	name: 'SMA200',
	config: {
		inRealField: 'close',
		optInTimePeriod: 200,
	},
	type: 'SMA',
});

// Bollinger Bands (dependent on SMA20 result)
export const Bollinger20 = Analysis.new({
	name: 'Bollinger20',
	config: {
		inRealAnalysis: Sma20,
		inRealField: 'outReal',
		optInTimePeriod: 20,
	},
	type: 'BBANDS',
});
// console.log(Bollinger20.explain);

// Moving Average Convergence/Divergence (MACD) with defaults
export const Macd12_26_9 = Analysis.new({
	name: 'MACDDefault12_26_9',
	config: {
		inRealField: 'close',
	},
	type: 'MACD',
});
// Bot.log(Macd12_26_9.explain);
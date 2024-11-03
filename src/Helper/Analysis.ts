import { Analysis } from "../YATAB/Analysis";
import { YATAB, Log } from "../YATAB/YATAB";

// Relative Strength Index (RSI) 14
export const Rsi14 = Analysis.new({
	name: 'RSI',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 14,
		startIndex: 14,
	},
	type: 'RSI',
});
// YATAB.log(Rsi14.explain, Log.Verbose);

// Exponential Moving Average (EMA) 20
export const Ema20 = Analysis.new({
	name: 'EMA20',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 20,
	},
	type: 'EMA',
});
// YATAB.log(Ema20.explain, Log.Verbose);

// Exponential Moving Average (EMA) 21
export const Ema21 = Analysis.new({
	name: 'EMA21',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 21,
	},
	type: 'EMA',
});
// YATAB.log(Ema21.explain, Log.Verbose);

// Exponential Moving Average (EMA) 100
export const Ema100 = Analysis.new({
	name: 'EMA100',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 100,
	},
	type: 'EMA',
});
// YATAB.log(Ema100.explain, Log.Verbose);

// Simple Moving Average (SMA) 20
export const Sma20 = Analysis.new({
	name: 'SMA20',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 20,
	},
	type: 'SMA',
});
// YATAB.log(Sma20.explain, Log.Verbose);

// Simple Moving Average (SMA) 50
export const Sma50 = Analysis.new({
	name: 'SMA50',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 50,
	},
	type: 'SMA',
});
// YATAB.log(Sma50.explain, Log.Verbose);

// Simple Moving Average (SMA) 200
export const Sma200 = Analysis.new({
	name: 'SMA200',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 200,
	},
	type: 'SMA',
});
// YATAB.log(Sma200.explain, Log.Verbose);

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
// console.log(Bollinger20.explain, Log.Verbose);

// Moving Average Convergence/Divergence (MACD) with defaults
export const Macd12_26_9 = Analysis.new({
	name: 'MACD12_26_9',
	config: {
		inRealField: 'candle.close',
	},
	type: 'MACD',
});
// YATAB.log(Macd12_26_9.explain, Log.Verbose);



export const configFields: {
	[key: string]: {
		[key: string]: any,
	},
	// 'RSI': {
	// 	inRealField: string,
	// 	optInTimePeriod: number | null,
	// 	startIndex: number | null,
	// }
	// 'BBANDS': {
	// 	inRealAnalysis: AnalysisItem,
	// }
} = {
	'RSI': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'SMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'EMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'WMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'MACD': {
		optInFastPeriod: 12,
		optInSlowPeriod: 26,
		optInSignalPeriod: 9,
		inRealField: 'candle.close',
	},
	'MACDEXT': {
		optInFastPeriod: 12,
		optInFastMAType: 0,
		optInSlowPeriod: 26,
		optInSlowMAType: 0,
		optInSignalPeriod: 9,
		optInSignalMAType: 0,
		inRealField: 'candle.close',
	},
	'MACDFIX': {
		optInSignalPeriod: 9,
		inRealField: 'candle.close',
	},
	'STOCH': {
		optInFastKPeriod: 5,
		optInSlowKPeriod: 3,
		optInSlowKMAType: 0,
		optInSlowDPeriod: 3,
		optInSlowDMAType: 0,
		inRealField: 'candle.close',
	},
	'STOCHF': {
		optInFastKPeriod: 5,
		optInFastDPeriod: 3,
		optInFastDMAType: 0,
		inRealField: 'candle.close',
	},
	'STOCHRSI': {
		optInTimePeriod: 14,
		optInFastKPeriod: 5,
		optInFastDPeriod: 3,
		optInFastDMAType: 0,
		inRealField: 'candle.close',
	},
	'ADX': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'ADXR': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'ATR': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'CCI': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'CMO': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'MFI': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'ROC': {
		optInTimePeriod: 10,
		inRealField: 'candle.close',
	},
	'ROCP': {
		optInTimePeriod: 10,
		inRealField: 'candle.close',
	},
	'ROCR': {
		optInTimePeriod: 10,
		inRealField: 'candle.close',
	},
	'ROCR100': {
		optInTimePeriod: 10,
		inRealField: 'candle.close',
	},
	'TRIX': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'ULTOSC': {
		optInTimePeriod1: 7,
		optInTimePeriod2: 14,
		optInTimePeriod3: 28,
		inRealField: 'candle.close',
	},
	'WILLR': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'BBANDS': {
		optInTimePeriod: 5,
		optInNbDevUp: 2,
		optInNbDevDn: 2,
		optInMAType: 0,
		inRealAnalysis: null,
		inRealField: 'candle.close',
	},
	'DEMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'HT_TRENDLINE': {
		inRealField: 'candle.close',
	},
	'KAMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'MAMA': {
		optInFastLimit: 0.5,
		optInSlowLimit: 0.05,
		inRealField: 'candle.close',
	},
	'MIDPRICE': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'SAR': {
		optInAcceleration: 0.02,
		optInMaximum: 0.2,
		inRealField: 'candle.close',
	},
	'T3': {
		optInTimePeriod: 5,
		optInVFactor: 0.7,
		inRealField: 'candle.close',
	},
	'TEMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'TRIMA': {
		optInTimePeriod: 30,
		inRealField: 'candle.close',
	},
	'WCLPRICE': {
		inRealField: 'candle.close',
	},
	'AD': {
		inRealField: 'candle.close',
	},
	'ADOSC': {
		optInFastPeriod: 3,
		optInSlowPeriod: 10,
		inRealField: 'candle.close',
	},
	'OBV': {
		inRealField: 'candle.close',
	},
	'LINEARREG': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'LINEARREG_ANGLE': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'LINEARREG_INTERCEPT': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'LINEARREG_SLOPE': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'TSF': {
		optInTimePeriod: 14,
		inRealField: 'candle.close',
	},
	'VAR': {
		optInTimePeriod: 5,
		optInNbDev: 1,
		inRealField: 'candle.close',
	},
	'TYPPRICE': {
		inRealField: 'candle.close',
	},
	'AVGPRICE': {
		inRealField: 'candle.close',
	},
	'MEDPRICE': {
		inRealField: 'candle.close',
	},
	'SINWAVEPHASE': {
		inRealField: 'candle.close',
	},
	'HT_SINE': {
		inRealField: 'candle.close',
	},
	'HT_DCPHASE': {
		inRealField: 'candle.close',
	},
	'HT_PHASOR': {
		inRealField: 'candle.close',
	},
	'HT_DCPERIOD': {
		inRealField: 'candle.close',
	},
};
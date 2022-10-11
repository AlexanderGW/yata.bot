import { Kraken } from './Exchange/Kraken';
import { Bot } from './Bot';

// --------------------------------------------------------

const exchangeKraken = new Kraken({
	name: 'Kraken',
	key: '',
	secret: '',
});
// const exchangeKraken = Bot.setExchange({
// 	name: 'Kraken',
// 	key: '',
// 	secret: '',
// });
// console.log(exchangeKraken.name);
// console.log(`exchangeKraken: ${exchangeKraken}`);
// console.log(Bot.getExchangeById(0));

let assetBtc = Bot.setAsset({
	symbol: 'BTC'
});
// console.log(`assetBtc: ${assetBtc}`);
// console.log(Bot.getAssetById(assetBtc));

let assetEth = Bot.setAsset({
	symbol: 'ETH'
});
// console.log(`assetEth: ${assetEth}`);
// console.log(Bot.getAssetById(assetEth));

let pairEthBtc = Bot.setPair({
	a: assetEth,
	b: assetBtc
});
// console.log(`pairEthBtc: ${pairEthBtc}`);
// console.log(Bot.getPairById(pairEthBtc));

// let pos1 = Bot.setPosition({
// 	exchange: exchangeKraken,
// 	pair: pairEthBtc,
// 	amount: '2.23523552'
// });
// console.log(`pos1Id: ${pos1}`);
// console.log(pos1);
// console.log(pos1.pair.a.symbol);

let analysisRsi14 = Bot.setAnalysis({
	name: 'RSI',
	config: {
		inRealField: 'close',
		optInTimePeriod: 14,
	}
});

let analysisSma20 = Bot.setAnalysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		// optInTimePeriod: 20,
	}
});
// console.log(analysisSma20.explain());

let analysisBolingerBands = Bot.setAnalysis({
	name: 'BBANDS',
	config: {
		inRealAnalysis: analysisSma20,
		inRealField: 'outReal',
		// optInTimePeriod: 5555,
		// optInNbDevUp: 2,
		// optInNbDevDn: 2,
		// optInMAType: 0,
	}
});
// console.log(analysisBolingerBands.explain());

// let chartKrakenEthBtc4h = Bot.setChart({
// 	change: ["", ""],
// 	changePercent: ["", ""],
// 	close: ["1", "1.5", "1", "2", "1", "2", "1", "1.5", "1", "2", "1", "2", "1", "2", "1", "2", "1", "2", "1", "1.5", "1", "1.5", "1", "2", "1", "1.5", "1", "2"],
// 	closeTime: [0, 0],
// 	exchange: exchangeKraken,
// 	high: ["", ""],
// 	low: ["", ""],
// 	open: ["", ""],
// 	openTime: [0, 0],
// 	pair: pairEthBtc,
// 	timeframe: 60,
// 	tradeCount: [0, 0],
// 	volume: ["", ""],
// });

let chartKrakenEthBtc4h = Bot.setChart({
	exchange: exchangeKraken,
	pair: pairEthBtc,
	timeframe: 60
});
// console.log(`chartKrakenEthBtc4h:`);
// console.log(chartKrakenEthBtc4h);

try {
	exchangeKraken.primeChart(
		chartKrakenEthBtc4h
	);
} catch (err) {
	console.error(err);
}

let strat1 = Bot.setStrategy({
	analysis: [
		analysisRsi14,
		analysisSma20,
		analysisBolingerBands,
	],
	chart: chartKrakenEthBtc4h
});

try {
	strat1.execute();
} catch (err) {
	console.error(err);
}

// let strat1Result1 = strat1.getResult(analysisRsi14);
// console.log(strat1Result1);

// let strat1Result2 = strat1.getResult(analysisSma20);
// console.log(strat1Result2);

// let strat1Result3 = strat1.getResult(analysisBolingerBands);
// console.log(strat1Result3);

// strat1.setChart(chartKrakenEthBtc1h);
// let strat1Result2 = strat1.execute();
// console.log(strat1Result2);
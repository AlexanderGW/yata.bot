import { Kraken } from './Exchange/Kraken';
import { Asset } from './Asset';
import { Pair } from './Pair';
import { Analysis } from './Analysis';
import { Chart } from './Chart';
import { Strategy } from './Strategy';

// --------------------------------------------------------

const exchangeKraken = new Kraken({
	name: 'Kraken',
	key: '',
	secret: '',
});
// console.log(exchangeKraken.name);
// console.log(`exchangeKraken: ${exchangeKraken}`);

let assetBtc = new Asset({
	symbol: 'BTC'
});
// console.log(`assetBtc: ${assetBtc}`);

let assetEth = new Asset({
	symbol: 'ETH'
});
// console.log(`assetEth: ${assetEth}`);

let pairEthBtc = new Pair({
	a: assetEth,
	b: assetBtc
});
// console.log(`pairEthBtc: ${pairEthBtc}`);

// let pos1 = new Position({
// 	exchange: exchangeKraken,
// 	pair: pairEthBtc,
// 	amount: '2.23523552'
// });
// console.log(`pos1Id: ${pos1}`);
// console.log(pos1);
// console.log(pos1.pair.a.symbol);

let analysisRsi14 = new Analysis({
	name: 'RSI',
	config: {
		inRealField: 'close',
		optInTimePeriod: 14,
	}
});

let analysisSma20 = new Analysis({
	name: 'SMA',
	config: {
		inRealField: 'close',
		// optInTimePeriod: 20,
	}
});
// console.log(analysisSma20.explain());

let analysisBolingerBands = new Analysis({
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

// let chartKrakenEthBtc4h = new Chart({
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

let chartKrakenEthBtc4h = new Chart({
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

let strat1 = new Strategy({
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

let strat1Result1 = strat1.getResult(analysisRsi14);
console.log(strat1Result1);

let strat1Result2 = strat1.getResult(analysisSma20);
console.log(strat1Result2);

let strat1Result3 = strat1.getResult(analysisBolingerBands);
console.log(strat1Result3);

// strat1.setChart(chartKrakenEthBtc1h);
// let strat1Result2 = strat1.execute();
// console.log(strat1Result2);
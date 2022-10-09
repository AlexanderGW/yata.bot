import { Kraken } from './Exchange/Kraken';
import { Bot } from './Bot';

// --------------------------------------------------------

const exchangeKraken = Bot.setExchange({
	name: 'Kraken',
	key: '',
	secret: '',
});
console.log(exchangeKraken.name);
console.log(`exchangeKraken: ${exchangeKraken}`);
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
	a: assetBtc,
	b: assetEth
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

let analysisRsiDefault = Bot.setAnalysis({
	name: 'RSI',
	config: {
		inReal: 'close',
		// optInTimePeriod: 14
	}
});

let chartKrakenEthBtc4h = Bot.setChart({
	change: ["", ""],
	changePercent: ["", ""],
	close: ["1", "1.5", "1", "2", "1", "2", "1", "1.5", "1", "2", "1", "2", "1", "2", "1", "2", "1", "2", "1", "1.5", "1", "1.5", "1", "2", "1", "1.5", "1", "2"],
	closeTime: [0, 0],
	exchange: exchangeKraken,
	high: ["", ""],
	low: ["", ""],
	open: ["", ""],
	openTime: [0, 0],
	pair: pairEthBtc,
	timeframe: 60,
	tradeCount: [0, 0],
	volume: ["", ""],
});

let strat1 = Bot.setStrategy({
	analysis: [
		analysisRsiDefault
	],
	chart: chartKrakenEthBtc4h
});

let strat1Result = strat1.execute();
console.log(strat1Result);
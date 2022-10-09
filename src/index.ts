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
console.log(Bot.getExchangeById(0));

let assetBtc = Bot.setAsset({
	symbol: 'BTC'
});
console.log(`assetBtc: ${assetBtc}`);
// console.log(Bot.getAssetById(assetBtc));

let assetEth = Bot.setAsset({
	symbol: 'ETH'
});
console.log(`assetEth: ${assetEth}`);
// console.log(Bot.getAssetById(assetEth));

let pairEthBtc = Bot.setPair({
	a: assetBtc,
	b: assetEth
});
console.log(`pairEthBtc: ${pairEthBtc}`);
// console.log(Bot.getPairById(pairEthBtc));

let pos1 = Bot.setPosition({
	exchange: exchangeKraken,
	pair: pairEthBtc,
	amount: '2.23523552'
});
console.log(`pos1Id: ${pos1}`);
console.log(pos1);
console.log(pos1.pair.a.symbol);

import { Kraken } from './Exchange/Kraken';
import { Bot } from './Bot';

// --------------------------------------------------------

const exchangeKraken = Bot.setExchange(
	'Kraken',
	'',
	''
);
console.log(`exchangeKraken: ${exchangeKraken}`);
console.log(Bot.getExchangeById(0));

let assetBtc = Bot.setAsset(
	'BTC'
);
console.log(`assetBtc: ${assetBtc}`);
// console.log(Bot.getAssetById(assetBtc));

let assetEth = Bot.setAsset(
	'ETH'
);
console.log(`assetEth: ${assetEth}`);
// console.log(Bot.getAssetById(assetEth));

let pairEthBtc = Bot.setPair(
	assetBtc,
	assetEth
);
console.log(`pairEthBtc: ${pairEthBtc}`);
// console.log(Bot.getPairById(pairEthBtc));

let pos1 = Bot.setPosition(
	exchangeKraken,
	pairEthBtc
);
console.log(`pos1Id: ${pos1}`);
console.log(pos1);
console.log(pos1.pair);
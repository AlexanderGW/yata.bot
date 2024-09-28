// Example; chained strat; happens within a TF; 4h; 2024-09-08:17:00:00; RSI BO, ..., RSI test & bounce

// UNISWAP

// _getChainId(): number {
// 	return Number(process.env.WEB3_CHAIN_ID!)
// }

// _getUniswapTokens (
// 	_: PairData,
// ): Token[] {
// 	const tokenAData = this._getToken(_.a.symbol);
// 	const tokenADecimals = tokenAData?.decimals ?? 0;

// 	const tokenBData = this._getToken(_.b.symbol);
// 	const tokenBDecimals = tokenBData?.decimals ?? 0;

// 	const chainId = this._getChainId();

// 	return [
// 		new Token(
// 			chainId,
// 			_.a.symbol,
// 			tokenADecimals,
// 			tokenAData?.symbol,
// 			tokenAData?.name
// 		),
// 		new Token(
// 			chainId,
// 			_.b.symbol,
// 			tokenBDecimals,
// 			tokenBData?.symbol,
// 			tokenBData?.name
// 		)
// 	];
// }





// const amountIn = String(amount ?? 1);
// 		console.log(`amountIn`, amountIn)

// const [tokenA, tokenB] = this._getUniswapTokens(_);












// const tokens = await this.getBalance([
// 	_.a.symbol,
// 	_.b.symbol
// ]);

// Lose context of type; no likey
// const amountIn = Number(indexLookup(_.a.symbol, tokens.balanceIndex, tokens.balance));
// let tokenA: ExchangeBalanceData = {};
// const tokenAIndex = tokens.balanceIndex.indexOf(_.a.symbol);
// if (tokenAIndex >= 0)
// 	tokenA = tokens.balance[tokenAIndex];

// const tokenAData = this._getToken(_.a.symbol);
// const tokenABalance = String(amount ?? 1);
// const tokenADecimals = tokenAData?.decimals ?? 0;

// const amountIn = ethers.parseUnits(tokenABalance, tokenADecimals).toString();
// console.log(`amountIn`, amountIn);

// let tokenB: ExchangeBalanceData = {};
// const tokenBIndex = tokens.balanceIndex.indexOf(_.a.symbol);
// if (tokenBIndex >= 0)
// 	tokenB = tokens.balance[tokenBIndex];

// const tokenBData = this._getToken(_.b.symbol);
// const tokenBDecimals = tokenBData?.decimals ?? 0;







// const tokens = await this.getBalance([
		// 	_.a.symbol,
		// 	_.b.symbol
		// ]);

		// Lose context of type; no likey
		// const amountIn = Number(indexLookup(_.a.symbol, tokens.balanceIndex, tokens.balance));
		// let tokenA: ExchangeBalanceData = {};
		// const tokenAIndex = tokens.balanceIndex.indexOf(_.a.symbol);
		// if (tokenAIndex >= 0)
		// 	tokenA = tokens.balance[tokenAIndex];

		// const tokenAData = this._getToken(_.a.symbol);
		// const tokenABalance = String(amount ?? 1);
		// const tokenADecimals = tokenAData?.decimals ?? 0;

		// const amountIn = ethers.parseUnits(tokenABalance, tokenADecimals).toString();
		// console.log(`amountIn`, amountIn);

		// let tokenB: ExchangeBalanceData = {};
		// const tokenBIndex = tokens.balanceIndex.indexOf(_.a.symbol);
		// if (tokenBIndex >= 0)
		// 	tokenB = tokens.balance[tokenBIndex];

		// const tokenBData = this._getToken(_.b.symbol);
		// const tokenBDecimals = tokenBData?.decimals ?? 0;





		// Define the tokens
		// const _tokenA = new Token(
		// 	1,
		// 	_.a.symbol,
		// 	tokenA.decimals,
		// 	tokenA.symbol,
		// 	tokenA.name
		// );

		// const _tokenB = new Token(
		// 	1,
		// 	_.b.symbol,
		// 	tokenB.decimals,
		// 	tokenB.symbol,
		// 	tokenB.name
		// );








		// const currentPoolAddress = computePoolAddress({
		// 	factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
		// 	tokenA: tokenA,
		// 	tokenB: tokenB,
		// 	fee: FeeAmount.HIGH,
		// })

		// const poolContract = new ethers.Contract(
		// 	currentPoolAddress,
		// 	IUniswapV3PoolABI.abi,
		// 	this.handle?.provider
		// );

		// const [
		// 	token0,
		// 	token1,
		// 	fee,
		// 	liquidity,
		// 	slot0
		// ]: [
		// 	string,
		// 	string,
		// 	ethers.BigNumberish,
		// 	ethers.BigNumberish,
		// 	[
		// 		ethers.BigNumberish,
		// 		ethers.BigNumberish,
		// 		ethers.BigNumberish,
		// 		ethers.BigNumberish,
		// 		ethers.BigNumberish,
		// 		ethers.BigNumberish,
		// 		boolean
		// 	]
		// ] = await Promise.all([
		// 	poolContract.token0(),
		// 	poolContract.token1(),
		// 	poolContract.fee(),
		// 	poolContract.liquidity(),
		// 	poolContract.slot0(),
		// ]);

		// console.log(`token0`, token0);
		// console.log(`token1`, token1);
		// console.log(`fee`, fee);
		// console.log(`liquidity`, ethers.formatUnits(liquidity, tokenAData?.decimals));
		// console.log(`slot0`, slot0);











		// const [
		// 	token0,
		// 	token1,
		// 	fee,
		// 	liquidity,
		// 	slot0
		// ] = await this._getUniswapPool(
		// 	tokenA,
		// 	tokenB
		// );

		// const pool = new Pool(
		// 	tokenA,
		// 	tokenB,
		// 	Number(fee.toString()),
		// 	slot0[0].toString(),
		// 	liquidity.toString(),
		// 	Number(slot0[1].toString())
		// );
		// console.log(`pool`);
		// console.log(pool);

		// const quoterContract = new ethers.Contract(
		// 	QUOTER_CONTRACT_ADDRESS,
		// 	Quoter.abi,
		// 	this.handle?.provider
		// );

		// const quotedAmountOut: ethers.BigNumberish = await quoterContract.quoteExactInputSingle.staticCall(
		// 	pool.token0.address,
		// 	pool.token1.address,
		// 	pool.fee,
		// 	amountIn,
		// 	0 //slot0[0]
		// );



// UNISWAP












// export const countDecimals = (value: unknown) => {
// 	const string = String(value);
// 	const number = Number(value);
// 	if (Math.floor(number) == number)
// 		return 0;
// 	const result = string.split('.');
// 	return result.length === 2 ? result[1].length : 0;
// };

// const aaa = '34052.10000';

// console.log(countDecimals(aaa));



// export const toFixedNumber = (
// 	num: number,
// 	digits: number,
// 	base?: number,
// ): number => {
// 	const pow = Math.pow(base ?? 10, digits);
//   return Math.round(num * pow) / pow;
// };

// const aaa = 0.0005381162362910716;
// const bbb = Number('0.0005381162362910716');
// const ccc = Number.parseFloat('0.0005381162362910716');

// console.log(toFixedNumber(aaa, 5));
// console.log(toFixedNumber(bbb, 5));
// console.log(toFixedNumber(ccc, 5));


// let valueA = 'scenario:sma20.outReal';
// let valueAClass: string | undefined;
// let valueAName: string | undefined;
// const valueAPos = valueA.lastIndexOf('.');
// if (valueAPos > 0) {
// 	valueAClass = valueA.substring(0, valueAPos);
// 	valueAName = valueA.substring(valueAPos + 1);
// }

// console.log(valueAClass);
// console.log(valueAName);
// console.log(`!valueAClass?.length`);
// console.log(!valueAClass?.length);
// console.log(`!valueAClass?.length || valueAClass === 'chart'`);
// console.log(!valueAClass?.length || valueAClass === 'chart');




// const countDecimals = (value: number) => {
// 	if (Math.floor(value) === value)
// 		return 0;
// 	const result = value.toString().split('.');
// 	return result.length === 2 ? result[1].length : 0;
// };


// console.log(countDecimals(-1233.4124));




// const value = -10;
// // const valuePercent = `${value}%`;
// // const actualCurrent = 100000.100000;
// // const actualPrice = 0;
// // console.log(actualCurrent + ((actualCurrent / 100) * value))
// const price = 0.060070;
// console.log(price);
// // const priceChange = -0.012014;
// const priceChange = (price / 100) * value;
// console.log(priceChange);
// let priceActual = 0;
// priceActual = price + priceChange;
// console.log(priceActual);
// // const resultPair = 'XXBTZUSD';
// // const resultPairASymbol = resultPair.substring(0, 4);
// // const resultPairBSymbol = resultPair.substring(4);
// // console.log(resultPairASymbol);
// // console.log(resultPairBSymbol);




// export type YATABInitData = {
// 	dryrun?: boolean,
// 	backtest?: boolean,
// };

// type YATABData = {
// 	backtest: boolean,
// 	dryrun: boolean,
// 	initialized: boolean,
// 	init: (
// 		_: YATABInitData
// 	) => void,
// };

// const YATAB: YATABData = {
// 	backtest: false,
// 	dryrun: true,
// 	initialized: false,
// 	init (
// 		_: YATABInitData,
// 	): void {
// 		if (this.initialized)
// 			return;

// 		this.backtest = _.backtest ?? true;
// 		this.dryrun = _.dryrun ?? true;
// 		this.initialized = true;
// 	},
// }

// YATAB.init({
// 	dryrun: true,
// });

// const _ = {
// 	dryrun: false,
// };

// console.log(_.dryrun ?? YATAB.dryrun);
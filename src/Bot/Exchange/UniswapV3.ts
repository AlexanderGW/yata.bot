import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeApiBalanceData, ExchangeApiData, ExchangeApiInterface, ExchangeApiTickerData, ExchangeBalanceData, ExchangeTickerData } from '../Exchange';
import { OrderSide, OrderItem, OrderType, OrderStatus, OrderData, OrderBaseData } from '../Order';
import { Pair, PairData } from '../Pair';

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import * as ethers from 'ethers';
// import { ethers, AddressLike, Contract, JsonRpcProvider, Wallet, formatUnits, parseUnits } from 'ethers';
import { SwapOptions, SwapRouter, Pool, Trade, Route, computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';

import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

import IERC20Minimal from '@uniswap/v3-core/artifacts/contracts/interfaces/IERC20Minimal.sol/IERC20Minimal.json';

import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

import { Token } from '@uniswap/sdk-core'

import { SwapQuoter } from '@uniswap/v3-sdk'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'

import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  PromiEvent,
  TransactionReceipt,
  EventResponse,
  EventData,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | BN | BigNumber;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | BN | BigNumber;
  gas?: number;
}

export interface MethodPayableReturnContext {
  send(options: SendOptions): PromiEvent<TransactionReceipt>;
  send(
    options: SendOptions,
    callback: (error: Error, result: any) => void
  ): PromiEvent<TransactionReceipt>;
  estimateGas(options: EstimateGasOptions): Promise<number>;
  estimateGas(
    options: EstimateGasOptions,
    callback: (error: Error, result: any) => void
  ): Promise<number>;
  encodeABI(): string;
}

export interface MethodConstantReturnContext<TCallReturn> {
  call(): Promise<TCallReturn>;
  call(options: CallOptions): Promise<TCallReturn>;
  call(
    options: CallOptions,
    callback: (error: Error, result: TCallReturn) => void
  ): Promise<TCallReturn>;
  encodeABI(): string;
}

export interface MethodReturnContext extends MethodPayableReturnContext {}

export type ContractContext = Web3ContractContext<
  IQuoter,
  IQuoterMethodNames,
  IQuoterEventsContext,
  IQuoterEvents
>;
export type IQuoterEvents = undefined;
export interface IQuoterEventsContext {}
export type IQuoterMethodNames =
  | 'quoteExactInput'
  | 'quoteExactInputSingle'
  | 'quoteExactOutput'
  | 'quoteExactOutputSingle';
export interface IQuoter {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param path Type: bytes, Indexed: false
   * @param amountIn Type: uint256, Indexed: false
   */
  quoteExactInput(
    path: string | number[],
    amountIn: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param tokenIn Type: address, Indexed: false
   * @param tokenOut Type: address, Indexed: false
   * @param fee Type: uint24, Indexed: false
   * @param amountIn Type: uint256, Indexed: false
   * @param sqrtPriceLimitX96 Type: uint160, Indexed: false
   */
  quoteExactInputSingle(
    tokenIn: string,
    tokenOut: string,
    fee: string | number,
    amountIn: string,
    sqrtPriceLimitX96: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param path Type: bytes, Indexed: false
   * @param amountOut Type: uint256, Indexed: false
   */
  quoteExactOutput(
    path: string | number[],
    amountOut: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param tokenIn Type: address, Indexed: false
   * @param tokenOut Type: address, Indexed: false
   * @param fee Type: uint24, Indexed: false
   * @param amountOut Type: uint256, Indexed: false
   * @param sqrtPriceLimitX96 Type: uint160, Indexed: false
   */
  quoteExactOutputSingle(
    tokenIn: string,
    tokenOut: string,
    fee: string | number,
    amountOut: string,
    sqrtPriceLimitX96: string
  ): MethodReturnContext;
}






const POOL_FACTORY_CONTRACT_ADDRESS =
  '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const QUOTER_CONTRACT_ADDRESS =
  '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
const SWAP_ROUTER_ADDRESS =
	'0xE592427A0AEce92De3Edee1F18E0157C05861564';

// ERC-20 Token Contract ABI
const erc20Abi = [
	'function name() public view returns (string)',
	'function symbol() public view returns (string)',
	'function decimals() public view returns (uint8)',
	'function balanceOf(address owner) view returns (uint256)'
];

export type UniswapV3ExchangeToken = {
	balance?: number,
	decimals?: number,
	name?: string,
	symbol?: string,
}

export type UniswapV3ExchangeHandle = {
	address?: string,
	provider?: ethers.JsonRpcProvider,
	router?: SwapRouter,
	wallet?: ethers.Wallet,
}

export type UniswapV3ExchangeResponse = {
	result: any,
	error?: string[],
};

export type UniswapV3ExchangeInterface = {
	token: UniswapV3ExchangeToken[],
	tokenIndex: string[],
	refreshChart: (
		chart: ChartItem,
		_: object,
	) => void;
}

export class UniswapV3Exchange implements ExchangeApiInterface, UniswapV3ExchangeInterface {
	name: string;
	uuid: string;

	token: UniswapV3ExchangeToken[];
	tokenIndex: string[];

	handle?: UniswapV3ExchangeHandle;

	constructor (
		_: ExchangeApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;

		this.token = [];
		this.tokenIndex = [];

		console.log(`ExchangeApiData`);
		console.log(_);

		this.handle = {
			address: process.env.WEB3_ADDRESS!,
			provider: new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URI!),
		};

		this.handle.wallet = new ethers.Wallet(
			process.env.WEB3_PRIVATE_KEY!,
			this.handle.provider,
		);
	}

	_getToken (
		address: string
	) {
		const index = this.tokenIndex.indexOf(address);
		if (index < 0)
			return null;

		return this.token[index];
	}

	_handleError (
		_: UniswapV3ExchangeResponse
	) {
		if (_.error) {
			for (let i = 0; i < _.error.length; i++) {
				Bot.log(_.error[i], Log.Err);
			}
		}

		if (_.result.status === 'Err')
			throw new Error(_.result.error_message);
	}

	async openOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		const tokenAData = this._getToken(_.pair.a.symbol);
		const tokenBData = this._getToken(_.pair.b.symbol);

		// // Define the tokens
		const tokenA = new Token(
			1,
			_.pair.a.symbol,
			tokenAData?.decimals ?? 0,
			tokenAData?.symbol,
			tokenAData?.name
		);

		const tokenB = new Token(
			1,
			_.pair.b.symbol,
			tokenBData?.decimals ?? 0,
			tokenBData?.symbol,
			tokenBData?.name
		);

		// // Example pool data (must be fetched from on-chain or a subgraph in practice)
		// const poolData: Pool = {
		// 		token0: tokenA,
		// 		token1: tokenB,
		// 		fee: 3000, // Corresponds to a 0.3% fee tier
		// 		sqrtRatioX96: ethers.BigNumber.from('79228162514264337593543950336'), // Example sqrt price
		// 		liquidity: ethers.BigNumber.from('20000000000000000000000'), // Example liquidity
		// 		tickCurrent: 0,
		// 		ticks: []
		// };

		// const pool = new Pool(
		// 		poolData.token0,
		// 		poolData.token1,
		// 		poolData.fee,
		// 		poolData.sqrtRatioX96,
		// 		poolData.liquidity,
		// 		poolData.tickCurrent,
		// 		poolData.ticks
		// );

		// // Define the trade parameters
		// const amountIn = CurrencyAmount.fromRawAmount(tokenA, '1000000000000000000'); // 1 DAI
		// const slippageTolerance = new Percent('50', '10000'); // 0.50%

		// // Compute the optimal trade
		// const trade = await Trade.exactIn(new Route([pool], tokenA, tokenB), amountIn);

		// // Calculate the minimum amount out
		// const amountOutMinimum = trade.minimumAmountOut(slippageTolerance).toFixed(0);

		// console.log(`Minimum amount out: ${amountOutMinimum} USDC`);
		// console.log(`Execution price: ${trade.executionPrice.toSignificant(6)} USDC per DAI`);
		// console.log(`Next price: ${trade.nextMidPrice.toSignificant(6)} USDC per DAI`);

		// // // Set empty `referenceId` as current time
		// // if (_.referenceId === 0) {
		// // 	orderResponse.referenceId = Math.floor(Date.now());
		// // }

		// // const requestOptions = {

		// // 	// Order type
		// // 	ordertype: this.getOrderTypeValue(_),

		// // 	// Order type
		// // 	pair: pair,

		// // 	// Order price
		// // 	price: _.priceActual,

		// // 	// Order direction (buy/sell)
		// // 	type: _.side === OrderSide.Buy ? 'buy' : 'sell',

		// // 	// Set order `referenceId`
		// // 	userref: _.referenceId,

		// // 	// Validate inputs only. Do not submit order.
		// // 	validate: _.dryrun,

		// // 	// Order quantity in terms of the base asset
		// // 	volume: _.quantityActual,
		// // };
		// // Bot.log(requestOptions, Log.Verbose);



		
		// // const tokenIn = _.side === OrderSide.Buy ? '' : '';

		
		

		// // const swapRouterContract = new Contract(swapRouterAddress, swapRouterABI, signer);

    // // // Approve the router to spend the tokenIn
    // // const tokenABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
    // // const tokenContract = new Contract(tokenIn, tokenABI, signer);
    // // let tx = await tokenContract.approve(swapRouterAddress, amountIn);
    // // await tx.wait();

    // // // Set up the transaction parameters
    // // const params: SwapOptions = {
    // //     tokenIn: tokenIn,
    // //     tokenOut: tokenOut,
    // //     fee: fee, // Fee tier, e.g., 3000 for 0.3%
    // //     recipient: signer.address,
    // //     deadline: Math.floor(Date.now() / 1000) + 60 * 10,  // 10 minutes from the current Unix time
    // //     amountIn: amountIn,
    // //     amountOutMinimum: amountOutMinimum,
    // //     sqrtPriceLimitX96: 0  // Set to 0 if no price limit is required
    // // };

    // // // Execute the swap
    // // tx = await swapRouterContract.exactInputSingle(params, {
    // //     gasLimit: 500000  // Set a reasonable gas limit
    // // });
    // // const receipt = await tx.wait();
    // // console.log('Transaction receipt:', receipt);


		// const responseJson = {};


		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.openOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		// // if (responseJson) {

		// // 	// Handle any errors
		// // 	this._handleError(responseJson);
			
		// // 	// Confirmed
		// // 	if (responseJson.result.txid) {
		// // 		orderResponse.responseStatus = OrderStatus.Open;
		// // 		orderResponse.status = OrderStatus.Open;
		// // 		orderResponse.responseTime = Date.now();
		// // 		orderResponse.transactionId = orderResponse.transactionId
		// // 			? [
		// // 				...orderResponse.transactionId,
		// // 				responseJson.result.txid[0]
		// // 			]
		// // 			: [responseJson.result.txid[0]];
		// // 	}
		// // }

		return orderResponse;
	}

	async closeOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		// // Get latest order transaction ID index
		// let lastTransactionIdx = 0;
		// if (_.transactionId?.length)
		// 	lastTransactionIdx = _.transactionId.length - 1;

		// let responseJson = await this.handle?.api(

		// 	// Type
		// 	'CancelOrder',

		// 	// Options
		// 	{

		// 		// Transaction ID
		// 		txid: _.transactionId[lastTransactionIdx],
		// 	}
		// );

		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.closeOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		// if (responseJson) {

		// 	// Handle any errors
		// 	this._handleError(responseJson);

		// 	// Response either in pending state, or count is zero
		// 	if (
		// 		responseJson.result.pending === true
		// 		|| responseJson.result.count === 0
		// 	) {
		// 		orderResponse.responseStatus = OrderStatus.Pending;
		// 	}
			
		// 	// Successful
		// 	else {
		// 		orderResponse.responseStatus = OrderStatus.Close;
		// 	}

		// 	orderResponse.responseTime = Date.now();
		// }

		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		let orderResponse: OrderBaseData = {};

		// // Get latest order transaction ID index
		// let lastTransactionIdx = 0;
		// if (_.transactionId?.length)
		// 	lastTransactionIdx = _.transactionId.length - 1;

		// let pair = `${_.pair.a.symbol}/${_.pair.b.symbol}`;

		// // Set empty `referenceId` as current time
		// if (_.referenceId === 0) {
		// 	orderResponse.referenceId = Math.floor(Date.now());
		// }

		// let responseJson = await this.handle?.api(

		// 	// Type
		// 	'EditOrder',

		// 	// Options
		// 	{

		// 		// Order type
		// 		ordertype: this.getOrderTypeValue(_),

		// 		// Order type
		// 		pair: pair,

		// 		// Order price
		// 		price: _.priceActual,

		// 		// Transaction ID
		// 		txid: _.transactionId[lastTransactionIdx],

		// 		// Order direction (buy/sell)
		// 		type: _.side === OrderSide.Buy ? 'buy' : 'sell',

		// 		// Set order `referenceId`
		// 		userref: _.referenceId,

		// 		// Validate inputs only. Do not submit order.
		// 		validate: _.dryrun,

		// 		// Order quantity in terms of the base asset
		// 		volume: _.quantityActual,
		// 	}
		// );

		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.editOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		// if (responseJson) {

		// 	// Handle any errors
		// 	this._handleError(responseJson);

		// 	// Response carries previous, new foreign 
		// 	// transaction ID, and status is `ok`
		// 	if (
		// 		responseJson.result.originaltxid === _.transactionId[lastTransactionIdx]
		// 		&& responseJson.result.txid
		// 		&& responseJson.result.status === 'ok'
		// 	) {
		// 		orderResponse.responseStatus = OrderStatus.Open;
		// 		orderResponse.status = OrderStatus.Open;
		// 		orderResponse.responseTime = Date.now();
		// 		orderResponse.transactionId = orderResponse.transactionId
		// 			? [
		// 				...orderResponse.transactionId,
		// 				responseJson.result.txid
		// 			]
		// 			: [responseJson.result.txid];
		// 	}
		// }

		return orderResponse;
	}

	async getBalance (
		addressList?: string[],
	) {
		let returnData: Required<ExchangeApiBalanceData> = {
			balance: [],
			balanceIndex: [],
			
		};
		returnData.balance = [];
		returnData.balanceIndex = [];

		if (!addressList)
			return returnData;
		
		try {

			// Request each token
			for(let i = 0; i < addressList.length; i++) {
				
				// Connect to the token contract
				const tokenContract = new ethers.Contract(
					addressList[i],
					erc20Abi, //IERC20Minimal.abi,
					this.handle?.provider
				);

				// Lookup existing token data
				let tokenData = this._getToken(addressList[i]);
				if (!tokenData) {

					// Get token decimals
					const decimals = Number(await tokenContract.decimals());
					Bot.log(`Decimals: ${decimals}`, Log.Verbose);

					// Get token name
					const name = await tokenContract.name();
					Bot.log(`Name: ${name}`, Log.Verbose);

					// Get token symbol
					const symbol = await tokenContract.symbol();
					Bot.log(`Symbol: ${symbol}`, Log.Verbose);

					tokenData = {
						decimals,
						name,
						symbol,
					};
				}

				// Query token contract for address balance
				const rawBalance = await tokenContract.balanceOf(this.handle?.address);
				Bot.log(`Balance (raw): ${rawBalance}`, Log.Verbose);

				const balance = Number(ethers.formatUnits(rawBalance, tokenData.decimals));

				// Update return data with balance information
				const balanceData: ExchangeBalanceData = {
					available: balance,
					balance: balance,
					credit: balance,
					creditUsed: 0,
					tradeHeld: 0,
				};

				let index = returnData?.balanceIndex.indexOf(addressList[i]);
				if (index < 0) {
					returnData.balance.push(balanceData);
					returnData.balanceIndex.push(addressList[i]);
				} else
					returnData.balance[index] = balanceData;

				// Update token metadata
				index = this.tokenIndex.indexOf(addressList[i]);
				if (index < 0) {
					this.token.push(tokenData);
					this.tokenIndex.push(addressList[i]);
				} else
					this.token[index] = tokenData;
			}
		} catch(error) {
			console.error(error);
		};

		return returnData;
	}

	async getOrder (
		_: OrderItem,
	) {
		let orderResponse: OrderData = {};

		// // Get latest order transaction ID index
		// let lastTransactionIdx = 0;
		// if (!_.transactionId?.length)
		// 	throw new Error(`Unknown transaction ID`);

		// lastTransactionIdx = _.transactionId.length - 1;

		// // Options
		// let requestOptions: {
		// 	txid: string,
		// 	userref?: number,
		// } = {

		// 	// Transaction ID
		// 	// txid: _.transactionId.reverse().join(','), // Provide all order transaction, newest first
		// 	txid: _.transactionId[lastTransactionIdx],
		// };

		// // Set order `referenceId` if we have one
		// if (_.referenceId)
		// 	requestOptions.userref = _.referenceId;

		// Bot.log(requestOptions, Log.Verbose);
		// // return orderResponse;

		// let responseJson = await this.handle?.api(

		// 	// Type
		// 	'QueryOrders',

		// 	// Options
		// 	requestOptions
		// );

		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.getOrder; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		// if (!responseJson)
		// 	return orderResponse;
		
		// // Handle any errors
		// this._handleError(responseJson);

		// // Walk all transactions
		// for (let resultTxId in responseJson.result) {
		// 	const transaction = responseJson.result[resultTxId];
		// 	console.log(transaction);

		// 	// The requested transasction
		// 	if (

		// 		// Transaction within top-level results
		// 		// _.transactionId.indexOf(resultTxId) >= 0 // Is one of the orders transactions
		// 		_.transactionId[lastTransactionIdx] !== resultTxId

		// 		// Referral order transaction ID that created this order
		// 		&& transaction.refid !== _.transactionId[lastTransactionIdx]
		// 	)
		// 		return orderResponse;
			
		// 	// TODO: Compare response pair

		// 	if (transaction.closetm)
		// 		orderResponse.closeTime = transaction.closetm;
		
		// 	// Order type
		// 	switch (transaction.descr.ordertype) {
		// 		case 'limit':
		// 			orderResponse.type = OrderType.Limit;
		// 			break;
		// 		case 'market':
		// 			orderResponse.type = OrderType.Market;
		// 			break;
		// 		case 'stop-loss':
		// 			orderResponse.type = OrderType.StopLoss;
		// 			break;
		// 		case 'take-profit':
		// 			orderResponse.type = OrderType.TakeProfit;
		// 			break;
		// 		default:
		// 			orderResponse.type = OrderType.Unknown;
		// 			break;
		// 	}

		// 	// Order side
		// 	switch (transaction.descr.type) {
		// 		case 'buy':
		// 			orderResponse.side = OrderSide.Buy;
		// 			break;
		// 		case 'sell':
		// 			orderResponse.side = OrderSide.Sell;
		// 			break;
		// 		default:
		// 			orderResponse.side = OrderSide.Unknown;
		// 			break;
		// 	}

		// 	if (transaction.expiretm)
		// 		orderResponse.expireTime = transaction.expiretm;
		// 	if (transaction.limitprice)
		// 		orderResponse.limitPrice = transaction.limitprice;
		// 	if (transaction.opentm)
		// 		orderResponse.openTime = transaction.opentm;
		// 	if (transaction.price)
		// 		orderResponse.price = transaction.price;
		// 	orderResponse.responseTime = Date.now();
		// 	if (transaction.starttm)
		// 		orderResponse.startTime = transaction.starttm;

		// 	// Order status
		// 	switch (transaction.status) {
		// 		case 'canceled':
		// 			orderResponse.status = OrderStatus.Cancel;
		// 			break;
		// 		case 'closed':
		// 			orderResponse.status = OrderStatus.Close;
		// 			break;
		// 		case 'expired':
		// 			orderResponse.status = OrderStatus.Expired;
		// 			break;
		// 		case 'open':
		// 			orderResponse.status = OrderStatus.Open;
		// 			break;
		// 		case 'pending':
		// 			orderResponse.status = OrderStatus.Pending;
		// 			break;
		// 		default:
		// 			orderResponse.status = OrderStatus.Unknown;
		// 			break;
		// 	}

		// 	orderResponse.responseStatus = orderResponse.status;

		// 	if (transaction.stopprice)
		// 		orderResponse.stopPrice = transaction.stopprice;
		// 	if (transaction.vol)
		// 		orderResponse.quantity = transaction.vol;
		// 	if (transaction.vol_exec)
		// 		orderResponse.quantityFilled = transaction.vol_exec;

		// 	// Transaction was matched as a referral, add 
		// 	// the `resultTxId` to the order
		// 	if (_.transactionId[lastTransactionIdx] !== resultTxId)
		// 		_.transactionId.push(resultTxId);
		// }

		return orderResponse;
	}

	async getTicker (
		_: PairData,
	): Promise<ExchangeApiTickerData> {
		let returnData: ExchangeApiTickerData = {};
		returnData.ticker = [];
		returnData.tickerIndex = [];

		// TODO: fix
		// if (_.exchange.uuid !== this.uuid)
		// 	throw new Error(`Exchange '${this.name}'; api.Pair '${_.name}'; api.Incompatible exchange pair`);
		
		const pair = `${_.a.symbol}-${_.b.symbol}`;

		Bot.log(`Exchange '${this.name}'; api.getTicker; Pair: '${pair}'; Foreign: '${pair}'`, Log.Verbose);

		const tokens = await this.getBalance([
			_.a.symbol,
			_.b.symbol
		]);

		// Lose context of type; no likey
		// const amountIn = Number(indexLookup(_.a.symbol, tokens.balanceIndex, tokens.balance));
		let tokenA: ExchangeBalanceData = {};
		const tokenAIndex = tokens.balanceIndex.indexOf(_.a.symbol);
		if (tokenAIndex >= 0)
			tokenA = tokens.balance[tokenAIndex];

		const tokenAData = this._getToken(_.a.symbol);
		const tokenABalance = String(tokenA.balance ?? 0);
		const tokenADecimals = tokenAData?.decimals ?? 0;

		const amountIn = ethers.parseUnits(tokenABalance, tokenADecimals).toString();

		let tokenB: ExchangeBalanceData = {};
		const tokenBIndex = tokens.balanceIndex.indexOf(_.a.symbol);
		if (tokenBIndex >= 0)
			tokenB = tokens.balance[tokenBIndex];

		const tokenBData = this._getToken(_.b.symbol);
		const tokenBDecimals = tokenBData?.decimals ?? 0;

		// Define the tokens
		const _tokenA = new Token(
			1,
			_.a.symbol,
			tokenADecimals,
			tokenAData?.symbol,
			tokenAData?.name
		);

		const _tokenB = new Token(
			1,
			_.b.symbol,
			tokenBDecimals,
			tokenBData?.symbol,
			tokenBData?.name
		);

		const currentPoolAddress = computePoolAddress({
			factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
			tokenA: _tokenA,
			tokenB: _tokenB,
			fee: FeeAmount.MEDIUM,
		})

		const poolContract = new ethers.Contract(
			currentPoolAddress,
			IUniswapV3PoolABI.abi,
			this.handle?.provider
		);

		const [token0, token1, fee, liquidity, slot0] = await Promise.all([
			poolContract.token0(),
			poolContract.token1(),
			poolContract.fee(),
			poolContract.liquidity(),
			poolContract.slot0(),
		]);

		const quoterContract = new ethers.Contract(
			QUOTER_CONTRACT_ADDRESS,
			Quoter.abi,
			this.handle?.provider
		);

		// TODO: Resolve typing error
		// @ts-ignore
		const aaa: IQuoter = quoterContract.callStatic;
		const quotedAmountOut = await aaa.quoteExactInputSingle(
			token0,
			token1,
			fee,
			amountIn,
			slot0[0]
		);
		console.log(`quotedAmountOut`);
		console.log(quotedAmountOut);

		const pool = new Pool(
			_tokenA,
			_tokenB,
			fee,
			slot0[0].toString(),
			liquidity.toString(),
			slot0[1]
		);

		const swapRoute = new Route(
			[pool],
			_tokenA,
			_tokenB
		);

		const { calldata } = await SwapQuoter.quoteCallParameters(
			swapRoute,
			CurrencyAmount.fromRawAmount(
				_tokenA,
				amountIn
			),
			TradeType.EXACT_INPUT,
			{
				useQuoterV2: false,
			}
		);
		console.log(`calldata`);
		console.log(calldata);

		const quoteCallReturnData = await this.handle?.provider?.call({
			to: QUOTER_CONTRACT_ADDRESS,
			data: calldata,
		});
		console.log(`quoteCallReturnData`);
		console.log(quoteCallReturnData);
		if (!quoteCallReturnData) {
			throw new Error(`Failed to call for 'quoteCallReturnData' on provider`);
		}
	
		const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData);

		const tokenContract = new ethers.Contract(
			_.a.symbol,
			erc20Abi, //IERC20Minimal.abi,
			this.handle?.provider
		);

		// TODO: Resolve typing error
		// @ts-ignore
		const transaction = await tokenContract.populateTransaction.approve(
			SWAP_ROUTER_ADDRESS,
			amountIn
		);

		const txRes = await this.handle?.wallet?.sendTransaction(transaction);
		if (!txRes)
			return returnData;

		let receipt = null
		while (receipt === null) {
			try {
				receipt = await this.handle?.provider?.getTransactionReceipt(txRes.hash)
	
				if (receipt === null) {
					continue
				}
			} catch (error) {
				Bot.log(error, Log.Err);
				break
			}
		}

		if (receipt) {
			Bot.log(`receipt`, Log.Verbose);
			Bot.log(receipt, Log.Verbose);
		}
	

		// try {
			
		// } catch (error) {
		// 	Bot.log(error, Log.Err);
		// }

		// const amountOut = await getOutputQuote(swapRoute)

		
		// const quotedAmountOut = aaa.quoteExactInput(
		// 	token0,
		// 	token1,
		// 	fee,
		// 	amountIn,
		// 	'0'
		// );

		// // Get balances on exchange
		// let responseTickerJson = await this.handle?.api(

		// 	// Type
		// 	'Ticker',

		// 	{
		// 		pair: pair,
		// 	}
		// );

		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.getTicker; Response: '${JSON.stringify(responseTickerJson)}'`, Log.Verbose);

		// if (!responseTickerJson)
		// 	throw new Error(`Invalid 'Ticker' response`);

		// // Handle any ticker errors
		// this._handleError(responseTickerJson);

		

		// // Walk all balances
		// for (let resultPair in responseTickerJson.result) {
		// 	// Get asset pair information on exchange
		// 	// TODO: Refactor for batch `pair` calls, and possible caching?
		// 	let responseAssetPairsJson = await this.handle?.api(

		// 		// Type
		// 		'AssetPairs',

		// 		{
		// 			pair: resultPair,
		// 		}
		// 	);

		// 	// Log raw response
		// 	Bot.log(`Exchange '${this.name}'; api.getTicker; Response: '${JSON.stringify(responseAssetPairsJson)}'`, Log.Verbose);

		// 	if (!responseAssetPairsJson)
		// 		throw new Error(`Invalid 'AssetPairs' response`);

		// 	// Handle any errors
		// 	this._handleError(responseAssetPairsJson);

		// 	const resultPairASymbolForeign = resultPair.substring(0, 4);
		// 	const resultPairBSymbolForeign = resultPair.substring(4);
		// 	const pairTicker = `${resultPairASymbolForeign}-${resultPairBSymbolForeign}`;
			
		// 	const ticker: {
		// 		a: string[],
		// 		b: string[],
		// 		c: string[],
		// 		v: string[],
		// 		p: string[],
		// 		t: string[],
		// 		l: string[],
		// 		h: string[],
		// 		o: string,
		// 	} = responseTickerJson.result[resultPair];

		// 	const tickerData: ExchangeTickerData = {
		// 		ask: Number(ticker.a[0]),
		// 		bid: Number(ticker.b[0]),
		// 		// decimals: countDecimals(ticker.c[0]),
		// 		decimals: Number(responseAssetPairsJson.result[resultPair].pair_decimals ?? 5),
		// 		high: Number(ticker.h[0]),
		// 		low: Number(ticker.l[0]),
		// 		open: Number(ticker.o),
		// 		price: Number(ticker.c[0]),
		// 		tradeCount: Number(ticker.t[0]),
		// 		volume: Number(ticker.v[0]),
		// 		vwap: Number(ticker.p[0]),
		// 	};

		// 	const index = returnData.tickerIndex.indexOf(pairTicker);
		// 	if (index < 0) {
		// 		returnData.ticker.push(tickerData);
		// 		returnData.tickerIndex.push(pairTicker);
		// 	} else
		// 		returnData.ticker[index] = tickerData;
		// }

		return returnData;
	}

	// compat (
	// 	chart: ChartItem,
	// ) {
	// 	if (chart.pair.exchange.uuid === this.uuid)
	// 		return true;
	// 	return false;
	// }

	async syncChart (
		chart: ChartItem,
	) {
		let pair: string = `${chart.pair.a.symbol}/${chart.pair.b.symbol}`;

		let nextDate = new Date(chart.datasetNextTime);
		Bot.log(`Chart '${chart.name}'; api.syncChart; From: ${nextDate.toISOString()}`);

		// const requestOptions = {
		// 	interval: chart.candleTime / 60000,
		// 	pair: pair,
		// 	since: Math.floor(chart.datasetNextTime / 1000),
		// };
		// // Bot.log(requestOptions, Log.Warn);
		
		// // UniswapV3 times are in minutes
		// let responseJson = await this.handle?.api(

		// 	// Type
		// 	'OHLC',

		// 	// Options
		// 	requestOptions
		// );

		// // Log raw response
		// Bot.log(`Exchange '${this.name}'; api.syncChart; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		// let etlData: ChartCandleData = {
		// 	close: [],
		// 	high: [],
		// 	low: [],
		// 	open: [],
		// 	openTime: [],
		// 	tradeCount: [],
		// 	volume: [],
		// 	vwap: [],
		// };

		// // Extract, transform, load response to chart
		// if (!responseJson?.result?.hasOwnProperty(pair))
		// 	throw new Error(`Invalid response from UniswapV3`);

		// let pairData = responseJson.result[pair];

		// let p: {
		// 	0: number,
		// 	1: string,
		// 	2: string,
		// 	3: string,
		// 	4: string,
		// 	5: string,
		// 	6: string,
		// 	7: number,
		// };

		// for (let i = 0; i < pairData.length; i++) {
		// 	p = pairData[i];
		// 	// Bot.log(p[0]);return;
		// 	etlData.close?.push(p[4]);
		// 	etlData.high?.push(p[2]);
		// 	etlData.low?.push(p[3]);
		// 	etlData.open?.push(p[1]);
		// 	etlData.openTime?.push(p[0]);
		// 	etlData.tradeCount?.push(p[7]);
		// 	etlData.volume?.push(p[6]);
		// 	etlData.vwap?.push(p[5]);
		// }

		// this.refreshChart(
		// 	chart,
		// 	etlData,
		// );
	}

	getOrderTypeValue (
		order: OrderItem,
	) {
		switch (order.type) {
			case OrderType.Limit:
				return 'limit';
			case OrderType.StopLoss:
				return 'stop-loss';
			case OrderType.TakeProfit:
				return 'take-profit';
			case OrderType.Market:
				return 'market';
			default:
				throw new Error(`Unknown order type '${order.type}'`);
		}
	}

	refreshChart (
		chart: ChartItem,
		_: ChartCandleData
	) {
		chart.updateDataset(_);
		chart.refreshDataset();

		// Check if datasets need to be stored
		if (!process.env.BOT_EXCHANGE_STORE_DATASET || process.env.BOT_EXCHANGE_STORE_DATASET !== '1')
			return true;

		const pad = (value: number) =>
			value.toString().length == 1
			? `0${value}`
			: value;

		const now = new Date();

		const candleTimeMinutes = chart.candleTime / 60000;

		const pathParts = [
			chart.pair.exchange.name,
			chart.pair.a.symbol + chart.pair.b.symbol,
			now.getUTCFullYear(),
			pad(now.getUTCMonth() + 1),
			pad(now.getUTCDate()),
			candleTimeMinutes,
		];
		const path = pathParts.join('/');
		// Bot.log(path);

		const filenameParts = [

			// Exchange
			chart.pair.exchange.name,

			// Pair
			[
				chart.pair.a.symbol,
				chart.pair.b.symbol,
			].join(''),

			// Candle size in minutes to save space
			candleTimeMinutes,

			// Timestamp
			[
				now.getUTCFullYear(),
				pad(now.getUTCMonth() + 1),
				pad(now.getUTCDate()),
				pad(now.getUTCHours()),
				pad(now.getUTCMinutes()),
				pad(now.getUTCSeconds()),
			].join(''),

			// Number of candles
			_.open?.length,
		];

		const filename = filenameParts.join('-');
		// Bot.log(filename);

		const responseJson = JSON.stringify(_);

		const storagePath = `./storage/dataset/${path}`;
		const storageFile = `${storagePath}/${filename}.json`;

		try {
			if (!existsSync(storagePath)) {
				mkdirSync(
					storagePath,
					{
						recursive: true
					},
					// (err: object) => {
					// 	if (err)
					// 		throw new Error(JSON.stringify(err));

					// 	Bot.log(`Exchange '${this.name}'; api.refreshChart; Path created: ${storagePath}`, Log.Verbose);
					// }
				)
			}
		} catch (error) {
			Bot.log(error, Log.Err);
			Bot.log(`Exchange '${this.name}'; api.refreshChart; mkdirSync`, Log.Err);
		}

		try {

			// TODO: Refactor into a storage interface
			writeFileSync(
				storageFile,
				responseJson,
			);
		} catch (error) {
			Bot.log(error, Log.Err);
			Bot.log(`Exchange '${this.name}'; api.refreshChart; writeFileSync`, Log.Err);
		}
	}
}

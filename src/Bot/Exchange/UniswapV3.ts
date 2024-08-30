import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import { ExchangeApiBalanceData, ExchangeApiData, ExchangeApiInterface, ExchangeApiTickerData, ExchangeBalanceData, ExchangeTickerData } from '../Exchange';
import { OrderSide, OrderItem, OrderType, OrderStatus, OrderData, OrderBaseData } from '../Order';
import { PairData } from '../Pair';

import { SwapQuoter, SwapRouter, Pool, Route, computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';

import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

import { Token, CurrencyAmount, TradeType } from '@uniswap/sdk-core'

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import * as ethers from 'ethers';

import {
  PromiEvent,
  TransactionReceipt,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | ethers.BigNumberish;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | ethers.BigNumberish;
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
	'function balanceOf(address owner) view returns (uint256)',
	'function approve(address _spender, uint256 _value) public returns (bool success)',
	'function allowance(address _owner, address _spender) public view returns (uint256 remaining)'
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
		_: ethers.ethers.TransactionReceipt
	) {

		// Reverted
		if (_.status !== 1)
			throw new Error(`Transaction reverted`);
	}

	async openOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		if (_.type !== OrderType.Market)
			throw new Error(`Market orders only`);

		let orderResponse: OrderBaseData = {};

		let logParts: string[] = [];
		let logType: Log = Log.Verbose;

		logParts.push(`Exchange '${this.name}'`);
		logParts.push(`api.openOrder`);

		const [tokenA, tokenB] = this._getUniswapTokens(_.pair);

		const pool = await this._getUniswapPool(
			tokenA,
			tokenB
		);

		// Establish input token, based on order side
		const tokenIn =
			_.side === OrderSide.Buy
			? (
				pool.token0.address === tokenA.address ? tokenA : tokenB
			)
			: (
				_.side === OrderSide.Sell
				? (
					pool.token0.address === tokenA.address ? tokenB : tokenA
				)
				: null
			);
		if (!tokenIn)
			throw new Error(`Unknown order side`);
		logParts.push(`Token In '${tokenIn.address}'`);

		const tokenOut = tokenIn === tokenA ? tokenB : tokenA;
		logParts.push(`Token Out '${tokenOut.address}'`);

		const amountIn = ethers.parseUnits(String(_.quantityActual), tokenIn.decimals).toString();
		logParts.push(`Amount In '${ethers.formatUnits(amountIn, tokenIn.decimals)}'`);

		// TODO: Implement routing
		const swapRoute = new Route(
			[pool],
			tokenIn,
			tokenOut
		);
		// console.log(`swapRoute`, swapRoute);

		const { calldata } = await SwapQuoter.quoteCallParameters(
			swapRoute,
			CurrencyAmount.fromRawAmount(
				tokenIn,
				amountIn
			),
			TradeType.EXACT_INPUT,
			{
				useQuoterV2: false,
			}
		);
		// console.log(`calldata`, calldata);

		const quoteCallReturnData = await this.handle?.provider?.call({
			to: QUOTER_CONTRACT_ADDRESS,
			data: calldata,
		});
		// console.log(`quoteCallReturnData`);
		// console.log(quoteCallReturnData);
		if (!quoteCallReturnData) {
			throw new Error(`Failed to call for 'quoteCallReturnData' on provider`);
		}
	
		const amountOut = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData);
		logParts.push(`Amount Out '${ethers.formatUnits(amountOut.toString(), tokenOut.decimals)}'`);

		const tokenContract = new ethers.Contract(
			_.pair.a.symbol,
			erc20Abi,
			this.handle?.provider
		);

		const transaction = await tokenContract.approve.populateTransaction(
			SWAP_ROUTER_ADDRESS,
			amountIn
		);
		// console.log(`transaction`, transaction);

		const response = await this.handle?.wallet?.sendTransaction(transaction);
		logParts.push(`Response '${JSON.stringify(response)}'`);

		Bot.log(logParts.join('; '), logType);

		if (!response)
			throw new Error(`Transaction failed`);

		orderResponse.responseStatus = OrderStatus.Pending;
		orderResponse.responseTime = Date.now();
		orderResponse.transactionId = orderResponse.transactionId
		? [
			...orderResponse.transactionId,
			response.hash
		]
		: [response.hash];

		return orderResponse;
	}

	async closeOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		return new Error(`Unsupported`);
	}

	async editOrder (
		_: OrderItem,
	): Promise<OrderBaseData> {
		return new Error(`Unsupported`);
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
					erc20Abi,
					// IERC20Minimal.abi,
					this.handle?.provider
				);

				// Build log message
				let logParts: string[] = [];
				let logType: Log = Log.Verbose;

				logParts.push(`Exchange '${this.name}'`);

				// Lookup existing token data
				let tokenData = this._getToken(addressList[i]);
				if (!tokenData) {

					// Get token name
					const name = await tokenContract.name();
					logParts.push(`Name '${name}'`);

					// Get token symbol
					const symbol = await tokenContract.symbol();
					logParts.push(`Symbol '${symbol}'`);

					// Get token decimals
					const decimals = Number(await tokenContract.decimals());
					logParts.push(`Decimals '${decimals}'`);

					tokenData = {
						name,
						symbol,
						decimals,
					};
				}

				// Query token contract for address balance
				const rawBalance = await tokenContract.balanceOf(this.handle?.address);

				const balance = Number(ethers.formatUnits(rawBalance, tokenData.decimals));
				// logParts.push(`Balance '${balance}'`);

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

				Bot.log(logParts.join('; '), logType);
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

		// Get latest order transaction ID index
		let lastTransactionIdx = 0;
		if (!_.transactionId?.length)
			throw new Error(`Missing transaction ID`);

		lastTransactionIdx = _.transactionId.length - 1;

		// TODO: No await response, return pending, allow update later
		let receipt: ethers.ethers.TransactionReceipt | null | undefined = null
		while (receipt === null) {
			try {
				receipt = await this.handle?.provider?.getTransactionReceipt(_.transactionId[lastTransactionIdx])
				if (receipt === null) {
					continue
				}
			} catch (error) {
				Bot.log(error, Log.Err);
				break
			}
		}

		if (receipt) {
			Bot.log(`Exchange '${this.name}'; api.getOrder; Receipt: '${JSON.stringify(receipt)}'`, Log.Verbose);

			// Handle any errors
			// this._handleError(receipt);

			// TODO: Verify the statuses on types
			orderResponse.responseStatus =
				receipt.status === 1
				? (_.type === OrderType.Market ? OrderStatus.Closed : OrderStatus.Open)
				: OrderStatus.Error;

			// TODO: Use block time
			orderResponse.responseTime = Date.now();
		}

		return orderResponse;
	}

	_getChainId(): number {
		return Number(process.env.WEB3_CHAIN_ID!)
	}
	
	_getUniswapTokens (
		_: PairData,
	): Token[] {
		const tokenAData = this._getToken(_.a.symbol);
		const tokenADecimals = tokenAData?.decimals ?? 0;
	
		const tokenBData = this._getToken(_.b.symbol);
		const tokenBDecimals = tokenBData?.decimals ?? 0;
	
		const chainId = this._getChainId();
	
		return [
			new Token(
				chainId,
				_.a.symbol,
				tokenADecimals,
				tokenAData?.symbol,
				tokenAData?.name
			),
			new Token(
				chainId,
				_.b.symbol,
				tokenBDecimals,
				tokenBData?.symbol,
				tokenBData?.name
			)
		];
	}

	async _getUniswapPool(
		tokenA: Token,
		tokenB: Token,
	): Promise<Pool> {
		const currentPoolAddress = computePoolAddress({
			factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
			tokenA: tokenA,
			tokenB: tokenB,
			fee: FeeAmount.HIGH,
		})

		const poolContract = new ethers.Contract(
			currentPoolAddress,
			IUniswapV3PoolABI.abi,
			this.handle?.provider
		);

		const [
			token0,
			token1,
			fee,
			liquidity,
			slot0
		]: [
			string,
			string,
			ethers.BigNumberish,
			ethers.BigNumberish,
			[
				ethers.BigNumberish,
				ethers.BigNumberish,
				ethers.BigNumberish,
				ethers.BigNumberish,
				ethers.BigNumberish,
				ethers.BigNumberish,
				boolean
			]
		] = await Promise.all([
			poolContract.token0(),
			poolContract.token1(),
			poolContract.fee(),
			poolContract.liquidity(),
			poolContract.slot0(),
		]);

		return new Pool(
			tokenA,
			tokenB,
			Number(fee.toString()),
			slot0[0].toString(),
			liquidity.toString(),
			Number(slot0[1].toString())
		)
	}

	async _getUniswapQuote(
		pool: Pool,
		amount: string,
	): Promise<ethers.BigNumberish> {
		try {
			const quoterContract = new ethers.Contract(
				QUOTER_CONTRACT_ADDRESS,
				Quoter.abi,
				this.handle?.provider
			);
	
			return await quoterContract.quoteExactInputSingle.staticCall(
				pool.token0.address,
				pool.token1.address,
				pool.fee,
				amount,
				// TODO: Fix quoteExactInputSingle pool.sqrtRatioX96
				0, //pool.sqrtRatioX96
			);
		} catch (error) {
			Bot.log(error, Log.Err);
			return 0;
		}
	}

	async getTicker (
		_: PairData,
		amount?: string | number,
	): Promise<ExchangeApiTickerData> {
		let returnData: ExchangeApiTickerData = {};
		returnData.ticker = [];
		returnData.tickerIndex = [];

		// Build log message
		let logParts: string[] = [];
		let logType: Log = Log.Info;

		logParts.push(`Exchange '${this.name}'`);
		logParts.push(`api.getTicker`);

		// TODO: fix
		// if (_.exchange.uuid !== this.uuid)
		// 	throw new Error(`Exchange '${this.name}'; api.Pair '${_.name}'; api.Incompatible exchange pair`);
		
		const pairTicker = `${_.a.symbol}-${_.b.symbol}`;
		logParts.push(`Pair: '${pairTicker}'`);
		
		const [tokenA, tokenB] = this._getUniswapTokens(_);

		const amountIn = ethers.parseUnits(String(amount ?? 1), tokenA.decimals).toString();
		const amountInReal = Number(ethers.formatUnits(amountIn, tokenA?.decimals));
		logParts.push(`Amount In: '${amountInReal}'`);

		const pool = await this._getUniswapPool(
			tokenA,
			tokenB
		);
		// console.log(`pool`, pool);

		const amountOut = await this._getUniswapQuote(
			pool,
			amountIn
		);
		const amountOutReal = Number(ethers.formatUnits(amountOut, tokenB?.decimals));
		logParts.push(`Amount Out: '${amountOutReal}'`);

		Bot.log(logParts.join('; '), logType);

		const tickerData: ExchangeTickerData = {
			decimals: Number(tokenB?.decimals),
			price: amountOutReal,
			// liquidity: Number(ethers.formatUnits(liquidity, tokenAData?.decimals))
		};

		const index = returnData.tickerIndex.indexOf(pairTicker);
		if (index < 0) {
			returnData.ticker.push(tickerData);
			returnData.tickerIndex.push(pairTicker);
		} else
			returnData.ticker[index] = tickerData;

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

		// TODO: CoinGecko API?

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

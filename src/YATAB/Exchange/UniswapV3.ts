import { YATAB, Log } from '../YATAB';
import {
	ExchangeApiBalanceData,
	ExchangeApiData,
	ExchangeApiTickerData,
	ExchangeBalanceData,
	ExchangeOrderApiInterface,
	ExchangeTickerData
} from '../Exchange';
import {
	OrderSide,
	OrderItem,
	OrderType,
	OrderStatus,
	OrderData,
	OrderBaseData
} from '../Order';
import { PairData } from '../Pair';

import {
	SwapQuoter,
	SwapRouter,
	Pool,
	Route,
	SwapOptions,
	Trade
} from '@uniswap/v3-sdk';

import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

import {
	Percent,
	Token,
	CurrencyAmount,
	TradeType
} from '@uniswap/sdk-core'

import * as ethers from 'ethers';

import {
  PromiEvent,
  TransactionReceipt,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

import { Web3, erc20Abi } from '../../Helper/Web3';

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

export const QUOTER_CONTRACT_ADDRESS =
 '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

export const SWAP_ROUTER_ADDRESS =
 '0xE592427A0AEce92De3Edee1F18E0157C05861564';

export type UniswapV3ExchangeResponse = {
	result: any,
	error?: string[],
};

export class UniswapV3Exchange extends Web3 implements ExchangeOrderApiInterface {
	constructor (
		_: ExchangeApiData,
	) {
		super(_);
	}

	async getQuote(
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
			YATAB.log(error, Log.Err);
			return 0;
		}
	}

	handleError (
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

		const [tokenA, tokenB] = await this.getErc20FromPair(_.pair);

		const poolAddress = this.getPoolAddress(
			tokenA,
			tokenB
		);

		const pool = await this.getPool(
			poolAddress,
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

		// TODO: Check `allowance` before sending `approve`

		// Approve
		const transaction = await tokenContract.approve.populateTransaction(
			SWAP_ROUTER_ADDRESS,
			amountIn
		);
		// console.log(`transaction`, transaction);

		const responseApprove = await this.handle?.wallet?.sendTransaction(transaction);
		logParts.push(`Approve response '${JSON.stringify(responseApprove)}'`);
		// console.log(`responseApprove`, responseApprove);

		if (!responseApprove)
			throw new Error(`Transaction for approval failed`);




		// Swap
		// TODO: Need to try on a testnet with V3 pools
		const options: SwapOptions = {
			slippageTolerance: new Percent(100, 10_000), // 50 bips, or 0.50%
			deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
			recipient: String(this.handle?.wallet?.address),
		};
		// console.log(`options`, options);

		const uncheckedTradeData = {
			route: swapRoute,
			inputAmount: CurrencyAmount.fromRawAmount(
				tokenIn,
				ethers.parseUnits(String(amountIn ?? 1), tokenIn.decimals).toString()
			),
			outputAmount: CurrencyAmount.fromRawAmount(
				tokenOut,
				amountOut.toString()
			),
			tradeType: TradeType.EXACT_INPUT,
		};
		console.log(`uncheckedTradeData`, uncheckedTradeData);
		const uncheckedTrade = Trade.createUncheckedTrade(uncheckedTradeData);
		console.log(`uncheckedTrade`, uncheckedTrade);
		// console.log(`uncheckedTrade.pools`, uncheckedTrade.route.pools[0]);

		const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], options);
		console.log(`methodParameters`, methodParameters);

		const MAX_FEE_PER_GAS = 100000000000;
		const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
		
		const responseSwapData = {
			data: methodParameters.calldata,
			to: SWAP_ROUTER_ADDRESS,
			value: methodParameters.value,
			from: String(this.handle?.wallet?.address),
			maxFeePerGas: MAX_FEE_PER_GAS,
			maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
		};
		console.log(`responseSwapData`, responseSwapData);
		const responseSwap = await this.handle?.wallet?.sendTransaction(responseSwapData)
		console.log(`responseSwap`, responseSwap);

		logParts.push(`Swap response '${JSON.stringify(responseSwap)}'`);





		


		YATAB.log(logParts.join('; '), logType);

		if (!responseSwap)
			throw new Error(`Transaction for swap failed`);

		orderResponse.responseStatus = OrderStatus.Pending;
		orderResponse.responseTime = Date.now();
		orderResponse.transactionId = orderResponse.transactionId
		? [
			...orderResponse.transactionId,
			responseSwap.hash
		]
		: [responseSwap.hash];

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
				
				// Build log message
				let logParts: string[] = [];
				let logType: Log = Log.Verbose;

				logParts.push(`Exchange '${this.name}'`);

				// Lookup existing token data
				let tokenData = await this.getErc20(addressList[i]);
				logParts.push(`Name '${tokenData.name}'`);
				logParts.push(`Symbol '${tokenData.symbol}'`);
				logParts.push(`Decimals '${tokenData.decimals}'`);

				const tokenContract = new ethers.Contract(
					addressList[i],
					erc20Abi,
					this.handle?.provider
				);

				// Query token contract for address balance
				const rawBalance = await tokenContract.balanceOf(this.handle?.address);

				const balance = Number(ethers.formatUnits(rawBalance, tokenData.decimals));
				logParts.push(`Balance '${balance}'`);

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

				YATAB.log(logParts.join('; '), logType);
			}
		} catch(error) {
			YATAB.log(error, Log.Err);
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
				YATAB.log(error, Log.Err);
				break
			}
		}

		if (receipt) {
			YATAB.log(`Exchange '${this.name}'; api.getOrder; Receipt: '${JSON.stringify(receipt)}'`, Log.Verbose);

			// Handle any errors
			// this.handleError(receipt);

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
		
		const [tokenA, tokenB] = await this.getErc20FromPair(_);

		const amountIn = ethers.parseUnits(String(amount ?? 1), tokenA.decimals).toString();
		const amountInReal = Number(ethers.formatUnits(amountIn, tokenA?.decimals));
		logParts.push(`Amount In: '${amountInReal}'`);

		const poolAddress = this.getPoolAddress(
			tokenA,
			tokenB
		);

		const pool = await this.getPool(
			poolAddress,
			tokenA,
			tokenB
		);
		// console.log(`pool`, pool);

		const amountOut = await this.getQuote(
			pool,
			amountIn
		);
		const amountOutReal = Number(ethers.formatUnits(amountOut, tokenB?.decimals));
		logParts.push(`Amount Out: '${amountOutReal}'`);

		YATAB.log(logParts.join('; '), logType);

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
}

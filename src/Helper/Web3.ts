import {
	Percent,
	Token,
	CurrencyAmount,
	TradeType
} from '@uniswap/sdk-core'
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk';
import { PairData } from '../Bot/Pair';
import { ExchangeApiData } from '../Bot/Exchange';

import {
	SwapQuoter,
	SwapRouter,
	Pool,
	Route,
	SwapOptions,
	Trade
} from '@uniswap/v3-sdk';

import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

import * as ethers from 'ethers';
import { Bot, Log } from '../Bot/Bot';

// ERC-20 Token Contract ABI
export const erc20Abi = [
	'function name() public view returns (string)',
	'function symbol() public view returns (string)',
	'function decimals() public view returns (uint8)',
	'function balanceOf(address owner) view returns (uint256)',
	'function approve(address _spender, uint256 _value) public returns (bool success)',
	'function allowance(address _owner, address _spender) public view returns (uint256 remaining)'
];

export const POOL_FACTORY_CONTRACT_ADDRESS =
 '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export type Web3ExchangeHandle = {
	address?: string,
	provider?: ethers.JsonRpcProvider,
	router?: SwapRouter,
	wallet?: ethers.Wallet,
}

 export type Web3ExchangeToken = {
	balance?: number,
	decimals?: number,
	name?: string,
	symbol?: string,
}

export type Web3Interface = {
	token: Web3ExchangeToken[],
	tokenIndex: string[],
};

export class Web3 implements Web3Interface {
	name: string;
	uuid: string;

	token: Web3ExchangeToken[];
	tokenIndex: string[];

	handle?: Web3ExchangeHandle;

	constructor (
		_: ExchangeApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;
		this.token = [];
		this.tokenIndex = [];

		this.handle = {
			address: process.env.WEB3_ADDRESS!,
			provider: new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URI!),
		};

		this.handle.wallet = new ethers.Wallet(
			process.env.WEB3_PRIVATE_KEY!,
			this.handle.provider,
		);
	}

	getPoolAddress (
		tokenA: Token,
		tokenB: Token,
	): string {
		return computePoolAddress({
			factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
			tokenA: tokenA,
			tokenB: tokenB,
			fee: FeeAmount.HIGH,
		});
	}

	async getPool(
		address: string,
		tokenA: Token,
		tokenB: Token,
	): Promise<Pool> {
		const poolContract = new ethers.Contract(
			address,
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

	getChainId (): number {
		return Number(process.env.WEB3_CHAIN_ID!)
	}

	async getErc20 (
		address: string
	) {
		let index = this.tokenIndex.indexOf(address);
		if (index < 0) {
			// Connect to the token contract
			const tokenContract = new ethers.Contract(
				address,
				erc20Abi,
				this.handle?.provider
			);

			const name = await tokenContract.name();
			const symbol = await tokenContract.symbol();
			const decimals = Number(await tokenContract.decimals());

			const tokenData: Web3ExchangeToken = {
				name,
				symbol,
				decimals,
			};

			index = this.tokenIndex.length;

			this.token.push(tokenData);
			this.tokenIndex.push(address);
		}

		return this.token[index];
	}

	async getErc20FromPair (
		_: PairData,
	): Promise<Token[]> {
		const tokenAData = await this.getErc20(_.a.symbol);
		const tokenADecimals = tokenAData?.decimals ?? 0;
	
		const tokenBData = await this.getErc20(_.b.symbol);
		const tokenBDecimals = tokenBData?.decimals ?? 0;
	
		const chainId = this.getChainId();
	
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
}
import { Bot, Log } from '../Bot';
import { ChartCandleData, ChartItem } from '../Chart';
import {
	ExchangeApiData,
	ExchangeApiTickerData,
	ExchangeTickerApiInterface,
	ExchangeTickerData
} from '../Exchange';
import { PairData } from '../Pair';
import { Web3 } from '../../Helper/Web3';

import axios from 'axios';

export const ACCEPT_VERSION = '20230302';

export type GeckoTerminalV2ExchangeResponseData = {
	id: string,
	type: string,
	attributes: {
		[index: string]: any,
		ohlcv_list?: any, // TODO: type
	},
};

export type GeckoTerminalV2ExchangeResponseError = {
	status: string,
	title: string,
};

export type GeckoTerminalV2ExchangeResponse = {
	data: GeckoTerminalV2ExchangeResponseData,
	errors?: GeckoTerminalV2ExchangeResponseError[],
	meta?: any, // TODO: type
};

export type GeckoTerminalV2ExchangeInterface =
	& ExchangeTickerApiInterface
	& {
		api: (
			path: string,
		) => Promise<GeckoTerminalV2ExchangeResponse>,

		requestWindow: number,
		requests: number,
	}

export class GeckoTerminalV2Exchange extends Web3 implements GeckoTerminalV2ExchangeInterface {
	requestWindow: number;
	requests: number;

	constructor (
		_: ExchangeApiData,
	) {
		super(_);

		this.requestWindow = Date.now();
		this.requests = 0;
	}

	handleError (
		_: GeckoTerminalV2ExchangeResponse
	) {
		if (_.errors) {
			for (let i = 0; i < _.errors.length; i++) {
				Bot.log(_.errors[i], Log.Err);
			}

			const lastError = _.errors?.pop();
			throw new Error(lastError?.title ?? lastError?.status);
		}
	}

	getTier() {
		return {
			requestWindow: 60000,
			maxRequests: 30,
		};
	}

	async api(
		path: string,
	): Promise<GeckoTerminalV2ExchangeResponse> {
		const tier = this.getTier();

		// Respect 30 requests per minute on free API.
		if (this.requests >= tier.maxRequests) {
			const currentWindow = Date.now() - this.requestWindow;
			if (currentWindow < tier.requestWindow)
				throw new Error(`API limit reached, please wait ${Math.ceil(tier.requestWindow - currentWindow / 1000)} seconds.`);

			this.requestWindow = Date.now();
			this.requests = 0;
		}
		this.requests++;

		const endpointUrl = `https://api.geckoterminal.com/api/v2${path}`;
		Bot.log(`GeckoTerminalV2.endpointUrl: ${endpointUrl}`, Log.Verbose);

		const response = await axios.get(
			endpointUrl,
			{
				headers: {
					'Accept': `application/json;version=${ACCEPT_VERSION}`,
				}
			}
		);

		if (response.status !== 200)
			throw new Error(`HTTP${response.status}; ${response.statusText}`);

		return response.data as GeckoTerminalV2ExchangeResponse;
	}

	async getTicker (
		_: PairData,
	): Promise<ExchangeApiTickerData> {
		// TODO: fix
		// if (_.exchange.uuid !== this.uuid)
		// 	throw new Error(`Exchange '${this.name}'; api.Pair '${_.name}'; api.Incompatible exchange pair`);
		
		const pairLocal = `${_.a.name}-${_.b.name}`;
		const pairForeign = `${_.a.symbol}-${_.b.symbol}`;

		Bot.log(`Exchange '${this.name}'; api.getTicker; Pair: '${pairLocal}'; Foreign: '${pairForeign}'`, Log.Verbose);

		const network = 'eth';
		const addresses = `${_.a.symbol},${_.b.symbol}`;

		// Get ticker for pool
		let responseJson = await this.api(
			`/simple/networks/${network}/token_price/${addresses}`,
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.getTicker; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		if (!responseJson)
			throw new Error(`Invalid 'Ticker' response`);

		// Handle any ticker errors
		this.handleError(responseJson);

		let returnData: ExchangeApiTickerData = {};
		returnData.ticker = [];
		returnData.tickerIndex = [];

		// Walk all balances
		for (let resultToken in responseJson.data.attributes.token_prices) {
			// Bot.log(`resultToken: ${resultToken}`, Log.Verbose);
			// Bot.log(`price: ${Number(responseJson.data.attributes.token_prices[resultToken])}`, Log.Verbose);
			// Get asset pair information on exchange
			// TODO: possible caching?

			const thisToken = await this.getErc20(resultToken);

			const tickerData: ExchangeTickerData = {
				decimals: thisToken?.decimals,
				price: Number(responseJson.data.attributes.token_prices[resultToken]),
			};

			const index = returnData.tickerIndex.indexOf(resultToken);
			if (index < 0) {
				returnData.ticker.push(tickerData);
				returnData.tickerIndex.push(resultToken);
			} else
				returnData.ticker[index] = tickerData;
		}

		// Add pair A symbol (token address) as pair ticker
		const tokenAPos = returnData.tickerIndex.indexOf(_.a.symbol);
		if (tokenAPos < 0)
			throw new Error(`Pair A symbol, not found in response.`);

		const tickerData: ExchangeTickerData = {
			decimals: returnData.ticker[tokenAPos].decimals,
			price: Number(returnData.ticker[tokenAPos].price),
		};

		returnData.ticker.push(tickerData);
		returnData.tickerIndex.push(pairForeign);

		return returnData;
	}

	async syncChart (
		chart: ChartItem,
	): Promise<ChartCandleData> {
		let nextDate = new Date(chart.datasetNextTime);
		Bot.log(`Chart '${chart.name}'; api.syncChart; From: ${nextDate.toISOString()}`);

		const aggregateOptions = [
			60000,
			300000,
			900000,
			3600000,
			14400000,
			43200000,
			86400000
		];

		const pos = aggregateOptions.indexOf(chart.candleTime);
		if (pos < 0)
			throw new Error(`Unsupported candle size`);

		const [tokenA, tokenB] = await this.getErc20FromPair(chart.pair);

		const network = 'eth';

		const poolAddress = this.getPoolAddress(
			tokenA,
			tokenB
		);

		const pool = await this.getPool(
			poolAddress,
			tokenA,
			tokenB
		);

		const timeframe = pos < 3 ? 'minute' : pos < 6 ? 'hour' : 'day';
		const aggregate = chart.candleTime / (pos < 3 ? 60000 : pos < 6 ? 3600000 : 86400000);
		const token = pool.token0.address === tokenA.address ? 'base' : 'quote';
		
		let responseJson = await this.api(
			`/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}` +
			`?aggregate=${aggregate}` +
			`&before_timestamp=${Math.floor(chart.datasetNextTime / 1000)}` +
			`&limit=100` +
			`&currency=usd` +
			`&token=${token}`
		);

		// Log raw response
		Bot.log(`Exchange '${this.name}'; api.syncChart; Response: '${JSON.stringify(responseJson)}'`, Log.Verbose);

		let etlData: ChartCandleData = {
			close: [],
			high: [],
			low: [],
			open: [],
			openTime: [],
			tradeCount: [],
			volume: [],
			vwap: [],
		};

		// Extract, transform, load response to chart
		let pairData = responseJson?.data?.attributes?.ohlcv_list;
		if (!pairData)
			throw new Error(`Invalid response from GeckoTerminalV2`);

		let p: {
			0: number,
			1: string,
			2: string,
			3: string,
			4: string,
			5: string,
		};

		for (let i = 0; i < pairData.length; i++) {
			p = pairData[i];
			// Bot.log(p[0]);return;
			etlData.openTime?.push(p[0]);
			etlData.open?.push(p[1]);
			etlData.high?.push(p[2]);
			etlData.low?.push(p[3]);
			etlData.close?.push(p[4]);
			etlData.volume?.push(p[5]);
		}

		return etlData;
	}
}

import { Exchange, ExchangeData } from './Exchange';
import { Asset, AssetData } from './Asset';
import { Pair, PairData } from './Pair';
import { Position, PositionData } from './Position';
import { Chart, ChartData } from './Chart';
import { Strategy, StrategyData } from './Strategy';
import { Analysis, AnalysisData } from './Analysis';

let analysis: Analysis[] = [];
let asset: Asset[] = [];
let chart: Chart[] = [];
let exchange: Exchange[] = [];
let pair: Pair[] = [];
let position: Position[] = [];
let strategy: Strategy[] = [];

enum Level {
	Info = 0,
	Warn = 1,
	Err = 2,
}

export const Bot = {

	console: function (
		string: string,
		level: Level,
	) {
		let now = new Date();
		let consoleString = `${now.toISOString()}: ${string}`;

		if (level === Level.Info)
			console.log(consoleString);
		else if (level === Level.Warn)
			console.warn(consoleString);
		else
			console.error(consoleString);
	},

	getExchangeById: function (
		id: number
	) {
		return exchange[id];
	},

	setExchange: function (
		data: ExchangeData,
	): Exchange {
		const id: number = exchange.length;
		console.log(`setExchangeId: ${id}`);

		exchange[id] = new Exchange(
			data,
		);

		return exchange[id];
	},

	getAssetById: function (
		id: number
	) {
		return asset[id];
	},

	setAsset: function (
		data: AssetData,
	): Asset {
		const id: number = asset.length;
		console.log(`setAssetId: ${id}`);

		// Object.entries(data).forEach((key, val) => {
		// 	console.log(`${key}: ${val}`);
		// });

		asset[id] = new Asset(
			data,
		);

		return asset[id];
	},

	getPairById: function (
		id: number
	) {
		return pair[id];
	},

	setPair: function (
		data: PairData,
	): Pair {
		const id: number = pair.length;
		console.log(`setPairId: ${id}`);

		pair[id] = new Pair(
			data
		);

		return pair[id];
	},

	getPositionById: function (
		id: number
	) {
		return position[id];
	},

	setPosition: function (
		data: PositionData,
	): Position {
		const id: number = position.length;
		console.log(`setPositionId: ${id}`);

		position[id] = new Position(
			data,
		);

		return position[id];
	},

	getAnalysisById: function (
		id: number
	) {
		return analysis[id];
	},

	setAnalysis: function (
		data: AnalysisData,
	): Analysis {
		const id: number = analysis.length;
		console.log(`setAnalysisId: ${id}`);

		analysis[id] = new Analysis(
			data,
		);

		return analysis[id];
	},

	getChartById: function (
		id: number
	) {
		return chart[id];
	},

	setChart: function (
		data: ChartData,
	): Chart {
		const id: number = chart.length;
		console.log(`setChartId: ${id}`);

		chart[id] = new Chart(
			data,
		);

		return chart[id];
	},

	getStrategyById: function (
		id: number
	) {
		return strategy[id];
	},

	setStrategy: function (
		data: StrategyData,
	): Strategy {
		const id: number = strategy.length;
		console.log(`setStrategyId: ${id}`);

		strategy[id] = new Strategy(
			data,
		);

		return strategy[id];
	},
};
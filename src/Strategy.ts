import { Analysis } from "./Analysis";
import { Chart } from "./Chart";
import { Pair } from "./Pair";

const talib = require('./talib');

export type StrategyData = {
	analysis: Analysis[],
	chart: Chart,
	name?: string,
	pair: Pair,

	// Seconds
	timeframe: number;
}

export class Strategy implements StrategyData {
	analysis: Analysis[];
	chart: Chart;
	name?: string;
	pair: Pair;
	timeframe: number;

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		this.pair = data.pair;
		this.timeframe = data.timeframe > 0 ? data.timeframe : 0;
	}

	execute () {
		
		console.log(talib.explain({

		}));
	}
}
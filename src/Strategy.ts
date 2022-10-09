import { Analysis } from "./Analysis";
import { Chart } from "./Chart";

const talib = require('talib');

export type StrategyData = {
	analysis: Analysis[],
	chart: Chart,
	name?: string,
}

export class Strategy implements StrategyData {
	analysis: Analysis[];
	chart: Chart;
	name?: string;

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
	}

	setChart(
		chart: Chart
	) {
		this.chart = chart;
	}

	execute () {
		let analysis: Analysis;
		for (let i = 0; i < this.analysis.length; i++) {
			analysis = this.analysis[i];
			// console.log(analysis);
			let talibArgs = {
				name: analysis.name,
				startIdx: 0,
			};
			let executeOptions = {
    			...talibArgs,
				...analysis.config,
				endIdx: this.chart['close'].length - 1,
    			inReal: this.chart['close'], // this.chart.config.inReal
			};
			// console.log(executeOptions);
			let result = talib.execute(executeOptions);
			console.log(result);
		}
	}
}
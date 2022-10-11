import { Analysis } from "./Analysis";
import { Chart } from "./Chart";
import { uuid } from 'uuidv4';

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
	uuid: string;
	result: object[];
	resultIndex: string[];

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		this.result = [];
		this.resultIndex = [];
		this.uuid = uuid();
	}

	/**
	 * Replace `Chart` data
	 * 
	 * @param chart 
	 */
	setChart (
		chart: Chart
	) {
		this.chart = chart;
	}

	/**
	 * Return (if exists) previously executed analysis
	 * 
	 * @param analysis 
	 * @returns 
	 */
	getResult (
		analysis: Analysis
	) {
		let index = this.resultIndex.findIndex(_uuid => _uuid === analysis.uuid);

		if (index >= 0)
			return this.result[index];
		return false;
	}

	/**
	 * Execute all analysis on the strategy
	 */
	execute () {
		let analysis: Analysis;
		for (let i = 0; i < this.analysis.length; i++) {
			analysis = this.analysis[i];

			let inReal: string[];

			// Source the result of previously executed analysis
			if (analysis.config?.inRealAnalysis) {
				if (!analysis.config.inRealField)
					throw ('Analysis dataset input field is unknown.');

				let analysisResult = this.getResult(analysis.config.inRealAnalysis);
				if (!analysisResult)
					throw ('No result found for provided analysis, make sure it executes before this analysis.');

				inReal = analysisResult.result[analysis.config.inRealField];
			}

			// Source chart data
			else if (analysis.config?.inRealField) {
				inReal = this.chart[analysis.config.inRealField];
			}

			if (!inReal)
				throw ('Analysis dataset input is empty.');

			let talibArgs = {
				name: analysis.name,
				startIdx: 0,
			};
			let executeOptions = {
				...talibArgs,
				...analysis.config,
				endIdx: inReal.length - 1,
				inReal: inReal,
			};
			let result = talib.execute(executeOptions);

			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}
	}
}
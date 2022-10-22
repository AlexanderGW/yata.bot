import { Analysis, AnalysisResultData } from "./Analysis";
import { Chart } from "./Chart";
import { uuid } from 'uuidv4';
import { Scenario } from "./Scenario";

const talib = require('talib');

export type StrategyData = {
	analysis: Analysis[],
	chart: Chart,
	name?: string,
	action: Array<[Scenario, Strategy?]>,
}

export class Strategy implements StrategyData {
	analysis: Analysis[];
	chart: Chart;
	name?: string;
	uuid: string;
	result: object[];
	resultIndex: string[];
	action: Array<[Scenario, Strategy?]>;

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		this.result = [];
		this.resultIndex = [];
		this.action = data.action;
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
		let i: number;
		let action: [Scenario, Strategy?];

		// The shortest result data set length
		let resultMaxLength: number = 0;

		// Process analysis
		for (i = 0; i < this.analysis.length; i++) {
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
				throw (`Analysis dataset input '${inReal}' is empty.`);

			// Prepare talib options
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

			// Execute
			let result = talib.execute(executeOptions);

			// Track the shortest data set
			if (
				resultMaxLength === 0
				|| (
					result.nbElement > 0
					&& result.nbElement < resultMaxLength
				)
			)
				resultMaxLength = result.nbElement;

			// Store results
			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}

		// Process actions
		for (i = 0; i < this.action.length; i++) {
			action = this.action[i];

			// Add specified analysis results, to the test dataset
			let analysis: Analysis;
			let result: object | boolean;
			let analysisData: Array<[Analysis, object]> = [];
			for (let i = 0; i < action[0].analysis.length; i++) {
				analysis = this.analysis[i];

				result = this.getResult(analysis);
				if (result)
					analysisData.push([analysis, result]);
			}

			let signalTimes: string[] = [];
			let timeField: string = '';

			if (this.chart['openTime'])
				timeField = 'openTime';
			else if (this.chart['closeTime'])
				timeField = 'closeTime';

			// Test scenario conditions against analysis, or candle metrics
			try {
				let signal: any = action[0].test({
					chart: this.chart,
					analysisData: analysisData,
	
					resultMaxLength: resultMaxLength,
	
					// Optional `Strategy` to execute on a `Scenario` match
					strategy: action[1],
				});
	
				// Console log details on matched data points
				console.info(`Strategy '${this.name}' scenario '${action[0].name}' analysis matches: ${signal.length}`);
	
				// if (this.chart[timeField]) {
				// 	for (let j = 0; j < signal.length; j++) {
				// 		let k = signal[j];
				// 		// console.log(analysisData[0][1].nbElement);
				// 		// let l = k + (this.chart.open.length - resultMaxLength));
				// 		let date = new Date(parseInt(this.chart[timeField][k]) * 1000);
				// 		signalTimes.push(date.toISOString());
				// 		console.log(date.toISOString());
				// 		// console.log(analysisData[0][1].result['outMACDHist'][(k-1)]);
				// 		// console.log(analysisData[0][1].result['outMACDHist'][k]);
				// 		// console.log(Object.keys(analysisData[l][1].result));
				// 	}
				// }

				// console.log(signal);
				if (signal) {
					for (let j = 0; j < signal.length; j++) {
						let latestCandle = signal[j].length - 1;
						let matchFirstCond = signal[j][latestCandle][0];
						let date = new Date(parseInt(this.chart[timeField][matchFirstCond.k]) * 1000);
						signalTimes.push(date.toISOString());
						console.log(date.toISOString());
						// let k = signal[j];
						for (let l = 0; l < signal[j].length; l++) {
							let m = signal[j][l];
							// console.log(analysisData[0][1].nbElement);
							// let l = k + (this.chart.open.length - resultMaxLength));
							// console.log(m);
							// console.log(this.chart.open[matchFirstCond.k]);
							// console.log(analysisData[0][1].result['outMACDHist'][(k-1)]);
							// console.log(analysisData[0][1].result['outMACDHist'][k]);
							// console.log(Object.keys(analysisData[l][1].result));
						}
					}
				}
	
				// console.log(this.chart.open.length);
				// console.log(analysisData[0][1].result['outMACDHist'].length);
	
				// console.log(`Data point matches (by field: ${timeField.length ? timeField : 'index'}): ${signalTimes.length ? signalTimes.join(', ') : signal.join(', ')}`);
			} catch (err) {
				console.error(err);
			}
		}
	}
}
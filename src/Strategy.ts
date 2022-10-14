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
				throw ('Analysis dataset input is empty.');

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

			// Store results
			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}

		// Process actions
		for (i = 0; i < this.action.length; i++) {
			action = this.action[i];

			let analysis: Analysis;
			let result: object | boolean;
			let testResult: Array<object> = [];
			for (let i = 0; i < action[0].analysis.length; i++) {
				analysis = this.analysis[i];

				result = this.getResult(analysis);
				if (result)
					testResult.push(result);
			}

			// Test scenario conditions
			let signal = action[0].test(
				testResult
			);

			console.log(`signal: ${signal}`);

			// Positive action scenario signal, fire chained strategy
			// if (signal && action[1])
				//action[1]
			
			// Return action scenario signal
			// else
			// 	return signal;
		}
	}
}
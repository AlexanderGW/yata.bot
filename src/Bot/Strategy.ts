import { AnalysisExecuteData, AnalysisItem } from "./Analysis";
import { ChartItem } from "./Chart";
import { uuid } from 'uuidv4';
import { ScenarioItem } from "./Scenario";
import { Bot } from "./Bot";

const talib = require('talib');

export type StrategyData = {
	analysis: AnalysisItem[],
	chart: ChartItem,
	name?: string,
	action: Array<[ScenarioItem, StrategyItem?]>,
	uuid?: string,
}

export type StrategyExecuteData = {
	maxTime: number,
}

export class StrategyItem implements StrategyData {
	analysis: AnalysisItem[];
	chart: ChartItem;
	name?: string;
	uuid: string;
	result: object[] = [];
	resultIndex: string[] = [];
	action: Array<[ScenarioItem, StrategyItem?]>;

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		this.action = data.action;
		this.uuid = data.uuid ?? uuid();
	}

	/**
	 * Replace `Chart` data
	 * 
	 * @param chart 
	 */
	setChart (
		chart: ChartItem
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
		analysis: AnalysisItem
	): AnalysisExecuteData | boolean {
		let index = this.resultIndex.findIndex(_uuid => _uuid === analysis.uuid);

		if (index >= 0)
			return this.result[index];
		return false;
	}

	/**
	 * Execute all analysis on the strategy
	 */
	execute (
		data: StrategyExecuteData,
	) {
		let analysis: AnalysisItem;
		let i: number;
		let action: [ScenarioItem, StrategyItem?];

		// Process analysis
		for (i = 0; i < this.analysis.length; i++) {
			analysis = this.analysis[i];

			let inReal: string[] = [];

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
				throw (`Analysis '${analysis.name}' dataset input '${inReal}' is empty.`);

			// Prepare talib options
			let talibArgs = {
				name: analysis.type,
				startIdx: 0,
			};
			let executeOptions = {
				...talibArgs,
				...analysis.config,
				endIdx: inReal.length - 1,
				inReal: inReal,
			};

			// Execute
			let result: AnalysisExecuteData = talib.execute(executeOptions);

			// Store results
			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}

		// Process actions
		for (i = 0; i < this.action.length; i++) {
			action = this.action[i];

			// Add specified analysis results, to the test dataset
			let analysis: AnalysisItem;
			let result: object | boolean;
			let analysisData: Array<[AnalysisItem, object]> = [];
			for (let i = 0; i < action[0].analysis.length; i++) {
				analysis = this.analysis[i];

				result = this.getResult(analysis);
				if (result)
					analysisData.push([analysis, result]);
			}

			// let signalTimes: string[] = [];
			let timeField: string = '';

			if (this.chart['openTime'])
				timeField = 'openTime';
			else if (this.chart['closeTime'])
				timeField = 'closeTime';

			// Test scenario conditions against analysis, or candle metrics
			let signal: any = [];
			try {
				signal = action[0].test({
					chart: this.chart,
					analysisData: analysisData,
	
					// Optional `Strategy` to execute on a `Scenario` match
					strategy: action[1],
					strategyExecuteData: data,
				});

				// Console log details on matched data points
				// console.info(`Strategy '${this.name}' scenario '${action[0].name}' analysis matches: ${signal.length}`);

				// console.log(`Leading data frame matches (by field: ${timeField.length ? timeField : 'index'})`);

				// if (signal) {
				// 	for (let j = 0; j < signal.length; j++) {
				// 		let latestCandle = signal[j].length - 1;
				// 		let matchFirstCond = signal[j][latestCandle][0];
				// 		let date = new Date(parseInt(this.chart[timeField][matchFirstCond.k]) * 1000);
				// 		// signalTimes.push(date.toISOString());
				// 		console.log(date.toISOString());
						
				// 		// Output details on all matching scenario conditions
				// 		// for (let l = 0; l < signal[j].length; l++) {
				// 		// 	console.log(signal[j][l]);
				// 		// }
				// 	}
				// }
			} catch (err) {
				console.error(err);
			}

			return signal;
		}
	}
}

export const Strategy = {
	new (
		data: StrategyData,
	) {
		let item = new StrategyItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
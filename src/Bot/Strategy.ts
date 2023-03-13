import { AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from "./Analysis";
import { Bot, Log } from "./Bot";
import { ChartCandleData, ChartItem } from "./Chart";
import { ScenarioConditionMatch, ScenarioItem } from "./Scenario";
import { v4 as uuidv4 } from 'uuid';
import { TimeframeItem } from "./Timeframe";

const talib = require('talib');

export type StrategyData = {
	analysis: AnalysisItem[],
	chart: ChartItem,
	name?: string,
	action: Array<[ScenarioItem, StrategyItem?]>,
	uuid?: string,
}

export type StrategyExecuteData = {
	windowTime: number,
	timeframe: TimeframeItem,
}

export class StrategyItem implements StrategyData {
	analysis: AnalysisItem[];
	chart: ChartItem;
	name?: string;
	uuid: string;
	result: Array<AnalysisResultData> = [];
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
		this.uuid = data.uuid ?? uuidv4();
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
	): AnalysisResultData | boolean {
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
		if (!this.chart.dataset)
			throw (`Chart '${this.chart.name}' dataset is empty`);
			
		let analysis: AnalysisItem;
		let i: number;
		let action: [ScenarioItem, StrategyItem?];

		let signal: Array<Array<Array<ScenarioConditionMatch>>> = [];

		// Process analysis
		for (i = 0; i < this.analysis.length; i++) {
			analysis = this.analysis[i];

			let inReal: number[] | string[] = [];
			let inRealField: string = '';
			if (analysis?.config?.inRealField) {
				inRealField = analysis.config.inRealField;
			}

			// Source the result of previously executed analysis
			if (analysis.config?.inRealAnalysis) {
				if (!inRealField)
					throw ('Analysis dataset input field is unknown.');

				let analysisResult = this.getResult(analysis.config.inRealAnalysis);
				if (analysisResult === false)
					throw ('No result found for provided analysis, make sure it executes before this analysis.');

				if (typeof analysisResult === 'object' && analysisResult.result) {
					let resultValue = analysisResult.result[inRealField as keyof AnalysisExecuteResultData];
					if (resultValue)
						inReal = resultValue;
				}
			}

			// Source chart data
			else if (analysis.config?.inRealField) {
				if (this.chart.dataset?.hasOwnProperty(inRealField)) {
					const resultValue = this.chart.dataset[inRealField as keyof ChartCandleData];
					if (resultValue)
						inReal = resultValue;
				}
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
			let result: AnalysisResultData = talib.execute(executeOptions);

			// console.log(result);

			// Store results
			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}

		// Process actions
		for (i = 0; i < this.action.length; i++) {
			action = this.action[i];

			// Add specified analysis results, to the test dataset
			let analysis: AnalysisItem;
			let result;
			let analysisData: Array<[AnalysisItem, AnalysisResultData]> = [];
			for (let i = 0; i < action[0].analysis.length; i++) {
				analysis = this.analysis[i];

				result = this.getResult(analysis);
				if (typeof result !== 'boolean')
					analysisData.push([analysis, result]);
			}

			let timeField: string = '';
			if (this.chart.dataset?.openTime)
				timeField = 'openTime';
			else if (this.chart.dataset?.closeTime)
				timeField = 'closeTime';

			// Test scenario conditions against analysis, or candle metrics
			try {
				signal = action[0].test({
					chart: this.chart,
					analysisData: analysisData,
	
					// Optional `Strategy` to execute on a `Scenario` match
					strategy: action[1],
					strategyExecuteData: data,
				});
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}

		return signal;
	}
}

export const Strategy = {
	new (
		data: StrategyData,
	): StrategyItem {
		let item = new StrategyItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
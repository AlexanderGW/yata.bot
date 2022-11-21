import { AnalysisData, AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from './Analysis';
import { Bot } from './Bot';
import { ChartCandleData, ChartItem } from './Chart';
import { StrategyExecuteData, StrategyItem } from './Strategy';
import { v4 as uuidv4 } from 'uuid';

export type ScenarioConditionData = Array<Array<[string, string, number | string]>>;

export type ScenarioData = {
	analysis: AnalysisItem[],
	name: string,
	condition: ScenarioConditionData,
	uuid?: string,
}

export type ScenarioSignalData = {
	k: number,
	valueA: string,
	valueAReal: string,
	operator: string,
	valueB: string | number,
	valueBReal: string | number,
	analysisOffset: number,
};

export type ScenarioTestData = {
	chart: ChartItem,
	analysisData: Array<[AnalysisItem, AnalysisResultData]>,
	strategy?: StrategyItem,
	strategyExecuteData: StrategyExecuteData,
}

export type ScenarioConditionMatch = {
	k?: number,
	valueA?: string,
	valueAReal?: string,
	operator?: string,
	valueB?: string | number,
	valueBReal?: string | number,
	analysisOffset?: number,
}

export class ScenarioItem implements ScenarioData {
	analysis: AnalysisItem[];
	condition: ScenarioConditionData;
	name: string;
	uuid: string;

	constructor (
		data: ScenarioData,
	) {
		this.analysis = data.analysis;
		this.condition = data.condition;
		this.name = data.name;
		this.uuid = data.uuid ?? uuidv4();
	}

	test (
		data: ScenarioTestData,
	): Array<Array<ScenarioConditionMatch>> {
		
		// Increments if all conditions are met, on a dataset
		let scenarioMatch: Array<Array<ScenarioConditionMatch>> = [];

		let conditionMatch: Array<ScenarioConditionMatch> = [];
		let valueA: string;
		let operator: string;
		let valueB: number | string;

		// Counting condition index
		let conditionSetIdx: number = 0;

		// Walk condition sets
		for (
			conditionSetIdx = 0;
			conditionSetIdx < this.condition.length;
			conditionSetIdx++
		) {
			let condition = this.condition[conditionSetIdx];
			let conditionIdx: number = 0;

			// Walk conditions within the set, and validate fields exists 
			// within at least one of the datasets
			for (
				conditionIdx = 0;
				conditionIdx < condition.length;
				conditionIdx++
			) {
				valueA = condition[conditionIdx][0];
				operator = condition[conditionIdx][1];
				valueB = condition[conditionIdx][2];
				
				if (data.chart.dataset?.hasOwnProperty(valueA)) {
					conditionMatch.push({
						valueA: valueA,
					});
				} else if (data.analysisData) {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < data.analysisData.length;
						i++
					) {
						analysis = data.analysisData[i][0];
						dataset = data.analysisData[i][1];
						// Bot.log(dataset);

						if (analysis.config && dataset.result?.hasOwnProperty(valueA)) {

							// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
							if (
								!analysis.config?.startIndex
								&& data.chart.dataset?.open
							) {
								const datasetResultField = dataset.result[valueA as keyof AnalysisExecuteResultData];
								if (datasetResultField) {
									analysis.config.startIndex = (
										data.chart.dataset.open.length
										- datasetResultField.length
									);
								}
							}
						}

						// Check field exists within result dataset
						if (dataset.result?.hasOwnProperty(valueA)) {
							conditionMatch.push({
								valueA: valueA,
							});
						}
						
						// TODO: Throw on missing field in dataset?
					}
				}



				if (data.chart.dataset?.hasOwnProperty(valueB)) {
					conditionMatch.push({
						valueB: valueB,
					});
				} else {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < data.analysisData.length;
						i++
					) {
						analysis = data.analysisData[i][0];
						dataset = data.analysisData[i][1];

						// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						if (dataset?.result?.hasOwnProperty(valueB)) {
							if (
								analysis?.config
								&& !analysis.config.startIndex
								&& data?.chart.dataset?.open
							) {
								const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
								if (datasetResultField) {
									analysis.config.startIndex = (
										data.chart.dataset.open.length
										- datasetResultField.length
									);
								}
							}
						}
					}
				}
			}
		}

		if (conditionMatch.length < this.condition.length)
			throw ('Scenario conditions are not compatible with dataset.');

		let endPoint: number = 0;
		if (data?.chart.dataset?.open?.length)
			endPoint = data?.chart.dataset?.open?.length;

		// Walk through field values, on result dataset
		let startPoint: number = 0;

		// Offset from the front of the dataset
		if (data.strategyExecuteData.maxTime && data.chart.dataset?.open) {
			// Bot.log(`data.strategyExecuteData.maxTime: ${data.strategyExecuteData.maxTime / 1000}`);
			// Bot.log(`data.chart.candleTime: ${data.chart.candleTime}`);
			startPoint = (
				endPoint
				- Math.ceil((data.strategyExecuteData.maxTime / 1000) / data.chart.candleTime)
			);
		}

		// Bot.log(`startPoint: ${startPoint}`);

		let conditionDepth: number = (this.condition.length - 1);

		// Walk the data points, from the required view point
		// (number of conditions, minus 1)
		Bot.log(`Scenario '${this.uuid}' datapoint range: ${startPoint}-${endPoint}`);
		for (
			let j: number = startPoint;
			j < endPoint;
			j++
		) {
			// Skip data point range depths that are lower than the number of conditions
			// (not enough data points for backward looking conditions)
			if (j < conditionDepth)
				continue;

			// Reset, reuse connection index variable.
			conditionSetIdx = 0;

			// Increments if all conditions are met, on a dataset
			let conditionSetMatch: any = [];

			// Step through data points, looking for a full set of condition matches
			for (
				let k: number = (j - conditionDepth);
				k <= j;
				k++
			) {
				let condition = this.condition[conditionSetIdx];
				let conditionIdx: number = 0;

				// Reset, reuse connection match variable
				conditionMatch = [];

				// Walk conditions within the set, and validate fields exists 
				// within at least one of the datasets
				for (
					conditionIdx = 0;
					conditionIdx < condition.length;
					conditionIdx++
				) {
					let analysisOffset;

					valueA = condition[conditionIdx][0];
					operator = condition[conditionIdx][1];
					valueB = condition[conditionIdx][2];
					
					let valueAReal;
					let valueBReal = valueB;
					
					// Walk through datasets
					if (data.analysisData.length) {
						let analysis: AnalysisData;
						let dataset: AnalysisResultData;
						
						for (
							let i: number = 0;
							i < data.analysisData.length;
							i++
						) {
							analysis = data.analysisData[i][0];
							dataset = data.analysisData[i][1];

							let startIndex: number = 0;
							if (analysis?.config?.startIndex) {
								startIndex = analysis.config.startIndex;
							}

							// `valueA` is an analysis result data field
							if (dataset.result?.hasOwnProperty(valueA)) {

								// Skip while the data point range is out-of-scope (not enough data points)
								if (k < startIndex + conditionDepth)
									continue;

								analysisOffset = (k - startIndex);

								const datasetResultField = dataset.result[valueA as keyof AnalysisExecuteResultData];
								if (datasetResultField) {
									valueAReal = Number.parseFloat(
										datasetResultField[analysisOffset] as string
									).toFixed(10);
								}
							}
							
							if (typeof valueB === 'string') {
								
								// `valueB` is an analysis result data field
								if (dataset.result?.hasOwnProperty(valueB)) {
	
									// Skip while the data point range is out-of-scope (not enough data points)
									if (k < startIndex + conditionDepth)
										continue;
	
									analysisOffset = (k - startIndex);
	
									const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
									if (datasetResultField) {
										valueBReal = Number.parseFloat(
											datasetResultField[analysisOffset] as string
										).toFixed(10);
									}
									
								}
							}
						}
					}

					if (typeof valueAReal === 'undefined') {
						if (data.chart.dataset?.hasOwnProperty(valueA)) {
							let datasetResultField = data.chart.dataset[valueA as keyof ChartCandleData];

							if (datasetResultField?.length) {
								valueAReal = Number.parseFloat(
									datasetResultField[k] as string
								).toFixed(10);
							}
							
						} else {
							continue;
						}
					}

					if (
						typeof valueBReal === 'undefined'
						&& typeof valueB === 'string'
					) {
						if(data.chart.dataset?.hasOwnProperty(valueB)) {
							let datasetResultField = data.chart.dataset[valueB as keyof ChartCandleData];

							if (datasetResultField?.length) {
								valueBReal = Number.parseFloat(
									datasetResultField[k] as string
								).toFixed(10);
							}
						} else {
							continue;
						}
					}

					// Bot.log(`valueAReal: ${valueAReal}`);
					// Bot.log(`valueBReal: ${valueBReal}`);

					if (valueAReal) {
						switch (operator) {
							case '<': {
								if (valueAReal < valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}
							case '<=': {
								if (valueAReal <= valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}

							case '>': {
								if (valueAReal > valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}

							case '>=': {
								if (valueAReal >= valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}

							case '==': {
								if (valueAReal == valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}

							case '!=': {
								if (valueAReal != valueBReal) {
									conditionMatch.push({
										k: k,
										valueA: valueA,
										valueAReal: valueAReal,
										operator: operator,
										valueB: valueB,
										valueBReal: valueBReal,
										analysisOffset: analysisOffset,
									});
								}
								break;
							}
						}
					}
				}

				// All conditions within the set, match on this data frame
				if (conditionMatch.length === condition.length) {
					conditionSetMatch.push(conditionMatch);
				}

				conditionSetIdx++;
			}

			// All scenario condition sets, match on this data frame range
			if (conditionSetMatch.length === this.condition.length) {
				scenarioMatch.push(conditionSetMatch);

				// Execute chained strategy, if provided
				if (data.strategy) {
					Bot.log(`Scenario '${this.name}' triggered strategy '${data.strategy.name}'`);
					data.strategy.execute(
						data.strategyExecuteData
					);
				}
			}
		}

		return scenarioMatch;
	}
}

export const Scenario = {
	new (
		data: ScenarioData,
	): ScenarioItem {
		let item = new ScenarioItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
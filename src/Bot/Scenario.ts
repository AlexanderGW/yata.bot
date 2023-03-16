import { AnalysisData, AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from './Analysis';
import { Bot, Log } from './Bot';
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
	): Array<Array<Array<ScenarioConditionMatch>>> {
		
		// Increments if all conditions are met, on a dataset
		let scenarioMatch: Array<Array<Array<ScenarioConditionMatch>>> = [];

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

						// if (analysis.config && dataset.result?.hasOwnProperty(valueA)) {

						// 	// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						// 	if (
						// 		!analysis.config?.startIndex
						// 		&& data.chart.dataset?.open
						// 	) {
						// 		const datasetResultField = dataset.result[valueA as keyof AnalysisExecuteResultData];
						// 		if (datasetResultField) {
						// 			analysis.config.startIndex = (
						// 				data.chart.dataset.open.length
						// 				- datasetResultField.length
						// 			);
						// 		}
						// 	}
						// }

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

						// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						// if (dataset?.result?.hasOwnProperty(valueB)) {
						// 	if (
						// 		analysis?.config
						// 		&& !analysis.config.startIndex
						// 		&& data?.chart.dataset?.open
						// 	) {
						// 		const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
						// 		if (datasetResultField) {
						// 			analysis.config.startIndex = (
						// 				data.chart.dataset.open.length
						// 				- datasetResultField.length
						// 			);
						// 		}
						// 	}

						// 	conditionMatch.push({
						// 		valueA: valueA,
						// 	});
						// }

						// Check field exists within result dataset
						if (dataset?.result?.hasOwnProperty(valueB)) {
							conditionMatch.push({
								valueA: valueA,
							});
						}
					}
				}
			}
		}

		if (conditionMatch.length < this.condition.length)
			throw ('Scenario conditions are not compatible with dataset.');

		let endPoint: number = 0;
		if (data?.chart.dataset?.open?.length)
			endPoint = data.chart.dataset.open.length;

		// Walk through field values, on result dataset
		let startPoint: number = 0;

		// Offset from the front of the dataset
		if (data.strategyExecuteData.windowTime) {
			startPoint = (
				endPoint
				- Math.ceil((data.strategyExecuteData.windowTime) / data.chart.candleTime)
			);
		}

		// Ensure `startPoint` is at least positive
		if (startPoint < 0)
			startPoint = 0;

		let conditionDepth: number = (this.condition.length - 1);

		// Walk the data points, from the required view point
		// (number of conditions, minus 1)
		Bot.log(`Scenario '${this.name}'; Datapoints: ${startPoint}-${endPoint}`, Log.Verbose);
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

				let lastConditionMatchCount: number = 0;

				// Reset, reuse condition match variable
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

							// Establish the analysis result offset from the dataset
							let startIndex: number = dataset.begIndex;
							if (analysis?.config?.startIndex) {
								startIndex = analysis.config.startIndex;
							}

							// `valueA` is an analysis result data field
							if (dataset.result?.hasOwnProperty(valueA)) {
								if (

									// Skip while the data point range is out-of-scope (not enough data points)
									k < (startIndex + conditionDepth)

									// Skip if we've exceeded the analysis result data points
									|| (k - startIndex) > (dataset.nbElement - 1)
									) {
										analysisOffset = -1;
										continue;
								}

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
									if (

										// Skip while the data point range is out-of-scope (not enough data points)
										k < startIndex + conditionDepth
	
										// Skip if we've exceeded the analysis result data points
										|| (k - startIndex) > (dataset.nbElement - 1)
									) {
										analysisOffset = -1;
										continue;
									}

									analysisOffset = (k - startIndex);
									// console.log(`analysisOffset: ${analysisOffset}`);
									
									const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
									if (datasetResultField) {
										// if (valueB === 'outRealLowerBand')
										// 	console.log(`datasetResultField: ${datasetResultField.length}`);

										valueBReal = Number.parseFloat(
											datasetResultField[analysisOffset] as string
										).toFixed(10);
									}
									
								}
							}
						}
					}

					// Offset will be `-1`, if the data set is out of range of the analysis results
					// If a scenario doesn't specify a field found within any analysis results, value is `undefined`
					if (typeof analysisOffset === 'number' && analysisOffset < 0)
						break;

					// console.log(`k: ${k}`);

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

					// If the condition set doesn't increment for each data point, its not a matching scenario
					if (lastConditionMatchCount === conditionMatch.length)
						break;
					
					lastConditionMatchCount = conditionMatch.length;
				}

				// All conditions within the set, match on this data frame
				if (conditionMatch.length === condition.length)
					conditionSetMatch.push(conditionMatch);

				conditionSetIdx++;
			}

			// All scenario condition sets, match on this data frame range
			if (conditionSetMatch.length === this.condition.length) {
				scenarioMatch.push(conditionSetMatch);

				// Execute chained strategy, if provided
				if (data.strategy) {
					Bot.log(`Scenario '${this.name}'; Triggered strategy '${data.strategy.name}'`);

					// Try strategy
					try {
						let signal = data.strategy.execute(
							data.strategyExecuteData
						);

						data.strategyExecuteData.timeframe.result.push(signal);
						data.strategyExecuteData.timeframe.resultIndex.push(data.strategy.uuid);
					} catch (err) {
						Bot.log(err as string, Log.Err);
					}
				}
			}
		}

		// Log leading (last in array) candle of matching scenario
		if (scenarioMatch.length) {
			if (data.chart?.dataset) {
				let timeField: string = '';
				if (data.chart.dataset?.hasOwnProperty('openTime'))
					timeField = 'openTime';
				else if (data.chart.dataset?.hasOwnProperty('closeTime'))
					timeField = 'closeTime';

				for (let x = 0; x < scenarioMatch.length; x++) {
					let len: number = scenarioMatch[x].length - 1;
					let candle = scenarioMatch[x][len][0];
					let idx = candle.k as number;
					
					const milliseconds = data.chart.dataset[timeField][idx] * 1000;
					let date = new Date(milliseconds);
					Bot.log(`Scenario '${this.name}'; MATCH; datapoint: ${candle.k}; ${timeField}: ${date.toISOString()}, ${milliseconds}`);
					// console.log(conditionMatch);
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
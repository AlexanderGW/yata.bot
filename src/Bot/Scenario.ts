import { AnalysisData, AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from './Analysis';
import { Bot, Log } from './Bot';
import { ChartCandleData, ChartItem } from './Chart';
import { StrategyExecuteData, StrategyItem } from './Strategy';
import { v4 as uuidv4 } from 'uuid';

// TODO: Type
export type ScenarioConditionValueA = string;

export const scenarioConditionOperators = [
	'<', '<=', '>', '>=', '==', '!='
] as const;

export type ScenarioConditionOperator = typeof scenarioConditionOperators[number];

// TODO: Type
export type ScenarioConditionValueB = number | string;

export type ScenarioCondition = [
	ScenarioConditionValueA,
	ScenarioConditionOperator,
	ScenarioConditionValueB
]

export type ScenarioConditionSet = ScenarioCondition[]

export type ScenarioConditionCandle = ScenarioConditionSet[];

export type ScenarioData = {
	analysis: AnalysisItem[],
	name: string,
	condition: ScenarioConditionCandle,
	uuid?: string,
}

export type ScenarioSignalData = {
	analysisOffset: number,
	datapoint: number,
	operator: string,
	valueA: string,
	valueAReal: string,
	valueB: string | number,
	valueBReal: string | number,
};

export type ScenarioTestData = {
	chart: ChartItem,
	analysisData: Array<[AnalysisItem, AnalysisResultData]>,
	strategy?: StrategyItem,
	strategyExecuteData: StrategyExecuteData,
}

export type ScenarioConditionMatch = {
	analysisOffset?: number,
	datapoint?: number,
	operator?: string,
	valueA?: string,
	valueAReal?: string,
	valueB?: string | number,
	valueBReal?: string | number,
}

export class ScenarioItem implements ScenarioData {
	analysis: AnalysisItem[];
	condition: ScenarioConditionCandle;
	name: string;
	uuid: string;

	constructor (
		_: ScenarioData,
	) {
		this.analysis = _.analysis;
		this.condition = _.condition;
		this.name = _.name;
		this.uuid = _.uuid ?? uuidv4();
	}

	test (
		_: ScenarioTestData,
	): Array<Array<Array<ScenarioConditionMatch>>> {
		
		// Increments if all conditions are met, on a dataset
		let scenarioMatch: Array<Array<Array<ScenarioConditionMatch>>> = [];

		let conditionMatch: Array<ScenarioConditionMatch> = [];
		let valueA: ScenarioConditionValueA;
		let operator: ScenarioConditionOperator;
		let valueB: ScenarioConditionValueB;

		// Counting condition index
		let conditionSetIdx: number = 0;

		// Walk condition sets
		for (
			conditionSetIdx = 0;
			conditionSetIdx < this.condition.length;
			conditionSetIdx++
		) {
			let condition: ScenarioConditionSet = this.condition[conditionSetIdx];
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
				
				if (_.chart.dataset?.hasOwnProperty(valueA)) {
					conditionMatch.push({
						valueA: valueA,
					});
				} else if (_.analysisData) {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < _.analysisData.length;
						i++
					) {
						analysis = _.analysisData[i][0];
						dataset = _.analysisData[i][1];
						// Bot.log(dataset);

						// if (analysis.config && dataset.result?.hasOwnProperty(valueA)) {

						// 	// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						// 	if (
						// 		!analysis.config?.startIndex
						// 		&& _.chart.dataset?.open
						// 	) {
						// 		const datasetResultField = dataset.result[valueA as keyof AnalysisExecuteResultData];
						// 		if (datasetResultField) {
						// 			analysis.config.startIndex = (
						// 				_.chart.dataset.open.length
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



				if (_.chart.dataset?.hasOwnProperty(valueB)) {
					conditionMatch.push({
						valueB: valueB,
					});
				} else if (_.analysisData) {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < _.analysisData.length;
						i++
					) {
						analysis = _.analysisData[i][0];
						dataset = _.analysisData[i][1];

						// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						// if (dataset?.result?.hasOwnProperty(valueB)) {
						// 	if (
						// 		analysis?.config
						// 		&& !analysis.config.startIndex
						// 		&& _?.chart.dataset?.open
						// 	) {
						// 		const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
						// 		if (datasetResultField) {
						// 			analysis.config.startIndex = (
						// 				_.chart.dataset.open.length
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
			throw new Error('Scenario conditions are not compatible with dataset.');

		let endPoint: number = 0;
		if (_?.chart.dataset?.open?.length)
			endPoint = _.chart.dataset.open.length;

		// Walk through field values, on result dataset
		let startPoint: number = 0;

		// Offset from the end (moving backwards) of the dataset
		if (_.strategyExecuteData.timeframe.windowTime) {
			startPoint = (
				endPoint
				- Math.ceil((_.strategyExecuteData.timeframe.windowTime) / _.chart.candleTime)
			);
		}

		// Ensure `startPoint` is at least positive
		if (startPoint < 0)
			startPoint = 0;

		let conditionDepth: number = (this.condition.length - 1);

		// Walk the data points, from the required view point
		// (number of conditions, minus 1)
		Bot.log(
			`Scenario '${this.name}'; Datapoints '${startPoint}-${endPoint}'`,
			Log.Verbose
		);
		
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
					let analysisOffset = 0;

					valueA = condition[conditionIdx][0];
					operator = condition[conditionIdx][1];
					valueB = condition[conditionIdx][2];
					
					let valueAReal;
					let valueBReal = valueB;
					
					// Walk through datasets
					if (_.analysisData.length) {
						let analysis: AnalysisData;
						let dataset: AnalysisResultData;
						
						for (
							let i: number = 0;
							i < _.analysisData.length;
							i++
						) {
							analysis = _.analysisData[i][0];
							dataset = _.analysisData[i][1];

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
						if (_.chart.dataset?.hasOwnProperty(valueA)) {
							let datasetResultField = _.chart.dataset[valueA as keyof ChartCandleData];

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
						if(_.chart.dataset?.hasOwnProperty(valueB)) {
							let datasetResultField = _.chart.dataset[valueB as keyof ChartCandleData];

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
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
								break;
							}
							case '<=': {
								if (valueAReal <= valueBReal) {
									conditionMatch.push({
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
								break;
							}

							case '>': {
								if (valueAReal > valueBReal) {
									conditionMatch.push({
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
								break;
							}

							case '>=': {
								if (valueAReal >= valueBReal) {
									conditionMatch.push({
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
								break;
							}

							case '==': {
								if (valueAReal == valueBReal) {
									conditionMatch.push({
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
									});
								}
								break;
							}

							case '!=': {
								if (valueAReal != valueBReal) {
									conditionMatch.push({
										analysisOffset: analysisOffset,
										datapoint: k,
										operator: operator,
										valueA: valueA,
										valueAReal: valueAReal,
										valueB: valueB,
										valueBReal: valueBReal,
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
				if (_.strategy) {
					Bot.log(`Scenario '${this.name}'; Triggered strategy '${_.strategy.name}'`);

					// Try strategy
					try {
						let signal = _.strategy.execute(
							_.strategyExecuteData
						);

						_.strategyExecuteData.timeframe.result.push(signal);
						_.strategyExecuteData.timeframe.resultIndex.push(_.strategy.uuid);
					} catch (error) {
						Bot.log(error, Log.Err);
					}
				}
			}
		}

		// Log leading (last in array) candle of matching scenario
		if (scenarioMatch.length) {
			if (_.chart?.dataset) {
				let timeField: string = '';
				if (_.chart.dataset?.hasOwnProperty('openTime'))
					timeField = 'openTime';
				else if (_.chart.dataset?.hasOwnProperty('closeTime'))
					timeField = 'closeTime';

				for (let x = 0; x < scenarioMatch.length; x++) {
					let len: number = scenarioMatch[x].length - 1;
					let candle = scenarioMatch[x][len][0];
					let idx = candle.datapoint as number;
					
					const milliseconds = _.chart.dataset[timeField][idx] * 1000;
					let date = new Date(milliseconds);
					Bot.log(`Scenario '${this.name}'; Match '${date.toISOString()}'; Datapoint '${candle.datapoint}'`);
					// console.log(conditionMatch);
				}
			}
			
		}

		return scenarioMatch;
	}
}

export const Scenario = {
	new (
		_: ScenarioData,
	): ScenarioItem {
		let item = new ScenarioItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
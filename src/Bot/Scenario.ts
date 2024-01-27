import { AnalysisData, AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from './Analysis';
import { Bot, Log } from './Bot';
import { ChartCandleData, ChartItem } from './Chart';
import { StrategyExecuteData, StrategyItem } from './Strategy';
import { v4 as uuidv4 } from 'uuid';

// TODO: Type
export type ScenarioConditionValueA = string;
export type ScenarioConditionValueClass = string | undefined;
export type ScenarioConditionValueName = string | undefined;

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
	windowTime?: number,
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
	windowTime?: number;

	constructor (
		_: ScenarioData,
	) {
		this.analysis = _.analysis;
		this.condition = _.condition;
		this.name = _.name;
		this.uuid = _.uuid ?? uuidv4();
		if (_.windowTime)
			this.windowTime = _.windowTime;
	}

	test (
		_: ScenarioTestData,
	): Array<Array<Array<ScenarioConditionMatch>>> {
		
		// Increments if all conditions are met, on a dataset
		let scenarioMatch: Array<Array<Array<ScenarioConditionMatch>>> = [];

		let conditionMatch: Array<ScenarioConditionMatch> = [];
		// TODO: Prefix all value fields with `chart.` or `[analysis.name].` - fixes scenario.test caveat - support values with no `.`
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

				let valueAClass: ScenarioConditionValueClass;
				let valueAName: ScenarioConditionValueName;
				const valueAPos = valueA.lastIndexOf('.');
				if (valueAPos > 0) {
					valueAClass = valueA.substring(0, valueAPos);
					valueAName = valueA.substring(valueAPos + 1);
				}
				// Bot.log(`valueAClass: ${valueAClass}`, Log.Warn);
				// Bot.log(`valueAName: ${valueAName}`, Log.Warn);
				
				// Check Value A in chart
				if (
					(
						!valueAClass?.length
						&& _.chart.dataset?.hasOwnProperty(valueA)
					)
					|| (
						valueAClass === 'chart'
						&& valueAName
						&& _.chart.dataset?.hasOwnProperty(valueAName)
					)
				) {
					conditionMatch.push({
						valueA: valueA,
					});
				}

				// Check Value A in analysis
				if (
					(!valueAClass?.length || valueAClass !== 'chart')
					&& _.analysisData
				) {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < _.analysisData.length;
						i++
					) {
						analysis = _.analysisData[i][0];
						// Bot.log(`${analysis.name} === ${valueAClass}`);
						if (valueAClass && valueAClass !== analysis.name) continue;

						dataset = _.analysisData[i][1];
						// Bot.log(dataset);

						// Check field exists within result dataset
						// if (dataset.result?.hasOwnProperty(valueA)) {
						if (
							(
								!valueAClass?.length
								&& dataset.result?.hasOwnProperty(valueA)
							)
							|| (
								valueAName
								&& dataset.result?.hasOwnProperty(valueAName)
							)
						) {
							conditionMatch.push({
								valueA: valueA,
							});
						}
						
						// TODO: Throw on missing field in dataset?
					}
				}

				let valueBClass: ScenarioConditionValueClass;
				let valueBName: ScenarioConditionValueName;
				if (typeof valueB === 'string') {
					const valueBPos = valueB.lastIndexOf('.');
					valueBClass = valueB.substring(0, valueBPos);
					valueBName = valueB.substring(valueBPos + 1);
				}
				// Bot.log(`valueBClass: ${valueBClass}`, Log.Warn);
				// Bot.log(`valueBName: ${valueBName}`, Log.Warn);

				if (
					(
						!valueBClass?.length
						&& _.chart.dataset?.hasOwnProperty(valueB)
					)
					|| (
						valueBClass === 'chart'
						&& valueBName
						&& _.chart.dataset?.hasOwnProperty(valueBName)
					)
				) {
					conditionMatch.push({
						valueB: valueB,
					});
				}
				
				if (
					(!valueBClass?.length || valueBClass !== 'chart')
					&& _.analysisData
				) {

					// Walk through datasets
					let analysis: AnalysisData;
					let dataset: AnalysisResultData;
					for (
						let i: number = 0;
						i < _.analysisData.length;
						i++
					) {
						analysis = _.analysisData[i][0];
						// Bot.log(`${analysis.name} === ${valueBClass}`);
						if (valueBClass && valueBClass !== analysis.name) continue;

						dataset = _.analysisData[i][1];

						// Check field exists within result dataset
						// if (dataset?.result?.hasOwnProperty(valueB)) {
						if (
							(
								!valueBClass?.length
								&& dataset.result?.hasOwnProperty(valueB)
							)
							|| (
								valueBName
								&& dataset.result?.hasOwnProperty(valueBName)
							)
						) {
							conditionMatch.push({
								valueB: valueB, // TODO: Was `valueA` - fairly sure that was an error?
							});
						}
					}
				}
			}
		}

		// Bot.log(`conditionMatch`);
		// Bot.log(conditionMatch);

		if (conditionMatch.length < this.condition.length)
			throw new Error('Scenario conditions are not compatible with dataset.');

		// Walk through field values, on result dataset
		let offset: number = 0;
		let startPoint: number = 0;
		let endPoint: number = 0;
		if (_?.chart.dataset?.open?.length)
			endPoint = _.chart.dataset.open.length;

		// Bot is in `backtest`, use the the whole `windowTime`
		if (Bot.backtest)
			offset = Math.ceil((_.strategyExecuteData.timeframe.windowTime) / _.chart.candleTime);

		// Custom window time within which this scenario can be triggered
		else if (this.windowTime)
			offset = Math.ceil(this.windowTime / _.chart.candleTime);

		// If too low, default to the number of scenario condition candle sets (leading edge of dataset)
		if (offset < this.condition.length)
			offset = this.condition.length

		// Offset from the end (moving backwards) of the dataset
		startPoint = endPoint - offset;
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

					// TODO: CLass/Name scoping support for scenario conditons
					let valueAClass: ScenarioConditionValueClass;
					let valueAName: ScenarioConditionValueName;
					const valueAPos = valueA.lastIndexOf('.');
					if (valueAPos > 0) {
						valueAClass = valueA.substring(0, valueAPos);
						valueAName = valueA.substring(valueAPos + 1);
					}
					// Bot.log(`valueAClass: ${valueAClass}`, Log.Warn);
					// Bot.log(`valueAName: ${valueAName}`, Log.Warn);
					
					let valueAReal;
					let valueBReal = valueB;

					let valueBClass: ScenarioConditionValueClass;
					let valueBName: ScenarioConditionValueName;
					if (typeof valueB === 'string') {
						const valueBPos = valueB.lastIndexOf('.');
						valueBClass = valueB.substring(0, valueBPos);
						valueBName = valueB.substring(valueBPos + 1);
					}
					// Bot.log(`valueBClass: ${valueBClass}`, Log.Warn);
					// Bot.log(`valueBName: ${valueBName}`, Log.Warn);
					
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
							if (
								// dataset.result?.hasOwnProperty(valueA)
								(
									!valueAClass?.length
									&& dataset.result?.hasOwnProperty(valueA)
								)
								|| (
									valueAName
									&& dataset.result?.hasOwnProperty(valueAName)
								)
							) {
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

								let datasetResultField: string[] | number[] | undefined;
								if (valueAClass) {
									if (valueAClass === 'chart') continue;
									datasetResultField = dataset.result[valueAName as keyof AnalysisExecuteResultData];
								} else
									datasetResultField = dataset.result[valueA as keyof AnalysisExecuteResultData];

								if (datasetResultField) {
									valueAReal = Number.parseFloat(
										datasetResultField[analysisOffset] as string
									).toFixed(10);
								}
							}
							
							if (typeof valueB === 'string') {
								
								// `valueB` is an analysis result data field
								if (
									// dataset.result?.hasOwnProperty(valueB)
									(
										!valueBClass?.length
										&& dataset.result?.hasOwnProperty(valueB)
									)
									|| (
										valueBName
										&& dataset.result?.hasOwnProperty(valueBName)
									)
								) {
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
									
									// const datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];
									// if (datasetResultField) {
									// 	valueBReal = Number.parseFloat(
									// 		datasetResultField[analysisOffset] as string
									// 	).toFixed(10);
									// }
									
									let datasetResultField: string[] | number[] | undefined;
									if (valueBClass) {
										if (valueBClass === 'chart') continue;
										datasetResultField = dataset.result[valueBName as keyof AnalysisExecuteResultData];
									} else
										datasetResultField = dataset.result[valueB as keyof AnalysisExecuteResultData];

									if (datasetResultField) {
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
						// if (_.chart.dataset?.hasOwnProperty(valueA)) {
						// 	let datasetResultField = _.chart.dataset[valueA as keyof ChartCandleData];

						// 	if (datasetResultField?.length) {
						// 		valueAReal = Number.parseFloat(
						// 			datasetResultField[k] as string
						// 		).toFixed(10);
						// 	}
							
						// } else {
						// 	continue;
						// }
						if (!_.chart.dataset?.hasOwnProperty(valueA)) continue;

						let datasetResultField: string[] | number[] | undefined;
						if (valueAClass) {
							if (valueAClass === 'chart') continue;
							datasetResultField = _.chart.dataset[valueAName as keyof ChartCandleData];
						} else
							datasetResultField = _.chart.dataset[valueA as keyof ChartCandleData];

						if (datasetResultField?.length) {
							valueAReal = Number.parseFloat(
								datasetResultField[k] as string
							).toFixed(10);
						}
					}

					// if (
					// 	typeof valueBReal === 'undefined'
					// 	&& typeof valueB === 'string'
					// ) {
					// 	if(_.chart.dataset?.hasOwnProperty(valueB)) {
					// 		let datasetResultField = _.chart.dataset[valueB as keyof ChartCandleData];

					// 		if (datasetResultField?.length) {
					// 			valueBReal = Number.parseFloat(
					// 				datasetResultField[k] as string
					// 			).toFixed(10);
					// 		}
					// 	} else {
					// 		continue;
					// 	}
					// }
					if (
						typeof valueBReal === 'undefined'
						&& typeof valueB === 'string'
					) {
						if(!_.chart.dataset?.hasOwnProperty(valueB)) continue;
						
						let datasetResultField: string[] | number[] | undefined;
						if (valueBClass) {
							if (valueBClass === 'chart') continue;
							datasetResultField = _.chart.dataset[valueBName as keyof ChartCandleData];
						} else
							datasetResultField = _.chart.dataset[valueB as keyof ChartCandleData];

						if (datasetResultField?.length) {
							valueBReal = Number.parseFloat(
								datasetResultField[k] as string
							).toFixed(10);
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
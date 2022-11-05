import { uuid } from 'uuidv4';
import { AnalysisItem } from './Analysis';
import { Bot } from './Bot';
import { ChartItem } from './Chart';
import { StrategyExecuteData, StrategyItem } from './Strategy';

export type ScenarioData = {
	analysis: AnalysisItem[],
	name: string,
	condition: Array<Array<[string, string, number | string]>>,
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
	analysisData: Array<[AnalysisItem, object]>,
	strategy?: StrategyItem,
	strategyExecuteData: StrategyExecuteData,
}

export class ScenarioItem implements ScenarioData {
	analysis: AnalysisItem[];
	condition: any;
	name: string;
	uuid: string; 

	constructor (
		data: ScenarioData,
	) {
		this.analysis = data.analysis;
		this.condition = data.condition;
		this.name = data.name;
		this.uuid = data.uuid ?? uuid();
	}

	test (
		data: ScenarioTestData,
	) {
		// Increments if all conditions are met, on a dataset
		let scenarioMatch: number[] = [];

		let conditionMatch: any = [];
		let valueA: string;
		let operator: string;
		let valueB: string;

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
				
				if (data.chart[valueA]) {
					conditionMatch.push({
						valueA: valueA,
					});
				} else {

					// Walk through datasets
					let analysis: object;
					let dataset: object;
					for (
						let i: number = 0;
						i < data.analysisData.length;
						i++
					) {
						analysis = data.analysisData[i][0];
						dataset = data.analysisData[i][1];
						// console.log(dataset);

						if (dataset.result[valueA]) {

							// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
							if (!data.analysisData[i][0].config.startIndex) {
								data.analysisData[i][0].config.startIndex = (
									data.chart.open.length
									- dataset.result[valueA].length
								);
							}
						}

						// Check field exists within result dataset
						if (dataset.result[valueA]) {
							conditionMatch.push({
								valueA: valueA,
							});
						}
						
						// TODO: Throw on missing field in dataset?
					}
				}



				if (data.chart[valueB]) {
					conditionMatch.push({
						valueB: valueB,
					});
				} else {

					// Walk through datasets
					let analysis: object;
					let dataset: object;
					for (
						let i: number = 0;
						i < data.analysisData.length;
						i++
					) {
						analysis = data.analysisData[i][0];
						dataset = data.analysisData[i][1];

						// If undefined, set the `startIndex` to the chart dataset, minus the length of the analysis dataset.
						if (dataset.result[valueB]) {
							if (!data.analysisData[i][0].config.startIndex) {
								data.analysisData[i][0].config.startIndex = (
									data.chart.open.length
									- dataset.result[valueB].length
								);
							}
						}
					}
				}
			}
		}

		if (conditionMatch.length < this.condition.length)
			throw ('Scenario conditions are not compatible with dataset.');

		// Walk through field values, on result dataset
		let startPoint: number = 0;

		// Offset from the front of the dataset
		if (data.strategyExecuteData.maxTime) {
			// console.log(`data.strategyExecuteData.maxTime: ${data.strategyExecuteData.maxTime / 1000}`);
			// console.log(`data.chart.candleTime: ${data.chart.candleTime}`);
			startPoint = (
				data.chart.open.length
				- Math.ceil((data.strategyExecuteData.maxTime / 1000) / data.chart.candleTime)
			);
		}

		console.log(`startPoint: ${startPoint}`);

		// TODO: Testing latest data points only
		// startPoint = dataset.result[valueA].length - this.condition.length;

		let conditionDepth: number = (this.condition.length - 1);

		// Walk the data points, from the required view point
		// (number of conditions, minus 1)
		console.log(`Ranging: ${startPoint}-${data.chart.open.length}`);
		for (
			let j: number = startPoint;
			j < data.chart.open.length;
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
						for (
							let i: number = 0;
							i < data.analysisData.length;
							i++
						) {

							// `valueA` is an analysis result data field
							if (data.analysisData[i][1].result[valueA]) {
	
								// Skip while the data point range is out-of-scope (not enough data points)
								if (k < data.analysisData[i][0].config.startIndex + conditionDepth)
									continue;
	
								analysisOffset = (k - data.analysisData[i][0].config.startIndex);
	
								valueAReal = Number.parseFloat(
									data.analysisData[i][1].result[valueA][analysisOffset]
								).toFixed(10);
							}
							
							if (typeof valueB === 'string') {
								
								// `valueB` is an analysis result data field
								if (data.analysisData[i][1].result[valueB]) {
	
									// Skip while the data point range is out-of-scope (not enough data points)
									if (k < data.analysisData[i][0].config.startIndex + conditionDepth)
										continue;
	
									analysisOffset = (k - data.analysisData[i][0].config.startIndex);
	
									valueBReal = Number.parseFloat(
										data.analysisData[i][1].result[valueB][analysisOffset]
									).toFixed(10);
								}
							}
						}
					}

					if (typeof valueAReal === 'undefined') {
						if (data.chart[valueA]) {
							valueAReal = Number.parseFloat(
								data.chart[valueA][k]
							).toFixed(10);
						} else {
							continue;
						}
					}

					if (
						typeof valueBReal === 'undefined'
						&& typeof valueB === 'string'
					) {
						if(data.chart[valueB]) {
							valueBReal = Number.parseFloat(
								data.chart[valueB][k]
							).toFixed(10);
						} else {
							continue;
						}
					}

					// console.log(`valueAReal: ${valueAReal}`);
					// console.log(`valueBReal: ${valueBReal}`);

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
					console.log(`Scenario '${this.name}' triggered strategy '${data.strategy.name}'`);
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
	) {
		let item = new ScenarioItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
import { uuid } from 'uuidv4';
import { Analysis, AnalysisResultData } from './Analysis';
import { Chart } from './Chart';
import { Strategy } from './Strategy';

export type ScenarioData = {
	analysis: Analysis[],
	name: string,
	condition: Array<Array<[string, string, number | string]>>,
}

export type ScenarioTestData = {
	chart: Chart,
	analysisData: Array<[Analysis, object]>,
	resultMaxLength: number,
	strategy?: Strategy,
}

export class Scenario implements ScenarioData {
	analysis: Analysis[];
	condition: any;
	name: string;
	uuid: string; 

	constructor (
		data: ScenarioData,
	) {
		this.analysis = data.analysis;
		this.condition = data.condition;
		this.name = data.name;
		this.uuid = uuid();
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
							if (!data.analysisData[i][0].config.startIndex) {
								data.analysisData[i][0].config.startIndex = (data.chart.open.length - dataset.result[valueA].length);
							}

							// console.log(`autostartIndex: ${data.analysisData[i][0].config.startIndex}`);
							// console.log(`datasetLength[${valueA}]: ${dataset.result[valueA].length}`);
						}

						// Check field exists within result dataset
						// LOOP THRU DATASETS TO FIND THE FIELD
						if (dataset.result[valueA]) {
							// console.log(dataset.result[valueA]);
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
						// console.log(dataset);

						if (dataset.result[valueB]) {
							if (!data.analysisData[i][0].config.startIndex) {
								data.analysisData[i][0].config.startIndex = (data.chart.open.length - dataset.result[valueB].length);
							}

							// console.log(`autostartIndex: ${data.analysisData[i][0].config.startIndex}`);
							// console.log(`datasetLength[${valueB}]: ${dataset.result[valueB].length}`);
						}
					}
				}
			}
		}

		if (conditionMatch.length < this.condition.length)
			throw ('Scenario conditions are not compatible with dataset.');

		// Walk through field values, on result dataset
		let startPoint: number;

		// TODO: Back testing all data points, start from beginning
		// Move forward to the last starting analysis result set
		// startPoint = data.chart.open.length - data.resultMaxLength;
		startPoint = 0;

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
			// continue;
			// console.log('test range: ' + (j - conditionDepth) + '-' + j);

			// Skip data point range depths that are lower than the number of conditions
			// (not enough data points for backward looking conditions)
			if (j < conditionDepth)
				continue;

			// console.log('range: ' + (j - conditionDepth) + '-' + j);

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
				// console.log('---------------------');

				// console.log(`conditionSetIdx: ${conditionSetIdx}`);
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

					// console.log(`conditionIdx: ${conditionIdx}`);
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
	
								// console.log(data.analysisData[i][1].result[valueA][k]);
								// if (analysisOffset < 10)
								// 	console.log(`analysisOffset: ${analysisOffset}`);
	
								valueAReal = Number.parseFloat(
									data.analysisData[i][1].result[valueA][analysisOffset]
								).toFixed(10);
							}
							
							if (typeof valueB === 'string') {
								// console.log(data.analysisData[i][1].result);
	
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

					// if (typeof analysisOffset === 'undefined') {
					// 	continue;
					// }

					if (
						typeof valueBReal === 'undefined'
						&& typeof valueB === 'string'
					) {
						if(data.chart[valueB]) {
							valueBReal = Number.parseFloat(
								data.chart[valueB][k]
							).toFixed(10);
						} else {
							// console.log(`Not found Analysis(${i}) valueBReal: ${valueB}`);
							continue;
						}
					}

					// console.log(`valueAReal: ${valueAReal}`);
					// console.log(`valueBReal: ${valueBReal}`);

					// if (valueBReal === 'NaN') continue;

					if (valueAReal) {
						switch (operator) {
							case '<': {
								if (valueAReal < valueBReal) {
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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
									// console.log('conditionMatch');
									// console.log(`k: ${k}`);
									// console.log(`valueA: ${valueA}`);
									// console.log(`valueAReal: ${valueAReal}`);
									// console.log(`operator: ${operator}`);
									// console.log(`valueB: ${valueB}`);
									// console.log(`valueBReal: ${valueBReal}`);
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

				// All conditions match on this dataset
				// console.log(condition.length);
				if (conditionMatch.length === condition.length) {
					// console.log(`${j}`);
					conditionSetMatch.push(conditionMatch);
				}

				conditionSetIdx++;
			}

			// console.log('-------END SET-------');

			// All conditions match on this dataset
			if (conditionSetMatch.length === this.condition.length) {
				// console.log('conditionSetMatch');
				// console.log(`${j-1}-${j}`);
				// console.log(Number.parseFloat(
				// 	data.analysisData[0][1].result['outMACDHist'][(j-1)]
				// ).toFixed(10));
				// console.log(Number.parseFloat(
				// 	data.analysisData[0][1].result['outMACDHist'][j]
				// ).toFixed(10));

				// let k = j + startPoint;
				// k = j;

				scenarioMatch.push(conditionSetMatch);
				







				// console.log(`valueA: ${valueA}`);
				// console.log(`valueAReal: ${valueAReal}`);
				// console.log(`operator: ${operator}`);
				// console.log(`valueB: ${valueB}`);
				// console.log(`valueBReal: ${valueBReal}`);
				
				// let date = new Date(parseInt(data.chart.openTime[k]) * 1000);
				// console.log(`dpDate: ${date.toISOString()}`);
				// console.log(`close: ${data.chart.close[k]}`);

				// console.log(data.analysisData[0][1].result['outReal'][(j-1)]);
				// console.log(data.analysisData[0][1].result['outReal'][j]);

				// Execute chained strategy, if provided
				if (data.strategy) {
					console.log(`Scenario '${this.name}' triggered strategy '${data.strategy.name}'`);
					data.strategy.execute();
				}
			}
		}

		return scenarioMatch;
	}
}
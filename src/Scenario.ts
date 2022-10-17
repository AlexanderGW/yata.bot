import { uuid } from 'uuidv4';
import { Analysis, AnalysisResultData } from './Analysis';
import { Strategy } from './Strategy';

export type ScenarioData = {
	analysis: Analysis[],
	name: string,
	condition: Array<Array<[string, string, string]>>,
}

export type ScenarioTestData = {
	analysisData: Array<[Analysis, object]>,
	datasetMaxLength: number,
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

		let conditionMatch: number = 0;
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

					// Check field exists within result dataset
					// LOOP THRU DATASETS TO FIND THE FIELD
					if (dataset.result[valueA]) {
						// console.log(dataset.result[valueA]);
						conditionMatch++;
					}
					
					// TODO: Throw on missing field in dataset?
				}
			}
		}

		if (conditionMatch < this.condition.length)
			throw ('Scenario conditions are not compatible with dataset.');

		// Walk through field values, on result dataset
		let startPoint: number;

		// TODO: Back testing all data points, start from beginning
		// Move forward to the last starting analysis result set
		startPoint = data.datasetMaxLength - data.resultMaxLength;

		console.log(`startPoint: ${startPoint}`);

		// TODO: Testing latest data points only
		// startPoint = dataset.result[valueA].length - this.condition.length;

		let conditionDepth: number = (this.condition.length - 1);

		// Walk the data points, from the required view point
		// (number of conditions, minus 1)
		console.log(`Ranging: ${startPoint}-${data.datasetMaxLength}`);
		for (
			let j: number = startPoint;
			j < data.datasetMaxLength;
			j++
		) {
			// console.log('test range: ' + (j - conditionDepth) + '-' + j);

			// Skip data point range depths that are lower than the number of conditions
			// (not enough data points for backward looking conditions)
			if (j < conditionDepth)
				continue;

			// console.log('range: ' + (j - conditionDepth) + '-' + j);

			// Reset, reuse connection index variable.
			conditionSetIdx = 0;

			// Increments if all conditions are met, on a dataset
			let conditionSetMatch: number = 0;

			// Step through data points, looking for a full set of condition matches
			let datapoint;
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
				conditionMatch = 0;

				// Walk conditions within the set, and validate fields exists 
				// within at least one of the datasets
				for (
					conditionIdx = 0;
					conditionIdx < condition.length;
					conditionIdx++
				) {
					// console.log(`conditionIdx: ${conditionIdx}`);
					valueA = condition[conditionIdx][0];
					operator = condition[conditionIdx][1];
					valueB = condition[conditionIdx][2];
					
					// Walk through datasets
					let dataset: object;
					for (
						let i: number = 0;
						i < data.analysisData.length;
						i++
					) {
						dataset = data.analysisData[i][1];
						if (dataset.result[valueA]) {
							// console.log(dataset.result[valueA][k]);
							datapoint = Number.parseFloat(
								dataset.result[valueA][k]
							).toFixed(10);

							switch (operator) {
								case '<': {
									if (datapoint < valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}
								case '<=': {
									if (datapoint <= valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}

								case '>': {
									if (datapoint > valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}

								case '>=': {
									if (datapoint >= valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}

								case '==': {
									if (datapoint == valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}

								case '!=': {
									if (datapoint != valueB) {
										// console.log('conditionMatch');
										// console.log(`k: ${k}`);
										// console.log(`valueA: ${valueA}`);
										// console.log(`datapoint: ${datapoint}`);
										// console.log(`operator: ${operator}`);
										// console.log(`valueB: ${valueB}`);
										conditionMatch++;
									}
									break;
								}
							}
						}
					}
				}

				// All conditions match on this dataset
				// console.log(condition.length);
				if (conditionMatch === condition.length) {
					// console.log(`${j}`);
					conditionSetMatch++;
				}

				conditionSetIdx++;
			}

			// console.log('-------END SET-------');

			// All conditions match on this dataset
			if (conditionSetMatch === this.condition.length) {
				// console.log('conditionSetMatch');
				// console.log(`${j-1}-${j}`);
				// console.log(Number.parseFloat(
				// 	data.analysisData[0][1].result['outMACDHist'][(j-1)]
				// ).toFixed(10));
				// console.log(Number.parseFloat(
				// 	data.analysisData[0][1].result['outMACDHist'][j]
				// ).toFixed(10));

				scenarioMatch.push(j);
				// console.log(`j: ${j}`);

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
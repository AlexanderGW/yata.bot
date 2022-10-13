import { uuid } from 'uuidv4';
import { Analysis, AnalysisResultData } from './Analysis';

export type ScenarioData = {
	analysis: Analysis[],
	name: string,
	condition: Array<[string, string, string]>,
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
		data: Array<object>
	) {
		// Increments if all conditions are met, on a dataset
		let datasetConditionMatch: number = 0;

		// Walk through data sets
		let dataset: object;
		for (
			let i: number = 0;
			i < data.length;
			i++
		) {
			dataset = data[i];

			// console.log(dataset);
			// console.log(this.condition);

			let conditionMatch: number = 0;
			let valueA: string;
			let operator: string;
			let valueB: string;

			// Counting condition index
			let conditionIdx: number = 0;

			// Walk conditions and validate fields against dataset
			for (conditionIdx = 0; conditionIdx < this.condition.length; conditionIdx++) {
				valueA = this.condition[conditionIdx][0];
				operator = this.condition[conditionIdx][1];
				valueB = this.condition[conditionIdx][2];

				// Check field exists within result dataset
				if (dataset.result[valueA])
					conditionMatch++;
				
				// TODO: Throw on missing field in dataset?
			}

			if (conditionMatch < this.condition.length)
				throw ('Scenario conditions are not compatible with dataset.');

			// console.log(dataset.result[valueA]);

			// Walk through field values, on result dataset
			let startPoint;

			// TODO: Back testing all data points, start from beginning
			startPoint = 0;

			// TODO: Testing latest data points only
			// startPoint = dataset.result[valueA].length - this.condition.length;

			let conditionDepth: number = (this.condition.length - 1);

			// Walk the data points, from the required view point
			// (number of conditions, minus 1)
			for (
				let j: number = startPoint;
				j < dataset.result[valueA].length; // TODO: Better way to count total data points?
				j++
			) {
				// Skip data point range depths that are lower than the number of conditions
				// (not enough data points for backward looking conditions)
				if (j < conditionDepth)
					continue;

				// 
				console.log((j - conditionDepth) + '-' + j);

				// Reset, reuse connection match variable
				conditionMatch = 0;

				// Reset, reuse connection index variable.
				conditionIdx = 0;

				// Step through data points, looking for a full set of condition matches
				let datapoint;
				for (
					let k: number = (j - conditionDepth);
					k <= j;
					k++
				) {
					valueA = this.condition[conditionIdx][0];
					operator = this.condition[conditionIdx][1];
					valueB = this.condition[conditionIdx][2];

					datapoint = dataset.result[valueA][k];

					switch (operator) {
						case '<': {
							if (datapoint < valueB)
								conditionMatch++;
							break;
						}

						case '<=': {
							if (datapoint <= valueB)
								conditionMatch++;
							break;
						}

						case '>=': {
							if (datapoint >= valueB)
								conditionMatch++;
							break;
						}

						case '>': {
							if (datapoint > valueB)
								conditionMatch++;
							break;
						}

						case '==': {
							if (datapoint == valueB)
								conditionMatch++;
							break;
						}

						case '!=': {
							if (datapoint != valueB)
								conditionMatch++;
							break;
						}
					}

					// Increment condition index
					conditionIdx++;
				}

				// All conditions match on this dataset
				if (conditionMatch === this.condition.length) {
					console.log(conditionMatch === this.condition.length);

					for (
						let l: number = (j - conditionDepth);
						l <= j;
						l++
					) {
						console.log(dataset.result[valueA][l]);
					}

					datasetConditionMatch++;
				}
			}
		}

		return datasetConditionMatch;
	}
}
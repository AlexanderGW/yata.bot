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
		result: Array<object>
	) {
		let set: object;
		for (let i: number = 0; i < result.length; i++) {
			set = result[i];

			console.log(set);
			console.log(this.condition);
		}
	}
}
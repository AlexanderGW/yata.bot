import { uuid } from 'uuidv4';

const talib = require('talib');

export type AnalysisConfigData = {
	startIndex?: number,
	inReal?: string[],
	inRealAnalysis?: Analysis,
	inRealField?: string,
	optInTimePeriod?: number,
	optInNbDevUp?: number,
	optInNbDevDn?: number,
	optInMAType?: number,
}

export type AnalysisData = {
	config?: AnalysisConfigData,
	name: string,
	type: string,
	uuid?: string,
}

export type AnalysisResultData = {
	result: object,
}

export class Analysis implements AnalysisData {
	config?: AnalysisConfigData;
	explain: object;
	name: string;
	type: string;
	uuid: string;

	constructor (
		data: AnalysisData,
	) {
		this.name = data.name;
		this.type = data.type;

		let config: any = {
			startIndex: 0,
		};

		this.explain = talib.explain(this.type);
		if (this.explain?.inputs) {
			let i: number = 0;
			for (i = 0; i < this.explain.inputs.length; i++) {
				config[this.explain.inputs[i].name] = '';
			}
			
			for (i = 0; i < this.explain.optInputs.length; i++) {
				config[this.explain.optInputs[i].name] = this.explain.optInputs[i].defaultValue;
			}

			config = {
				...config,
				...data?.config
			};
		}

		// console.log(this.explain);
		// console.log(`type: ${data.type}`);
		// console.log(`name: ${data.name}`);
		// console.log(config);

		this.config = config;

		this.uuid = data.uuid ?? uuid();
		// console.log(`Added analysis: ${this.uuid}`);
	}
}
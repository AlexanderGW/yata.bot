import { uuid } from 'uuidv4';

const talib = require('talib');

export type AnalysisConfigData = {
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
}

export type AnalysisResultData = {
	result: object,
}

export class Analysis implements AnalysisData {
	config?: AnalysisConfigData;
	name: string;
	uuid: string;

	constructor (
		data: AnalysisData,
	) {
		this.name = data.name;

		let config: any = {};

		let explain = talib.explain(this.name);
		if (explain) {
			let i: number = 0;
			for (i = 0; i < explain.inputs.length; i++) {
				config[explain.inputs[i].name] = '';
			}
			
			for (i = 0; i < explain.optInputs.length; i++) {
				config[explain.optInputs[i].name] = explain.optInputs[i].defaultValue;
			}

			config = {
				...config,
				...data?.config
			};
		}

		// console.log(explain);
		// console.log(data.name);
		// console.log(config);

		this.config = config;

		this.uuid = uuid();
		// console.log(`Added analysis: ${this.uuid}`);
	}

	explain () {
		console.log(talib.explain(this.name));
	}
}
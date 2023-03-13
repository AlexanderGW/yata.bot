import { v4 as uuidv4 } from 'uuid';
import { Bot } from './Bot';

const talib = require('talib');

export type AnalysisConfigData = {
	startIndex?: number,
	inReal?: string[],
	inRealAnalysis?: AnalysisItem,
	inRealField?: string,
	optInTimePeriod?: number,
	optInNbDevUp?: number,
	optInNbDevDn?: number,
	optInMAType?: number,
}

export type AnalysisExecuteResultData = {
	outReal?: number[] | string[],
	outRealUpperBand?: number[] | string[],
	outRealMiddleBand?: number[] | string[],
	outRealLowerBand?: number[] | string[],
}

export type AnalysisResultData = {
	begIndex: number,
	nbElement: number,
	result?: AnalysisExecuteResultData,
}

export type AnalysisExplainInputsData = {
	name: string,
	type: string,
}

export type AnalysisExplainOptInputsData = {
	name: string,
	displayName: string,
	defaultValue: number,
	hint: string,
	type: string,
}

export type AnalysisExplainData = {
	group: string,
	hint: string,
	inputs: Array<AnalysisExplainInputsData>,
	name: string,
	optInputs: Array<AnalysisExplainOptInputsData>,
}

export type AnalysisData = {
	config?: AnalysisConfigData,
	name: string,
	type: string,
	uuid?: string,
}

export class AnalysisItem implements AnalysisData {
	config?: AnalysisConfigData;
	explain: AnalysisExplainData;
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

		// Bot.log(this.explain);
		// Bot.log(`type: ${data.type}`);
		// Bot.log(`name: ${data.name}`);
		// Bot.log(config);

		this.config = config;

		this.uuid = data.uuid ?? uuidv4();
		// Bot.log(`Added analysis: ${this.name}`);
	}
}

export const Analysis = {
	new (
		data: AnalysisData,
	): AnalysisItem {
		let item = new AnalysisItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
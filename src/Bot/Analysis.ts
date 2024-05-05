import { v4 as uuidv4 } from 'uuid';
import { Bot } from './Bot';

const talib = require('talib');

// export const analysisTypeList = [
// 	'RSI', 'MACD', 'EMA', 'SMA', 'BBANDS', ''
// ] as const;

// export type AnalysisTypes = typeof analysisTypeList[number];
export type AnalysisTypes = string;

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
	type: AnalysisTypes,
	uuid?: string,
}

export class AnalysisItem implements AnalysisData {
	config?: AnalysisConfigData;
	explain: AnalysisExplainData;
	name: string;
	type: AnalysisTypes;
	uuid: string;

	constructor (
		_: AnalysisData,
	) {
		this.name = _.name;
		this.type = _.type;

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
				..._?.config
			};
		}

		// Bot.log(this.explain);
		// Bot.log(`type: ${_.type}`);
		// Bot.log(`name: ${_.name}`);
		// Bot.log(config);

		this.config = config;

		this.uuid = _.uuid ?? uuidv4();
		// Bot.log(`Added analysis: ${this.name}`);
	}
}

export const Analysis = {
	new (
		_: AnalysisData,
	): AnalysisItem {
		let item = new AnalysisItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid) as AnalysisItem;
	}
};
export type AnalysisData = {
	name: string,
}

export class Analysis implements AnalysisData {
	name: string;

	constructor (
		data: AnalysisData,
	) {
		this.name = data.name;
	}
}
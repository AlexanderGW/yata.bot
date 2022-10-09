import { Analysis } from "./Analysis";
import { Pair } from "./Pair";

export type StrategyData = {
	pair: Pair,
	analysis: Analysis[],
}

export class Strategy implements StrategyData {
	pair: Pair;
	analysis: Analysis[];

	constructor (
		data: StrategyData,
	) {
		this.pair = data.pair;
		this.analysis = data.analysis;
	}
}
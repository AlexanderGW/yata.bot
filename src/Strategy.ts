import { Analysis } from "./Analysis";
import { Exchange } from "./Exchange";
import { Pair } from "./Pair";

export type StrategyData = {
	analysis: Analysis[],
	exchange: Exchange,
	name?: string,
	pair: Pair,

	// Seconds
	timeframe: number;
}

export class Strategy implements StrategyData {
	analysis: Analysis[];
	exchange: Exchange;
	name?: string;
	pair: Pair;
	timeframe: number;

	constructor (
		data: StrategyData,
	) {
		this.analysis = data.analysis;
		this.exchange = data.exchange;
		if (data.name)
			this.name = data.name;
		this.pair = data.pair;
		this.timeframe = data.timeframe > 0 ? data.timeframe : 0;
	}
}
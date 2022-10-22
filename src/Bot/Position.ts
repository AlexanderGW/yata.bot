import { Bot } from "./Bot";
import { Exchange } from "./Exchange";
import { Pair } from "./Pair";
import { State } from "./State";

export type PositionData = {
	amount?: string,
	exchange: Exchange,
	pair: Pair,
	state?: State,
}

export class Position implements PositionData {
	amount?: string = '0';
	exchange: Exchange;
	pair: Pair;
	state?: State = State.Open;

	constructor (
		data: PositionData,
	) {
		if (data.amount)
			this.amount = data.amount;
		this.exchange = data.exchange;
		this.pair = data.pair;
		if (data.state)
			this.state = data.state;
	}
}
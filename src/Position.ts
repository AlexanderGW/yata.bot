import { Bot } from "./Bot";
import { Exchange } from "./Exchange";
import { Pair } from "./Pair";

export enum State {
	Open = 1,
	Closed = 0,
}

export type PositionData = {
	exchange: Exchange,
	pair: Pair,
	amount?: string,
	state?: State,
}

export class Position implements PositionData {
	exchange: Exchange;
	pair: Pair;
	amount?: string = '0';
	state?: State = State.Open;

	constructor (
		data: PositionData,
	) {
		this.exchange = data.exchange;
		this.pair = data.pair;
		if (data.amount)
			this.amount = data.amount;
		if (data.state)
			this.state = data.state;
	}
}
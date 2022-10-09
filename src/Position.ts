import { Bot } from "./Bot";
import { Exchange } from "./Exchange";
import { Pair } from "./Pair";

export class Position {
	exchange: Exchange;
	pair: Pair;
	state: number = 0;

	constructor (
		exchange: Exchange,
		pair: Pair,
	) {
		this.exchange = exchange;
		this.pair = pair;
	}
}
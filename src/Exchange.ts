import { Pair } from "./Pair";

export type ExchangeData = {
	api?: object,
	name: string,
	key?: string,
	secret?: string,	
}

export interface ExchangeInterface {
	request: (
		data: object
	) => void;

	getPrimer: (
		pair: Pair,
		interval: number,
	) => void;

	getLatestTicker: (
		pair: Pair,
		interval: number,
	) => void;
}

export class Exchange implements ExchangeData {
	api?: object;
	name: string;

	constructor (
		data: ExchangeData,
	) {
		this.name = data.name;
	}

	store (
		data: object
	) {
		// TODO: Write to JSON files
	}
}
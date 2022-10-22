import { Asset } from "./Asset";

export type PairData = {
	a: Asset,
	b: Asset,
}

export class Pair implements PairData {
	a: Asset;
	b: Asset;

	constructor (
		data: PairData,
	) {
		this.a = data.a;
		this.b = data.b;
	}
}
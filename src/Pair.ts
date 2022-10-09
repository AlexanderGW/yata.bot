import { Asset } from "./Asset";

export class Pair {
	a: Asset;
	b: Asset;

	constructor (
		a: Asset,
		b: Asset,
	) {
		this.a = a;
		this.b = b;
	}
}
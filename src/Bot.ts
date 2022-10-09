import { Exchange } from './Exchange';
import { Asset } from './Asset';
import { Pair } from './Pair';
import { Position } from './Position';

export let exchange: Exchange[] = [];
export let asset: Asset[] = [];
export let pair: Pair[] = [];
export let position: Position[] = [];

export const Bot = {

	getExchangeById: function (
		id: number
	) {
		return exchange[id];
	},

	setExchange: function (
		name: string,
		key: string,
		secret: string,
	): Exchange {
		const id: number = exchange.length;
		console.log(`setExchangeId: ${id}`);

		exchange[id] = new Exchange(
			name,
		);

		return exchange[id];
	},

	getAssetById: function (
		id: number
	) {
		return asset[id];
	},

	setAsset: function (
		ticker: string,
	): Asset {
		const id: number = asset.length;
		console.log(`setAssetId: ${id}`);

		asset[id] = new Asset(
			ticker,
		);

		return asset[id];
	},

	getPairById: function (
		id: number
	) {
		return pair[id];
	},

	setPair: function (
		a: Asset,
		b: Asset,
	): Pair {
		const id: number = pair.length;
		console.log(`setPairId: ${id}`);

		pair[id] = new Pair(
			a,
			b,
		);

		return pair[id];
	},

	getPositionById: function (
		id: number
	) {
		return position[id];
	},

	setPosition: function (
		exchange: Exchange,
		pair: Pair,
	): Position {
		const id: number = position.length;
		console.log(`setPositionId: ${id}`);

		position[id] = new Position(
			exchange,
			pair,
		);

		return position[id];
	},
};
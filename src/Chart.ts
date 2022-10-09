import { Candle } from "./Candle";

export type ChartData = {
	candle: Candle[];
};

export class Chart implements ChartData {
	candle: Candle[];

	constructor (
		data: ChartData,
	) {
		this.candle = data.candle;
	}
}
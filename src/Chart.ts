import { Candle } from "./Candle";
import { Exchange } from "./Exchange";

export type ChartData = {
	exchange: Exchange,
	candle: Candle[],
};

export class Chart implements ChartData {
	candle: Candle[];
	exchange: Exchange;

	constructor (
		data: ChartData,
	) {
		this.candle = data.candle;
		this.exchange = data.exchange;
	}
}
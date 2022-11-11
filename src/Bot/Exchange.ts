import { ChartCandleData, ChartItem } from "./Chart";
import { uuid } from 'uuidv4';
import { Bot } from "./Bot";
import { OrderItem } from "./Order";

const fs = require('fs');

export type ExchangeData = {
	name: string,
	key?: string,
	secret?: string,	
	uuid?: string,
}

export interface ExchangeInterface {
	order: (
		order: OrderItem,
	) => void;

	primeChart: (
		chart: ChartItem,
	) => void;

	syncChart: (
		chart: ChartItem,
	) => void;
}

export interface ExchangeStorageInterface {
	refreshChart: (
		chart: ChartItem,
		data: object,
	) => void;
}

export class ExchangeItem implements ExchangeData, ExchangeInterface, ExchangeStorageInterface {
	name: string;
	uuid: string;
	
	constructor (
		data: ExchangeData,
	) {
		this.name = data.name;
		this.uuid = data.uuid ?? uuid();
	}

	compat (
		chart: ChartItem,
	) {
		if (chart.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	order (
		order: OrderItem,
	) {
		
	}

	primeChart (
		chart: ChartItem,
	) {
		
	}

	refreshChart (
		chart: ChartItem,
		data: ChartCandleData
	) {
		chart.refresh(data);

		return; // Skip logging

		const pad = (value: number) =>
			value.toString().length == 1
			? `0${value}`
			: value;

		const now = new Date();

		let pathParts = [
			chart.exchange.name,
			chart.pair.a.symbol + chart.pair.b.symbol,
			now.getUTCFullYear(),
			pad(now.getUTCMonth() + 1),
			pad(now.getUTCDate()),
		];
		let path = pathParts.join('/');
		// Bot.log(path);

		// return;

		let filenameParts = [
			chart.exchange.name,
			chart.pair.a.symbol + chart.pair.b.symbol,
			now.getUTCFullYear(),
			pad(now.getUTCMonth() + 1),
			pad(now.getUTCDate()),
			pad(now.getUTCHours()),
			pad(now.getUTCMinutes()),
			pad(now.getUTCSeconds()),
		];
		let filename = filenameParts.join('-');
		// Bot.log(filename);

		let responseJson = JSON.stringify(data);

		let storagePath = `./storage/${path}`;
		let storageFile = `${storagePath}/${filename}.json`;

		try {
			if (!fs.existsSync(storagePath)) {
				fs.mkdirSync(
					storagePath,
					{
						recursive: true
					},
					(err: object) => {
						if (err)
							throw err;

						Bot.log(`Directory created: ${storagePath}`);
					}
				)
			}
		} catch (err) {
			return console.error(err);
		}

        try {
			fs.writeFile(
				storageFile,
				responseJson,
				function (
					err: object
				) {
					if (err)
						throw err;
					
					Bot.log(`Stored: ${storageFile}`);
				}
			);
		} catch (err) {
			return console.error(err);
		}
	}

	syncChart (
		chart: ChartItem,
	) {
		
	}
}

export const Exchange = {
	new (
		data: ExchangeData,
	): ExchangeItem {
		let item = new ExchangeItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
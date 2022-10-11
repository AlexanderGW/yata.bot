import { Chart, ChartCandleData } from "./Chart";
import { uuid } from 'uuidv4';

const fs = require('fs');

export type ExchangeData = {
	handle?: object,
	name: string,
	key?: string,
	secret?: string,	
}

export interface ExchangeInterface {
	primeChart: (
		chart: Chart,
	) => void;

	syncChart: (
		chart: Chart,
	) => void;
}

export interface ExchangeStorageInterface {
	refreshChart: (
		chart: Chart,
		data: object,
	) => void;
}

export class Exchange implements ExchangeData, ExchangeStorageInterface {
	handle?: object;
	name: string;
	uuid: string;
	
	constructor (
		data: ExchangeData,
	) {
		this.name = data.name;
		this.uuid = uuid();
	}

	compat (
		chart: Chart,
	) {
		if (chart.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	refreshChart (
		chart: Chart,
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
		// console.log(path);

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
		// console.log(filename);

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

						console.log(`Directory created: ${storagePath}`);
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
					
					console.log(`Stored: ${storageFile}`);
				}
			);
		} catch (err) {
			return console.error(err);
		}
	}
}
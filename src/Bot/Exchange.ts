import { ChartCandleData, ChartItem } from "./Chart";
import { uuid } from 'uuidv4';
import { Bot, Log } from "./Bot";
import { OrderItem } from "./Order";

const fs = require('fs');

export type ExchangeData = {
	class?: string,
	name?: string,
	key?: string,
	secret?: string,	
	uuid?: string,
}

export interface ExchangeInterface {
	order: (
		order: OrderItem,
	) => Promise<boolean>;

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
	class: string;
	name: string;
	uuid: string;
	
	constructor (
		data: ExchangeData,
	) {
		this.class = data.class as string;
		if (data.hasOwnProperty('name'))
			this.name = data.name as string;
		else
			this.name = data.class as string;
		this.uuid = data.uuid ?? uuid();
	}

	compat (
		chart: ChartItem,
	) {
		if (chart.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	async order (
		order: OrderItem,
	) {
		return true;
	}

	refreshChart (
		chart: ChartItem,
		data: ChartCandleData
	) {
		chart.refresh(data);

		return true; // Skip logging

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
		Bot.log(`Chart '${chart.uuid}' sync`);
	}
}

export const Exchange = {
	async new (
		data: ExchangeData,
	): Promise<any> {

		// Default to `Paper` exchange
		if (!data.hasOwnProperty('class'))
			data.class = 'Paper';

		let importPath = `./Exchange/${data.class}`;
		Bot.log(`Exchange import: ${importPath}`);

		let item: any;

		const className = `${data.class}Item`;
			
		// Import exchange extension
		await import(importPath).then(module => {
			let newItem: any = new module[className](data);

			if (newItem.constructor.name === className) {
				let uuid = Bot.setItem(newItem);

				item = Bot.getItem(uuid);
			}
		}).catch(err => Bot.log(err.message, Log.Err));

		return item;
	}
};
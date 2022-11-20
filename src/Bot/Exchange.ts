import { ChartCandleData, ChartItem } from "./Chart";
import { uuid } from 'uuidv4';
import { Bot, Log } from "./Bot";
import { OrderItem, OrderStatus } from "./Order";

const fs = require('fs');

export type ExchangeData = {
	class?: string,
	name?: string,
	key?: string,
	secret?: string,	
	uuid?: string,
}

export interface ExchangeInterface {
	syncChart: (
		chart: ChartItem,
	) => void;
}

export interface ExchangeBaseInterface {
	cancelOrder: (
		order: OrderItem,
	) => Promise<OrderItem>;

	createOrder: (
		order: OrderItem,
	) => Promise<OrderItem>;

	editOrder: (
		order: OrderItem,
	) => Promise<OrderItem>;
}

export interface ExchangeStorageInterface {
	refreshChart: (
		chart: ChartItem,
		data: object,
	) => void;
}

export class ExchangeBase implements ExchangeBaseInterface {
	class: string = '';
	name: string;
	result: Array<OrderItem> = [];
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

	async cancelOrder (
		order: OrderItem,
	) {
		order.status = OrderStatus.Cancelled;
		Bot.log(`Paper: Order '${order.uuid}' cancelled on exchange '${order.exchange.uuid}'`);
		return order;
	}

	async createOrder (
		order: OrderItem,
	) {
		order.confirmed = true;
		Bot.log(`Paper: Order '${order.uuid}' created on exchange '${order.exchange.uuid}'`);
		return order;
	}

	async editOrder (
		order: OrderItem,
	) {
		let orderResult: OrderItem = order;
		orderResult.status = OrderStatus.Cancelled;
		Bot.log(`Paper: Order '${order.uuid}' edited on exchange '${order.exchange.uuid}'`);
		return orderResult;
	}
}

export class ExchangeItem extends ExchangeBase implements ExchangeData, ExchangeInterface, ExchangeStorageInterface {
	compat (
		chart: ChartItem,
	) {
		if (chart.exchange.uuid === this.uuid)
			return true;
		return false;
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
		let item: any;

		// Exchange class specified
		if (data.class?.length) {
			let importPath = `./Exchange/${data.class}`;
			Bot.log(`Exchange import: ${importPath}`);

			const className = `${data.class}Item`;
				
			// Import exchange extension
			await import(importPath).then(module => {
				let newItem: any = new module[className](data);

				if (newItem.constructor.name === className) {
					let uuid = Bot.setItem(newItem);

					item = Bot.getItem(uuid);
				}
			}).catch(err => Bot.log(err.message, Log.Err));
		}

		// Default to base `Exchange` with paper trading
		else {
			let newItem: any = new ExchangeItem(data);
			let uuid = Bot.setItem(newItem);

			item = Bot.getItem(uuid);
		}

		return item;
	}
};
import { ChartCandleData, ChartItem } from "./Chart";
import { v4 as uuidv4 } from 'uuid';
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
	) => Promise<void>;

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

export class ExchangeItem implements ExchangeData, ExchangeInterface, ExchangeStorageInterface {
	class: string = '';
	name: string;
	order: Array<OrderItem> = [];
	orderIndex: string[] = [];
	uuid: string;
	
	constructor (
		data: ExchangeData,
	) {
		this.class = data.class as string;
		if (data.hasOwnProperty('name'))
			this.name = data.name as string;
		else if (data.hasOwnProperty('class'))
			this.name = data.class as string;
		else
			this.name = 'Paper';
		
		this.uuid = data.uuid ?? uuidv4();
	}

	async cancelOrder (
		order: OrderItem,
	) {
		order.status = OrderStatus.Cancelled;
		Bot.log(`Order '${order.name}' cancelled (paper) on exchange '${order.pair.exchange.name}'`);
		return order;
	}

	async createOrder (
		order: OrderItem,
	) {
		order.confirmed = true;
		Bot.log(`Order '${order.name}' created (paper) on exchange '${order.pair.exchange.name}'`);
		return order;
	}

	async editOrder (
		order: OrderItem,
	) {
		let orderResult: OrderItem = order;
		orderResult.status = OrderStatus.Cancelled;
		Bot.log(`Order '${order.name}' edited (paper) on exchange '${order.pair.exchange.name}'`);
		return orderResult;
	}

	compat (
		chart: ChartItem,
	) {
		if (chart.pair.exchange.uuid === this.uuid)
			return true;
		return false;
	}

	refreshChart (
		chart: ChartItem,
		data: ChartCandleData
	) {
		chart.updateDataset(data);
		chart.refreshDataset();

		// Check if datasets need to be stored
		if (!process.env.BOT_EXCHANGE_STORE_DATASET || process.env.BOT_EXCHANGE_STORE_DATASET !== '1')
			return true;

		const pad = (value: number) =>
			value.toString().length == 1
			? `0${value}`
			: value;

		const now = new Date();

		let pathParts = [
			chart.pair.exchange.name,
			chart.pair.a.symbol + chart.pair.b.symbol,
			now.getUTCFullYear(),
			pad(now.getUTCMonth() + 1),
			pad(now.getUTCDate()),
		];
		let path = pathParts.join('/');
		// Bot.log(path);

		let filenameParts = [
			chart.pair.exchange.name,
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

		let storagePath = `./storage/dataset/${path}`;
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
		} catch (err: any) {
			return Bot.log(err.message as string, Log.Err);
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
		} catch (err: any) {
			return Bot.log(err.message as string, Log.Err);
		}
	}

	async syncChart (
		chart: ChartItem,
	) {
		Bot.log(`Chart '${chart.name}' sync`);
	}
}

export const Exchange = {
	async new (
		data: ExchangeData,
	): Promise<ExchangeItem> {
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
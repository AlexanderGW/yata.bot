import { ChartCandleData, ChartItem } from "./Chart";
import { uuid } from 'uuidv4';
import { Bot, Log } from "./Bot";
import { OrderItem } from "./Order";

const fs = require('fs');

export type ExchangeData = {
	class?: string,
	name: string,
	key?: string,
	secret?: string,	
	uuid?: string,
}

export interface ExchangeInterface {
	order: (
		order: OrderItem,
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
		// if (data.hasOwnProperty('name'))
		// 	this.name = data.name;
		// else
		// 	this.name = data.class;
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

		// let exchangeClassName = data.class;
		let importPath = `./Exchange/${data.class}`;
		Bot.log(`Exchange import: ${importPath}`);

		// const exchangeClass = require(importPath);
		// console.log(`itemEval: ${exchangeClass}`);
		// let itemEval = new exchangeClass(data);//`new ${exchangeClass}(data)`;
		// console.log(`itemEval: ${typeof itemEval}`);
		// let item = eval(itemEval);
		// let uuid = Bot.setItem(item);

		// return Bot.getItem(uuid);

		try {
			const className = `${data.class}Item`;

			let newItem: any;
			
			// // Import exchange extension
			await import(importPath).then(module => {
				console.log(`module`);
				console.log(module[className]);

				// let itemEval = `new ${module[className]}(data)`;
				// console.log(`itemEval: ${typeof itemEval}`);
				// console.log(itemEval);
				// let item = eval(itemEval);
				// console.log(`data`);
				// console.log(data);
				newItem = new module[className](data);
				console.log(`newItem`);
				console.log(newItem);

				if (typeof newItem === className) {
					
				}

				let uuid = Bot.setItem(newItem);
				console.log(`uuid: ${uuid}`);

				let item = Bot.getItem(uuid);
				console.log(`item`);
				console.log(item);

				return item;
				
			}).catch(err => Bot.log(err.message, Log.Err));
		} catch (err) {
			Bot.log(err as string);
		}
		
		// try {
		// 	// import(importPath).then(exports => {
		// 	// 	console.log(`exports`);
		// 	// 	console.log(exports);
		// 	// });
		// 	// console.error(`import`);
		// 	// import(importPath).then(module => {
		// 	// 	const className = `${data.class}Item`;
		// 	// 	// console.log(`module`);
		// 	// 	// console.log(module[className]);

		// 	// 	// let itemEval = `new ${module[className]}(data)`;
		// 	// 	// console.log(`itemEval: ${typeof itemEval}`);
		// 	// 	// console.log(itemEval);
		// 	// 	// let item = eval(itemEval);
		// 	// 	let item = new module[className](data);
		// 	// 	console.log(item);
		// 	// 	let uuid = Bot.setItem(item);

		// 	// 	return Bot.getItem(uuid);
		// 	// }).catch(err => console.log(err.message));
		// 	// async () => {
		// 	// 	const {aComponent} = await import(importPath);
		// 	// 	console.error(`aComponent`);
		// 	// 	console.error(aComponent);
		// 	//   }
		// } catch (err) {
		// 	console.error(`err`);
		// 	console.error(err);
		// }

		// (async () => {
		// 	// let exchangeClass = data.class;
		// 	let importPath = `./Exchange/${exchangeClass}`;
		// 	console.log(`importPath: ${importPath}`);
			
		// 	let exports = await import(importPath);
		// 	//do something with @exports
		// 	console.log(`exports`);
		// 	console.log(exports);
		// })();

		// TODO: Find a better way than `eval`
		// let itemEval = `new ${module}(data)`;
		// console.log(`itemEval: ${itemEval}`);
		// let item = eval(itemEval);
		// let uuid = Bot.setItem(item);

		// return Bot.getItem(uuid);
	}
};
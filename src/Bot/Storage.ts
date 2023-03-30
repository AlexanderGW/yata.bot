import { Bot, ItemBaseData, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

export type StorageInterface = {
	class?: string,
	name?: string,
	item?: object[],
	itemIndex?: string[],
	uuid?: string,
	getItem: (
		name: string,
	) => Promise<any>,
	setItem: (
		name: string,
		_: ItemBaseData,
	) => Promise<string>,
}

export type StorageData = {
	class?: string,
	name?: string,
	item?: object[],
	itemIndex?: string[],
	uuid?: string,
}

export class StorageBase implements StorageData {
	class?: string = '';
	name?: string;
	item: object[] = [];
	itemIndex: string[] = [];
	uuid: string;

	constructor (
		_: StorageData,
	) {
		if (_.hasOwnProperty('class'))
			this.class = _.class as string;
		if (_.hasOwnProperty('name'))
			this.name = _.name as string;
		else
			this.name = _.class as string;
		if (typeof _.item === 'object')
			this.item = _.item;
		if (typeof _.itemIndex === 'object')
			this.itemIndex = _.itemIndex;
		this.uuid = _.uuid ?? uuidv4();
	}
}

export const Storage = {
	async new (
		_: StorageData,
	): Promise<any> {
		let item: any;

		// Default class if undefined
		if (!_.class?.length)
			_.class = 'Memory';
		
		let importPath = `./Storage/${_.class}`;
		Bot.log(`Storage import: ${importPath}`);

		const className = `${_.class}StorageItem`;
			
		// Import Storage extension
		await import(importPath).then(module => {
			let newItem: any = new module[className](_);

			if (newItem.constructor.name === className) {
				let uuid = Bot.setItem(newItem);

				item = Bot.getItem(uuid);
			}
		}).catch(err => Bot.log(err.message, Log.Err));

		return item;
	}
};

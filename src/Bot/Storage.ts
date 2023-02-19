import { Bot, ItemBaseData, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

export type StorageInterface = {
	class?: string,
	name?: string,
	item?: object[],
	itemIndex?: string[],
	uuid?: string,
	getItem: (
		uuid: string,
	) => Promise<any>,
	setItem: (
		data: ItemBaseData,
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
		data: StorageData,
	) {
		if (data.hasOwnProperty('class'))
			this.class = data.class as string;
		if (data.hasOwnProperty('name'))
			this.name = data.name as string;
		else
			this.name = data.class as string;
		if (typeof data.item === 'object')
			this.item = data.item;
		if (typeof data.itemIndex === 'object')
			this.itemIndex = data.itemIndex;
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Storage = {
	async new (
		data: StorageData,
	): Promise<any> {
		let item: any;

		// Default class if undefined
		if (!data.class?.length)
			data.class = 'Memory';
		
		let importPath = `./Storage/${data.class}`;
		Bot.log(`Storage import: ${importPath}`);

		const className = `${data.class}StorageItem`;
			
		// Import Storage extension
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

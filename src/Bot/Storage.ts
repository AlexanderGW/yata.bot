import { Bot, ItemBaseData, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

export type StorageItemData = {
	name?: string,
	value?: string,
	uuid: string,
};

export type StorageItemOptionData = {
	// [index: string]: boolean[],
	merge?: boolean,
	cache?: boolean,
};

export type StorageItemInterface = ItemBaseData & {
	getUuid: () => string,
	getValue: (
		key: string,
	) => number | object | string,
	setName: (
		key: string,
	) => boolean,
	setValue: (
		key: string,
		value: any,
	) => boolean,
};

export type StorageApiData = {
	name: string,
	uuid: string,
}

export type StorageApiInterface = {
	name: string,
	uuid: string,

	connect?: () => Promise<void>,
	disconnect?: () => Promise<void>,
	getItem: (
		key: string,
		options?: StorageItemOptionData,
	) => Promise<any>,
	setItem: (
		key: string,
		value: any,
		option?: StorageItemOptionData,
	) => Promise<boolean>,
};

export type StorageBaseInterface = {
	api?: StorageApiInterface,
	connect?: () => Promise<void>,
	disconnect: () => Promise<void>,
	getItem: (
		key: string,
		options?: StorageItemOptionData,
	) => Promise<any>,
	setItem: (
		key: string,
		value: any,
		options?: StorageItemOptionData,
	) => Promise<boolean>,
};

export type StorageData = {
	class?: string,
	name?: string,
	uuid?: string,
}

export class StorageItem implements StorageData, StorageBaseInterface {
	api?: StorageApiInterface;
	class?: string = '';
	name?: string;
	uuid: string;

	constructor (
		_: StorageData,
	) {
		this.class = _.class;
		if (_.name)
			this.name = _.name;
		else if (_.class)
			this.name = _.class;
		else
			this.name = 'Memory';
		
		this.uuid = _.uuid ?? uuidv4();
	}

	async connect (): Promise<void> {
		if (typeof this.api?.connect === 'function')
			await this.api?.connect();
	}

	async disconnect (): Promise<void> {
		if (typeof this.api?.disconnect === 'function')
			await this.api?.disconnect();
	}

	async getItem (
		id: string,
		option?: StorageItemOptionData,
	): Promise<any> {
		let value;
		try {
			Bot.log(`Storage '${this.name}'; getItem; ID: '${id}'`,Log.Verbose);
			const result = await this.api?.getItem(id, option);
			if (result)
				value = result;
		} catch (error) {
			Bot.log(error, Log.Err);
		}

		// Bot.log(value, Log.Verbose);

		return value;
	}

	async setItem (
		id: string,
		_: any,
		option?: StorageItemOptionData,
	): Promise<boolean> {
		try {
			Bot.log(`Storage '${this.name}'; setItem; ID: '${id}'`,Log.Verbose);
			const uuid = await this.api?.setItem(id, _, option);
			if (!uuid)
				throw new Error(`Failed to set item '${id}'`);

			return true;
		} catch (error) {
			Bot.log(error, Log.Err);
		}

		return false;
	}
}

export const Storage = {
	async new (
		_: StorageData,
	): Promise<StorageItem> {
		if (!_.class)
			_.class = 'Memory';
		
		let storageItem: StorageItem = new StorageItem(_);

		let importPath = `./Storage/${_.class}`;

		const className = `${_.class}Storage`;
			
		// Add API backend
		await import(importPath).then(module => {
			let storageApi: StorageApiInterface = new module[className](_);
			if (storageApi.constructor.name !== className)
				throw new Error(`Failed to instanciate Storage API class '${className}'`);

			storageItem.api = storageApi;
		}).catch(err => Bot.log(err.message, Log.Err));

		let uuid = Bot.setItem(storageItem);
		const item: StorageItem = Bot.getItem(uuid);

		Bot.log(`Storage '${item.name}'; API initialised`, Log.Verbose);

		return item;
	}
};

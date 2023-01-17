import { Bot, ItemBaseData, Log } from "./Bot";
import { v4 as uuidv4 } from 'uuid';

export type Storage = {
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

export class MemoryStorage extends StorageBase implements Storage {
	constructor (
		data: StorageData,
	) {
		super(data);
	}
	
	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} uuid 
	 * @returns {object}
	 */
	async getItem (
		uuid: string,
	): Promise<any> {
		try {
			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === uuid);
			if (index >= 0)
				return this.item[index];

			return {};
		} catch (error) {
			Bot.log(error as string, Log.Err);

			return {};
		}
	}

	/**
	 * Add or replace an exisiting item in general storage
	 * 
	 * @param {object} data - Base item structure for storage
	 * @returns {string} The items UUID
	 */
	async setItem (
		data: ItemBaseData,
	): Promise<string> {
		try {
			// Reset existing item
			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === data.uuid);
			if (index >= 0) {
				this.item[index] = data;
				
				return this.itemIndex[index];
			}

			// Store new item
			else {
				// let newIndex = this.item.length;
				this.item.push(data);
				this.itemIndex.push(data.uuid);

				return data.uuid;
			}
		} catch (err) {
			console.error(err);
			return '';
		}
	}
}

// export class Storage implements StorageData, StorageInterface {
// 	class?: string = '';
// 	name?: string;
// 	uuid: string;

// 	constructor (
// 		data: StorageData,
// 	) {
// 		if (data.hasOwnProperty('class'))
// 			this.class = data.class as string;
// 		if (data.hasOwnProperty('name'))
// 			this.name = data.name as string;
// 		else
// 			this.name = data.class as string;
// 		this.uuid = data.uuid ?? uuidv4();
// 	}

// 	/**
// 	 * Lookup and return an item from general storage
// 	 * 
// 	 * @param {string} uuid 
// 	 * @returns {object}
// 	 */
// 	async getItem (
// 		uuid: string,
// 	) {
// 		try {
// 			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === uuid);
// 			if (index >= 0)
// 				return this.item[index];

// 			return {};
// 		} catch (error) {
// 			Bot.log(error as string, Log.Err);

// 			return {};
// 		}
// 	}

// 	/**
// 	 * Add or replace an exisiting item in general storage
// 	 * 
// 	 * @param {object} data - Base item structure for storage
// 	 * @returns {string} The items UUID
// 	 */
// 	async setItem (
// 		data: ItemBaseData,
// 	): Promise<string> {
// 		return new Promise((resolve, reject) => {

// 			// Reset existing item
// 			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === data.uuid);
// 			if (index >= 0) {
// 				this.item[index] = data;
				
// 				resolve(this.itemIndex[index]);
// 			}
			
// 			// Store new item
// 			else {
// 				// let newIndex = this.item.length;
// 				this.item.push(data);
// 				this.itemIndex.push(data.uuid);

// 				resolve(data.uuid);
// 			}

// 			reject('');
// 		});
// 	}
// }

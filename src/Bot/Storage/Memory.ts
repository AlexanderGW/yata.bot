import { Bot, ItemBaseData, Log } from "../Bot";
import { StorageBase, StorageData, StorageInterface } from "../Storage";

export class MemoryStorageItem extends StorageBase implements StorageInterface {
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
			let value = {};
			let index = this.itemIndex.findIndex((_uuid: string) => _uuid === uuid);
			if (index >= 0)
				value = this.item[index];

			return value;
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
			Bot.log(err as string, Log.Err);
			
			return '';
		}
	}
}

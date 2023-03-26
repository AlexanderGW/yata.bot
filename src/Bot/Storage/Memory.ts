import { Bot, ItemBaseData, Log } from "../Bot";
import { StorageBase, StorageData, StorageInterface } from "../Storage";

export class MemoryStorageItem extends StorageBase implements StorageInterface {
	constructor (
		data: StorageData,
	) {
		super(data);
	}

	/**
	 * 
	 */
	async close() {
		return true;
	}
	
	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} uuid
	 * @returns {object}
	 */
	async getItem (
		name: string,
	): Promise<any> {
		let returnValue: any = false;
		try {
			let index = this.itemIndex.indexOf(name);
			if (index >= 0)
				returnValue = this.item[index];
		} catch (error) {
			Bot.log(error as string, Log.Err);
		}

		return returnValue;
	}

	/**
	 * Add or replace an existing item in general storage
	 * 
	 * @param {object} data - Base item structure for storage
	 * @returns {string} The items UUID
	 */
	async setItem (
		name: string,
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

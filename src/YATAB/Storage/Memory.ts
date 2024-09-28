import { YATAB, Log } from "../YATAB";
import { StorageApiData, StorageApiInterface, StorageItemOptionData } from "../Storage";

export type ParallelArrayStorageData = {
	item?: any[],
	itemIndex?: string[],
};

export class MemoryStorage implements ParallelArrayStorageData, StorageApiInterface {
	name: string;
	uuid: string;
	item: any[] = [];
	itemIndex: string[] = [];

	constructor (
		_: StorageApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;
	}
	
	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} uuid
	 * @returns {object}
	 */
	async getItem (
		key: string,
	): Promise<any> {
		let returnValue = null;
		try {
			let index = this.itemIndex.indexOf(key);
			if (index >= 0)
				returnValue = this.item[index];
		} catch (error) {
			YATAB.log(error, Log.Err);
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
		key: string,
		value: any,
		option?: StorageItemOptionData,
	): Promise<boolean> {
		try {
			// Reset existing item
			let index = this.itemIndex.findIndex((uuid: string) => uuid === key);
			if (index >= 0) {
				if (option?.merge && typeof this.item[index] === 'object')
					this.item[index] = {
						...this.item[index],
						...value
					};
				if (!option?.merge)
					this.item[index] = value;
			}

			// Store new item
			else {
				this.item.push(value);
				this.itemIndex.push(key);
			}

			return true;
		} catch (error) {
			YATAB.log(error, Log.Err);
		}

		return false;
	}
}

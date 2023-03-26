import { Bot, ItemBaseData, Log } from "../Bot";
import { StorageBase, StorageData, StorageInterface } from "../Storage";

import { createClient, RedisClientType } from 'redis';


export class RedisStorageItem extends StorageBase implements StorageInterface {
	client: RedisClientType;

	constructor (
		data: StorageData,
	) {
		super(data);

		this.client = createClient({
			url: 'redis://127.0.0.1:6379'
		});

		this.client.on('error', (err: string) => Bot.log(`RedisStorageItem '${this.name}'; ${JSON.stringify(err)}`, Log.Err));

		this.connect();
	}

	/**
	 * 
	 */
	async connect() {
		await this.client.connect();
	}

	/**
	 * 
	 */
	async close() {
		await this.client.disconnect();
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
				return this.item[index];

			const valueRaw = await this.client.get(name);
			returnValue = JSON.parse(valueRaw as string);
		} catch (err) {
			Bot.log(err as string, Log.Err);
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
			let index = this.itemIndex.indexOf(name);
			if (index >= 0) {
				this.item[index] = data;
				
				return this.itemIndex[index];
			}

			// Store new item
			else {
				// let newIndex = this.item.length;
				this.item.push(data);
				this.itemIndex.push(name);	

				const value = JSON.stringify(data);
				await this.client.set(name, value);

				return name;
			}
		} catch (err) {
			Bot.log(err as string, Log.Err);
			
			return '';
		}
	}
}

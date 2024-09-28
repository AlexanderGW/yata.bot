import { YATAB, Log } from "../YATAB";
import { StorageApiData, StorageApiInterface } from "../Storage";
import { createClient, RedisClientType } from 'redis';

export class RedisStorage implements StorageApiInterface {
	handle: RedisClientType;
	name: string;
	uuid: string;

	constructor (
		_: StorageApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;

		this.handle = createClient({
			url: process.env.REDIS_URI! ?? 'redis://127.0.0.1:6379'
		});

		this.handle.on(
			'error',
			(err: string) => YATAB.log(
				`RedisStorage '${this.name}'; ${JSON.stringify(err)}`
			, Log.Err)
		);

		this.connect();
	}

	/**
	 * 
	 */
	async connect() {
		await this.handle.connect();
	}

	/**
	 * 
	 */
	async disconnect() {
		await this.handle.disconnect();
	}
	
	/**
	 * Lookup and return an item from general storage
	 * 
	 * @param {string} uuid 
	 * @returns {object}
	 */
	async getItem (
		id: string,
	): Promise<any> {
		let returnValue: any = false;
		try {
			const valueRaw = await this.handle.get(id);
			returnValue = JSON.parse(valueRaw as string);
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
		id: string,
		value: any,
	): Promise<boolean> {
		try {
			const json = JSON.stringify(value);
			// YATAB.log(`Redis.setItem`);
			const result = await this.handle.set(id, json);
			// YATAB.log(`Redis.setItem.result`);
			// YATAB.log(result);
			return true;
		} catch (error) {
			YATAB.log(error, Log.Err);
		}
			
		return false;
	}
}

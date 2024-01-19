import { Bot, ItemBaseData, Log } from "../Bot";
import { StorageBase, StorageData, StorageInterface } from "../Storage";

const fs = require('fs');

export class FileStorageItem extends StorageBase implements StorageInterface {
	constructor (
		_: StorageData,
	) {
		super(_);
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
	 * @param {string} name
	 * @returns {object}
	 */
	async getItem (
		name: string,
	): Promise<any> {
		let returnValue: any = false;
		try {
			const storagePath = `./storage/json`;
			const storageFile = `${storagePath}/${name}.json`;

			if (!fs.existsSync(storagePath))
				return false;

			const fileContent = await fs.readFileSync(
				storageFile,
				'utf8',
			);
			returnValue = JSON.parse(fileContent);
		} catch (error) {
			Bot.log(`FileStorage.getItem; ${JSON.stringify(error)}`, Log.Err);
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
		_: ItemBaseData,
	): Promise<any> {
		const storagePath = `./storage/json`;
		const storageFile = `${storagePath}/${name}.json`;
		
		// Create path
		try {
			if (!fs.existsSync(storagePath)) {
				fs.mkdirSync(
					storagePath,
					{
						recursive: true
					},
					(err: object) => {
						if (err) throw err;

						Bot.log(`FileStorage.setItem; Path created: ${storagePath}`, Log.Verbose);
					}
				)
			}
		} catch (error) {
			Bot.log(`FileStorage.setItem; ${JSON.stringify(error)}`, Log.Err);
			
			return '';
		}

		// Write data
		try {
			fs.writeFile(
				storageFile,
				JSON.stringify(_),
				function (
					err: object
				) {
					if (err) throw err;
					
					Bot.log(`FileStorage.setItem; File written: ${storageFile}`, Log.Verbose);
				}
			);
		} catch (error) {
			Bot.log(`FileStorage.setItem; writeFile; ${JSON.stringify(error)}`, Log.Err);
		}

		return _.uuid;
	}
}

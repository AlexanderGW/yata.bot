import { Bot, ItemBaseData, Log } from "../Bot";
import { StorageApiData, StorageApiInterface } from "../Storage";

import { existsSync, readFileSync, mkdirSync, writeFile } from 'node:fs';

export class FileStorage implements StorageApiInterface {
	name: string;
	uuid: string;

	constructor (
		_: StorageApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;
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

			if (!existsSync(storagePath))
				return false;

			const fileContent = readFileSync(
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
		id: string,
		value: any,
	): Promise<boolean> {
		const storagePath = `./storage/json`;
		const storageFile = `${storagePath}/${id}.json`;
		
		// Create path
		try {
			if (!existsSync(storagePath)) {
				mkdirSync(
					storagePath,
					{
						recursive: true
					}
				)
			}
		} catch (error) {
			Bot.log(`Failed to create path '${storagePath}'`, Log.Err);
			return false;
		}

		// Write data
		try {
			writeFile(
				storageFile,
				JSON.stringify(value),
				(error) => {
					if (error)
						throw new Error(error.message);
					
					Bot.log(`FileStorage.setItem; File written: ${storageFile}`, Log.Verbose);
				}
			);
		} catch (error) {
			Bot.log(`FileStorage.setItem; writeFile; ${JSON.stringify(error)}`, Log.Err);
			return false;
		}

		return true;
	}
}

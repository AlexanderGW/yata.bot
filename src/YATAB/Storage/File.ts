import { YATAB, ItemBaseData, Log } from "../YATAB";
import { StorageApiData, StorageApiInterface } from "../Storage";

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';

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
		let returnValue: any = null;
		try {
			const storagePath = `./storage/json`;
			if (!existsSync(storagePath)) {
				throw new Error(`Storage '${this.name}'; Path '${storagePath}' does not exist`);
			}

			const storageFile = `${storagePath}/${name}.json`;

			const fileContent = readFileSync(
				storageFile,
				'utf8',
			);
			if (!fileContent) {
				throw new Error(`Storage '${this.name}'; File '${storageFile}' does not exist`);
			}
			returnValue = JSON.parse(fileContent);
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
		const storagePath = `./storage/json`;
		const storageFile = `${storagePath}/${id}.json`;

		YATAB.log(`Storage '${this.name}'; setItem; Output to file: '${storageFile}'`, Log.Verbose);
		
		try {

			// Create path
			if (!existsSync(storagePath)) {
				if (!mkdirSync(
					storagePath,
					{
						recursive: true
					}
				)) {
					throw new Error(`Failed to create path '${storagePath}'`);
				}
			}

			// Write data
			writeFileSync(
				storageFile,
				JSON.stringify(value),
			);

			return true;
		} catch (error) {
			YATAB.log(error, Log.Err);
			YATAB.log(`Storage '${this.name}'; Failed to create item '${storagePath}'`, Log.Err);
		}
		
		return false;
	}
}

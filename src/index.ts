import { parse, stringify } from 'yaml'

import { Bot, Log } from './Bot/Bot';
import { Strategy } from './Bot/Strategy';
import { Asset } from './Bot/Asset';
import { Pair } from './Bot/Pair';
import { Scenario } from './Bot/Scenario';
import { Exchange } from './Bot/Exchange';
import { Chart } from './Bot/Chart';
import { Timeframe } from './Bot/Timeframe';
import { Position } from './Bot/Position';
import { Order } from './Bot/Order';
import { Analysis } from './Bot/Analysis';
import { Storage } from './Bot/Storage';

const fs = require('fs');

const playbook = process.argv[2];
const playbookPath = `./playbook/${playbook}.yml`;
// console.log(`playbookPath: ${playbookPath}`);

// Attempt to read YAML file
try {
	let playbookFile: any = fs.readFileSync(
		playbookPath,
		'utf8',
		function (
			err: object,
			data: string
		) {
			if (err)
				Bot.log(JSON.stringify(err), Log.Err);

			// if (data)
			// 	Bot.log(data);
		}
	);
	// console.log(`playbookFile: ${playbookFile}`);

	if (playbookFile) {

		// Parse YAML
		let playbookObject: any = parse(playbookFile);
		// console.log(`playbookObject`);
		console.log(playbookObject);

		// Process in order of component dependencies
		const playbookTypes = {
			exchange: Exchange,
			asset: Asset,
			pair: Pair,
			position: Position,
			order: Order,
			chart: Chart,
			analysis: Analysis,
			scenario: Scenario,
			strategy: Strategy,
			timeframe: Timeframe
		};
		const playbookTypeKeys = Object.keys(playbookTypes);

		let playbookCache: any = {
			exchange: {
				itemIndex: [],
				item: [],
			},
			asset: {
				itemIndex: [],
				item: [],
			},
			pair: {
				itemIndex: [],
				item: [],
			},
			position: {
				itemIndex: [],
				item: [],
			},
			order: {
				itemIndex: [],
				item: [],
			},
			chart: {
				itemIndex: [],
				item: [],
			},
			analysis: {
				itemIndex: [],
				item: [],
			},
			scenario: {
				itemIndex: [],
				item: [],
			},
			strategy: {
				itemIndex: [],
				item: [],
			},
			timeframe: {
				itemIndex: [],
				item: [],
			}
		};

		// Process YAML components
		Object.entries(playbookTypes).forEach(([itemKey, itemObject]) => {
			// console.log(`key: ${key}`);
			// console.log(`${object}`);

			if (itemKey in playbookObject) {
				// console.log(`itemKey: ${itemKey}`);
				// console.log(playbookObject[itemKey]);

				Object.entries(playbookObject[itemKey]).forEach(([name, object]) => {
					// console.log(`name: ${name}`);
					// console.log(object);

					const finalObject: any = {
						...object as object,
						name
					};

					for (let key in finalObject) {
						let value = finalObject[key];

						if (playbookTypeKeys.indexOf(key) >= 0) {
							// playbookCache[key]
							// finalObject[key] = value;
							let index = playbookCache[key].itemIndex.findIndex((_uuid: string) => _uuid === value);
							if (index >= 0)
								finalObject[key] = playbookCache[key].item[index];
						}

						// Parse short-hand notation strings
						if (key.slice(-4) === 'Time' && typeof value === 'string') {
							const shno = value.slice(-1);
							const integer = parseInt(value.slice(0, -1));
							// console.log(`integer: ${integer}, shno: ${shno}`);

							switch (shno) {
								case 's':
									value = integer * 1000;
									break;
								case 'm':
									value = integer * 60000;
									break;
								case 'h':
									value = integer * 3600000;
									break;
								case 'd':
									value = integer * 86400000;
									break;
								case 'w':
									value = integer * 604800000;
									break;
							}
							finalObject[key] = value;
						}
					}
					// console.log(finalObject);
	
					let item = itemObject.new(finalObject);
					playbookCache[itemKey].item.push(item);
					playbookCache[itemKey].itemIndex.push(name);
					console.log(`item`);
					console.log(item);
				});
			}
		});
	}
} catch (err) {
	Bot.log(JSON.stringify(err), Log.Err);
}
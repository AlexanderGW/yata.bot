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
		const playbookItems = {
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

		// Process YAML components
		Object.entries(playbookItems).forEach(([itemKey, itemObject]) => {
			// console.log(`key: ${key}`);
			// console.log(`${object}`);

			if (itemKey in playbookObject) {
				console.log(`itemKey: ${itemKey}`);
				// console.log(playbookObject[itemKey]);

				Object.entries(playbookObject[itemKey]).forEach(([name, object]) => {
					// console.log(`key: ${key}`);
					// console.log(`${object}`);
		
					console.log(`name: ${name}`);
					console.log(object);

					const parsedObject = {
						// ...object,
						name
					};
					// TODO: Walk `time` suffixed fields, and parse SHNO values
					console.log(parsedObject);
	
					// let item = itemObject.new(parsedObject);
					// console.log(item);
				});
			}
		});
	}
} catch (err) {
	Bot.log(JSON.stringify(err), Log.Err);
}
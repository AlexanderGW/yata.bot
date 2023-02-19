import { parse, stringify } from 'yaml'

import { Bot, Log } from './Bot/Bot';
import { Strategy, StrategyItem } from './Bot/Strategy';
import { Asset } from './Bot/Asset';
import { Pair } from './Bot/Pair';
import { Scenario, ScenarioItem } from './Bot/Scenario';
import { Exchange } from './Bot/Exchange';
import { Chart } from './Bot/Chart';
import { Timeframe } from './Bot/Timeframe';
import { Position } from './Bot/Position';
import { Order } from './Bot/Order';
import { Analysis, AnalysisItem } from './Bot/Analysis';
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
		// console.log(playbookObject);

		if (playbookObject.version > 1)
			throw(`Unsupported schema version`);

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
		Object.entries(playbookTypes).forEach(([typeKey, typeObject]) => {
			// console.log(`key: ${typeKey}`);
			// console.log(`${typeObject}`);

			if (typeKey in playbookObject) {
				// console.log(`typeKey: ${typeKey}`);
				// console.log(playbookObject[typeKey]);

				Object.entries(playbookObject[typeKey]).forEach(([name, objectTypeData]) => {
					// console.log(`name: ${name}`);
					// console.log(object);

					const finalObject: any = {
						...objectTypeData as object,
						name
					};

					for (let key in finalObject) {
						// console.log(`finalKey: ${key}`);
						let value = finalObject[key];

						// Property matches a playbook item key, attempt to add existing reference
						if (playbookTypeKeys.indexOf(key) >= 0) {
							// playbookCache[key]
							// finalObject[key] = value;
							if (typeof value === 'string') {
								let cacheIdx = playbookCache[key].itemIndex.findIndex((_uuid: string) => _uuid === value);
								if (cacheIdx < 0)
									throw (`Key '${key}' referenced item name '${value}' not found`);

								finalObject[key] = playbookCache[key].item[cacheIdx];
							} else {
								// console.log(`key: ${key}`);
								// console.log(typeof value);
								// console.log(`${value}`);

								// Handle supported arrays of items
								if (
									['analysis', 'strategy'].indexOf(key) >= 0
									&& typeof value === 'object'
								) {
									let finalValue: Array<AnalysisItem | StrategyItem> = [];
									for (let valueIdx in value) {
										let cacheIdx = playbookCache[key].itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx]);
										if (cacheIdx < 0)
											throw (`Key '${key}' referenced item name '${value[valueIdx]}' not found`);

										finalValue.push(playbookCache[key].item[cacheIdx]);
									}

									finalObject[key] = finalValue;
									// console.log((finalObject[key]));
								}
								
								else {
									throw (`Unsupported: Key '${key}' value '${JSON.stringify(value)}'`);
								}
							}
						}
						
						// Handle strategy `action`
						else if(key === 'action') {
							let finalValue: Array<[ScenarioItem, StrategyItem?]> = [];
							let finalValueSet: any = [];
							for (let valueIdx in value) {
								finalValueSet = [];
								
								// `Scenario` lookup
								let cacheIdx = playbookCache.scenario.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx][0]);
								if (cacheIdx < 0)
									throw (`Key '${key}' referenced scenario '${value[valueIdx][0]}' not found`);

								finalValueSet.push(playbookCache.scenario.item[cacheIdx]);

								// Optional `Strategy` lookup
								if (value[valueIdx].length === 2) {
									cacheIdx = playbookCache.strategy.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx][1]);
									if (cacheIdx < 0)
										throw (`Key '${key}' referenced strategy '${value[valueIdx][0]}' not found`);

									finalValueSet.push(playbookCache.strategy.item[cacheIdx]);
								}

								finalValue.push(finalValueSet);
							}

							finalObject[key] = finalValue;
							// console.log((finalObject[key]));
						}

						// Handle subscriptrion `timeframeAny`
						// TODO: Migrate `Bot.subscribe` to `Subscription` item model?
						else if(key === 'timeframeAny') {
							let finalValue: Array<AnalysisItem | StrategyItem> = [];
							for (let valueIdx in value) {
								let cacheIdx = playbookCache.timeframe.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx]);
								if (cacheIdx < 0)
									throw (`Key '${key}' referenced timeframe '${value[valueIdx]}' not found`);

								finalValue.push(playbookCache.timeframe.item[cacheIdx]);
							}

							finalObject[key] = finalValue;
							// console.log((finalObject[key]));
						}

						// Parse short-hand notation strings, on `Time` suffixed properties
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
								default:
									throw (`Key '${key}' has invalid SHNO value '${shno}'`);
							}
							finalObject[key] = value;
						}
					}
					console.log(finalObject);
	
					let item = typeObject.new(finalObject);
					playbookCache[typeKey].item.push(item);
					playbookCache[typeKey].itemIndex.push(name);
					// console.log(`item`);
					// console.log(item);
				});
			}
		});

		// TODO: Implement subscription handling
	}
} catch (err) {
	Bot.log(JSON.stringify(err), Log.Err);
}
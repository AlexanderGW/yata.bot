import { parse, stringify } from 'yaml'

import { Bot, Log } from './Bot/Bot';
import { Strategy, StrategyItem } from './Bot/Strategy';
import { Asset, AssetItem } from './Bot/Asset';
import { Pair, PairItem } from './Bot/Pair';
import { Scenario, ScenarioItem } from './Bot/Scenario';
import { Exchange, ExchangeItem } from './Bot/Exchange';
import { Chart, ChartItem } from './Bot/Chart';
import { Timeframe, TimeframeItem } from './Bot/Timeframe';
import { Position, PositionItem } from './Bot/Position';
import { Order, OrderItem } from './Bot/Order';
import { Analysis, AnalysisItem } from './Bot/Analysis';
import { Storage } from './Bot/Storage';
import { Subscription, SubscriptionItem } from './Bot/Subscription';

import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
	const fs = require('fs');

	const playbookName = process.argv[2];
	const playbookPath = `./playbook/${playbookName}.yml`;
	// console.log(`playbookPath: ${playbookPath}`);

	if (!fs.existsSync(playbookPath))
		throw (`Playbook '${playbookName}' not found '${playbookPath}'`);

	// Attempt to read YAML file
	let playbookFile: string = fs.readFileSync(
		playbookPath,
		'utf8',
	);
	// console.log(`playbookFile: ${playbookFile}`);

	if (!playbookFile.length)
		throw (`Playbook is empty '${playbookName}'`);

	const allowedConditionOperators = [
		'<', '<=', '>', '>=', '==', '!='
	];

	// Types to be processed in order of component dependencies
	const playbookTypes: {
		[index: string]: any,
	} = {
		exchange: Exchange,
		asset: Asset,
		pair: Pair,
		position: Position,
		order: Order,
		chart: Chart,
		analysis: Analysis,
		scenario: Scenario,
		strategy: Strategy,
		timeframe: Timeframe,
		subscription: Subscription,
	};
	const playbookTypeKeys = Object.keys(playbookTypes);

	// Cache table of all playbook item, to facilitate referencing
	let playbookCache: {
		[index: string]: {
			itemIndex: string[],
			item: any[],
		},
		exchange: {
			itemIndex: string[],
			item: ExchangeItem[],
		},
		pair: {
			itemIndex: string[],
			item: PairItem[],
		},
		asset: {
			itemIndex: string[],
			item: AssetItem[],
		},
		position: {
			itemIndex: string[],
			item: PositionItem[],
		},
		order: {
			itemIndex: string[],
			item: OrderItem[],
		},
		chart: {
			itemIndex: string[],
			item: ChartItem[],
		},
		analysis: {
			itemIndex: string[],
			item: AnalysisItem[],
		},
		scenario: {
			itemIndex: string[],
			item: ScenarioItem[],
		},
		strategy: {
			itemIndex: string[],
			item: StrategyItem[],
		},
		timeframe: {
			itemIndex: string[],
			item: TimeframeItem[],
		},
		subscription: {
			itemIndex: string[],
			item: SubscriptionItem[],
		},
	} = {
		exchange: {
			itemIndex: [],
			item: [],
		},
		pair: {
			itemIndex: [],
			item: [],
		},
		asset: {
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
		},
		subscription: {
			itemIndex: [],
			item: [],
		},
	};

	let playbookObject: any = parse(playbookFile);
	// console.log(`playbookObject`);
	// console.log(playbookObject);
	// TODO: Handle invalid content
	
	if (!playbookObject.hasOwnProperty('version'))
		throw(`Missing required 'version' key`);
	
	if (playbookObject.version > 1)
		throw(`Unsupported schema version`);
	
	// Set dryrun state
	let dryrun = true;
	if (playbookObject.hasOwnProperty('dryrun'))
		dryrun = playbookObject.dryrun;
	else if (process.env.BOT_DRYRUN === '0')
		dryrun = false;

	// Process YAML components
	for (let typeKey in playbookTypes) {
		const typeObject = playbookTypes[typeKey];
		// console.log(`key: ${typeKey}`);
		// console.log(`${typeObject}`);
	
		if (typeKey in playbookObject) {
			// console.log(`typeKey: ${typeKey}`);
			// console.log(playbookObject[typeKey]);

			for (let itemName in playbookObject[typeKey]) {
				// console.log(`itemName: ${itemName}`);
				// console.log(object);
	
				let finalItemData: any = {
					...playbookObject[typeKey][itemName] as object,
					name: itemName
				};
	
				for (let key in finalItemData) {
					// console.log(`finalKey: ${key}`);
					let value = finalItemData[key];
	
					// Property matches a playbook item key, attempt to add existing reference
					if (playbookTypeKeys.indexOf(key) >= 0) {

						// Establish item reference
						if (typeof value === 'string') {
							let cacheIdx = playbookCache[key].itemIndex.findIndex((_uuid: string) => _uuid === value);
							if (cacheIdx < 0)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value}' not found`);
	
							finalItemData[key] = playbookCache[key].item[cacheIdx];
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
										throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value[valueIdx]}' not found`);
	
									finalValue.push(playbookCache[key].item[cacheIdx]);
								}
	
								finalItemData[key] = finalValue;
								// console.log(finalItemData[key]);
							}
							
							else {
								throw (`Unsupported: Type '${typeKey}' item '${itemName}' key '${key}' value '${JSON.stringify(value)}'`);
							}
						}
					}

					// Handle pair assets
					else if(
						typeKey === 'pair'
						&& (key === 'a' || key === 'b')
					) {
						let cacheIdx = playbookCache.asset.itemIndex.findIndex((_uuid: string) => _uuid === value);
						if (cacheIdx < 0)
							throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced asset '${value}' not found`);

						finalItemData[key] = playbookCache.asset.item[cacheIdx];
						// console.log(finalItemData[key]);
					}
					
					// Handle strategy `action`
					else if(
						typeKey === 'strategy'
						&& key === 'action'
					) {
						let finalValue: Array<[ScenarioItem, StrategyItem?]> = [];
						let finalValueSet: any = [];
						for (let valueIdx in value) {
							finalValueSet = [];
							
							// `Scenario` lookup
							let cacheIdx = playbookCache.scenario.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx][0]);
							if (cacheIdx < 0)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced scenario '${value[valueIdx][0]}' not found`);
	
							finalValueSet.push(playbookCache.scenario.item[cacheIdx]);
	
							// Optional `Strategy` lookup
							if (value[valueIdx].length === 2) {
								cacheIdx = playbookCache.strategy.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx][1]);
								if (cacheIdx < 0)
									throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced strategy '${value[valueIdx][0]}' not found`);
	
								finalValueSet.push(playbookCache.strategy.item[cacheIdx]);
							}
	
							finalValue.push(finalValueSet);
						}
	
						finalItemData[key] = finalValue;
						// console.log(finalItemData[key]);
					}
	
					// Handle subscription `action`
					else if(
						typeKey === 'subscription'
						&& key === 'action'
					) {
						console.log(`typeKey: ${typeKey}, key: ${key}`);
						console.log(finalItemData[key]);
					}
					
					// Validate scenario and subscription `condition` sets
					else if(key === 'condition') {
						// console.log(`typeKey: ${typeKey}, key: ${key}`);
						// console.log(finalItemData[key]);

						// Handle scenario `condition`
						if (typeKey === 'scenario') {
							for (let valueIdx in value) {
								for (let setIdx in value[valueIdx]) {
									let operator = value[valueIdx][setIdx][1];
									// console.log(value[valueIdx][setIdx]);
									// console.log(operator);
									if (allowedConditionOperators.indexOf(operator) < 0)
										throw (`Type '${typeKey}' item '${itemName}' key '${key}' has invalid operator '${operator}'`);
								}
							}
						
						// Handle subscription `condition`
						} else if (typeKey === 'subscription') {
							for (let valueIdx in value) {
								let operator = value[valueIdx][1];
								// console.log(value[valueIdx]);
								// console.log(operator);
								if (allowedConditionOperators.indexOf(operator) < 0)
									throw (`Type '${typeKey}' item '${itemName}' key '${key}' has invalid operator '${operator}'`);
							}
						}
					}
	
					// Handle subscriptrion `timeframeAny`
					else if(key === 'timeframeAny') {
						let finalValue: Array<TimeframeItem> = [];
						for (let valueIdx in value) {
							let cacheIdx = playbookCache.timeframe.itemIndex.findIndex((_uuid: string) => _uuid === value[valueIdx]);
							if (cacheIdx < 0)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced timeframe '${value[valueIdx]}' not found`);
	
							finalValue.push(playbookCache.timeframe.item[cacheIdx]);
						}
	
						finalItemData[key] = finalValue;
						// console.log(finalItemData[key]);
					}

					// Parse short-hand notation strings, on `Time` suffixed properties
					else if (
						key.slice(-4) === 'Time'
						&& typeof value === 'string'
					) {
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
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' has invalid SHNO value '${shno}'`);
						}
						finalItemData[key] = value;
					}
				}

				// Instantiate item
				let item = await typeObject.new(finalItemData);
				
				// Store the items for referencing
				playbookCache[typeKey].item.push(item);
				playbookCache[typeKey].itemIndex.push(itemName);
			}
		}
	}

	// Attempt to execute all `Timeframe`
	if (playbookCache.timeframe.item.length === 0)
		Bot.log(`No timeframes to execute`, Log.Info);
	else {
		for (let itemIdx in playbookCache.timeframe.item) {
			let timeframe = playbookCache.timeframe.item[itemIdx];
	
			try {
				Bot.log(`Execute timeframe '${timeframe.name}'`);
				timeframe.execute();
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}
	}
})();
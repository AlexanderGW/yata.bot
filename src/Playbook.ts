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
import { Subscription, SubscriptionActionCallbackModule, SubscriptionItem } from './Bot/Subscription';

import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
	const fs = require('fs');

	const playbookName = process.argv[2];
	const playbookPath = `./playbook/${playbookName}`;
	const playbookActions = `${playbookPath}/${playbookName}.ts`;
	const playbookTemplate = `${playbookPath}/${playbookName}.yml`;
	// console.log(`playbookPath: ${playbookPath}`);

	if (!fs.existsSync(playbookTemplate))
		throw (`Playbook '${playbookName}' not found '${playbookTemplate}'`);

	// Attempt to read YAML file
	let playbookFile: string = fs.readFileSync(
		playbookTemplate,
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

	type itemIndexType = {
		itemIndex: string[],
		item: string[],
	};

	// Cache table of all playbook item, to facilitate referencing
	let playbookCache: {
		[index: string]: itemIndexType,
		exchange: itemIndexType,
		pair: itemIndexType,
		asset: itemIndexType,
		position: itemIndexType,
		order: itemIndexType,
		chart: itemIndexType,
		analysis: itemIndexType,
		scenario: itemIndexType,
		strategy: itemIndexType,
		timeframe: itemIndexType,
		subscription: itemIndexType,
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

					// Allow custom `name` values, or default to type scope prefixed names
					name: playbookObject[typeKey][itemName].name ?? `${typeKey}.${itemName}`
				};

				for (let key in finalItemData) {
					// console.log(`finalKey: ${key}`);
					let value = finalItemData[key];

					// Property matches a playbook item key, attempt to link existing reference
					if (playbookTypeKeys.indexOf(key) >= 0) {

						// Establish item reference
						if (typeof value === 'string') {
							let itemLookup: any = false;
							let cacheIdx = playbookCache[key].itemIndex.findIndex((x: string) => x === value);
							if (cacheIdx >= 0)
								itemLookup = Bot.getItem(playbookCache[key].item[cacheIdx]);

							if (cacheIdx < 0 || itemLookup === false)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value}' not found`);

							finalItemData[key] = itemLookup;
						} else {
	
							// Handle supported arrays of items
							if (
								['analysis', 'strategy'].indexOf(key) >= 0
								&& typeof value === 'object'
							) {
								let finalValue: Array<AnalysisItem | StrategyItem> = [];
								for (let valueIdx in value) {
									let itemLookup: any = false;
									let cacheIdx = playbookCache[key].itemIndex.findIndex((x: string) => x === value[valueIdx]);
									if (cacheIdx >= 0)
										itemLookup = Bot.getItem(playbookCache[key].item[cacheIdx]);

									if (cacheIdx < 0 || itemLookup === false)
										throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value[valueIdx]}' not found`);
									
									finalValue.push(itemLookup);
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
					else if (
						typeKey === 'pair'
						&& (key === 'a' || key === 'b')
					) {
						let itemLookup: any = false;
						let cacheIdx = playbookCache.asset.itemIndex.findIndex((x: string) => x === value);
						if (cacheIdx >= 0)
							itemLookup = Bot.getItem(playbookCache.asset.item[cacheIdx]);

						if (cacheIdx < 0 || itemLookup === false)
							throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced asset '${value}' not found`);
						
						finalItemData[key] = itemLookup;
					}
					
					// Handle strategy `action`
					else if (
						typeKey === 'strategy'
						&& key === 'action'
					) {
						let finalValue: Array<[ScenarioItem, StrategyItem?]> = [];
						let finalValueSet: any = [];
						for (let valueIdx in value) {
							finalValueSet = [];
							
							// `Scenario` lookup
							let itemLookup: any = false;
							let cacheIdx = playbookCache.scenario.itemIndex.findIndex((x: string) => x === value[valueIdx][0]);
							if (cacheIdx >= 0)
								itemLookup = Bot.getItem(playbookCache.scenario.item[cacheIdx]);

							if (cacheIdx < 0 || itemLookup === false)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced scenario '${value[valueIdx][0]}' not found`);
							
							finalValueSet.push(itemLookup);
	
							// Optional `Strategy` lookup
							if (value[valueIdx].length === 2) {
								itemLookup = false;
								cacheIdx = playbookCache.strategy.itemIndex.findIndex((x: string) => x === value[valueIdx][1]);
								if (cacheIdx >= 0)
									itemLookup = Bot.getItem(playbookCache.strategy.item[cacheIdx]);

								if (cacheIdx < 0 || itemLookup === false)
									throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced strategy '${value[valueIdx][1]}' not found`);
								
								finalValueSet.push(itemLookup);
							}
	
							finalValue.push(finalValueSet);
						}
	
						finalItemData[key] = finalValue;
						// console.log(finalItemData[key]);
					}
	
					// Handle subscription `action`
					else if (
						typeKey === 'subscription'
						&& key === 'action'
					) {

						// Set name of `playbook` if doesn't exist, for callback module loading
						if (!finalItemData.hasOwnProperty('playbook'))
							finalItemData.playbook = playbookName;
						
						// console.log(`typeKey: ${typeKey}, key: ${key}`);
						// console.log(finalItemData);

						for (let i in finalItemData[key]) {	
							// let line = finalItemData[key][i];

							// Import exchange extension
							if (!fs.existsSync(playbookActions))
								throw (`Playbook subscription action file not found '${playbookActions}'`);
						}
					}
					
					// Validate scenario and subscription `condition` sets
					else if (key === 'condition') {
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
	
					// Handle subscription `timeframeAny`
					else if (key === 'timeframeAny') {
						let finalValue: Array<TimeframeItem> = [];
						for (let valueIdx in value) {
							let itemLookup: any = false;
							let cacheIdx = playbookCache.timeframe.itemIndex.findIndex((x: string) => x === value[valueIdx]);
							if (cacheIdx >= 0)
								itemLookup = Bot.getItem(playbookCache.timeframe.item[cacheIdx]);

							if (cacheIdx < 0 || itemLookup === false)
								throw (`Type '${typeKey}' item '${itemName}' key '${key}' referenced timeframe '${value[valueIdx]}' not found`);
							
							finalValue.push(itemLookup);
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
				// console.log(typeKey);
				// console.log(finalItemData);
				// console.log(item);
				
				// Store the items for referencing
				let uuid = Bot.setItem(item);

				playbookCache[typeKey].item.push(uuid);
				playbookCache[typeKey].itemIndex.push(itemName);
			}
		}
	}

	// console.log(`playbookCache`);
	// console.log(playbookCache);
	// console.log(Bot.itemNameIndex);

	// Attempt to execute all `Timeframe`
	if (playbookCache.timeframe.item.length === 0)
		Bot.log(`No timeframes to execute`, Log.Warn);
	else {

		// Execute all timeframes, in order they were found in the playbook
		for (let itemIdx in playbookCache.timeframe.item) {
			try {
				const timeframe = Bot.getItem(playbookCache.timeframe.item[itemIdx]);

				// Establish interval
				if (timeframe.intervalTime)
					timeframe.activate();

				await timeframe.execute();
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}
	}
})();
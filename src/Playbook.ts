import { parse } from 'yaml'

import { Bot, Log } from './Bot/Bot';
import { Strategy, StrategyData, StrategyItem } from './Bot/Strategy';
import { Asset, AssetData } from './Bot/Asset';
import { Pair, PairData } from './Bot/Pair';
import { Scenario, ScenarioData, ScenarioItem, scenarioConditionOperators } from './Bot/Scenario';
import { Exchange, ExchangeData, ExchangeItem } from './Bot/Exchange';
import { Chart, ChartData, ChartItem } from './Bot/Chart';
import { Timeframe, TimeframeData, TimeframeItem } from './Bot/Timeframe';
import { Order, OrderData, OrderItem } from './Bot/Order';
import { Analysis, AnalysisData, AnalysisItem } from './Bot/Analysis';
import { Storage, StorageData, StorageItem } from './Bot/Storage';
import { Subscription, SubscriptionData, SubscriptionEvent } from './Bot/Subscription';

import { existsSync, readFileSync } from 'node:fs';

import * as dotenv from 'dotenv';
dotenv.config();

export interface PlaybookItemData {
	storage?: {
		[index: string]: StorageData,
	},
	exchange?: {
		[index: string]: ExchangeData,
	},
	pair?: {
		[index: string]: PairData,
	},
	asset?: {
		[index: string]: AssetData,
	},
	order?: {
		[index: string]: OrderData,
	},
	chart?: {
		[index: string]: ChartData,
	},
	analysis?: {
		[index: string]: AnalysisData,
	},
	scenario?: {
		[index: string]: ScenarioData,
	},
	strategy?: {
		[index: string]: StrategyData,
	},
	timeframe?: {
		[index: string]: TimeframeData,
	},
	subscription?: {
		[index: string]: SubscriptionData,
	},
};

export type PlaybookCacheData = {
	[index: string]: ItemIndexType,
	storage: ItemIndexType,
	exchange: ItemIndexType,
	pair: ItemIndexType,
	asset: ItemIndexType,
	order: ItemIndexType,
	chart: ItemIndexType,
	analysis: ItemIndexType,
	scenario: ItemIndexType,
	strategy: ItemIndexType,
	timeframe: ItemIndexType,
	subscription: ItemIndexType,
};

export interface PlaybookItemInterface {
	[index: string]: any,
	storage: typeof Storage,
	exchange: typeof Exchange,
	asset: typeof Asset,
	pair: typeof Pair,
	order: typeof Order,
	chart: typeof Chart,
	analysis: typeof Analysis,
	scenario: typeof Scenario,
	strategy: typeof Strategy,
	timeframe: typeof Timeframe,
	subscription: typeof Subscription,
};

export type PlaybookItemKeys = keyof PlaybookItemData;

export type PlaybookItems = {
	[key in PlaybookItemKeys]?: PlaybookItemData[key];
};

export type PlaybookStructure = {
	[index: string]: any,
	backtest?: boolean;
	dryrun?: boolean;
	version: number;
} & PlaybookItems;

export type ItemIndexType = {
	itemIndex: string[],
	item: string[],
};



(async () => {
	const playbookName = process.argv[2];
	const playbookPath = `./playbook/${playbookName}`;
	const playbookActions = `${playbookPath}/${playbookName}.ts`;
	const playbookStateName = `playbookState.${playbookName}`;
	const playbookTemplate = `${playbookPath}/${playbookName}.yml`;
	// console.log(`playbookPath: ${playbookPath}`);

	if (!existsSync(playbookTemplate))
		throw new Error(`Playbook '${playbookName}' not found '${playbookTemplate}'`);

	// Attempt to read YAML file
	let playbookFile: string = readFileSync(
		playbookTemplate,
		'utf8',
	);
	// console.log(`playbookFile: ${playbookFile}`);

	if (!playbookFile.length)
		throw new Error(`Playbook is empty '${playbookName}'`);

	// Types to be processed in order of component dependencies
	// TODO: Type
	const playbookTypes: PlaybookItemInterface = {
		storage: Storage,
		exchange: Exchange,
		asset: Asset,
		pair: Pair,
		order: Order,
		chart: Chart,
		analysis: Analysis,
		scenario: Scenario,
		strategy: Strategy,
		timeframe: Timeframe,
		subscription: Subscription,
	};
	// TODO: Type
	const playbookTypeKeys = Object.keys(playbookTypes);

	// Cache table of all playbook item, to facilitate referencing
	// TODO: Refactor item/index structure
	let playbookCache: PlaybookCacheData = {
		storage: {
			itemIndex: [],
			item: [],
		},
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

	let playbookObject: PlaybookStructure = parse(playbookFile);
	
	// Check playbook version
	if (!playbookObject.hasOwnProperty('version'))
		throw(`Missing required 'version' key`);
	if (playbookObject.version > 1)
		throw(`Unsupported schema version`);

	// Default to `Memory` storage interface, if none are defined
	if (
		!playbookObject.hasOwnProperty('storage')
		|| playbookObject.storage === null
	) {
		playbookObject.storage = {
			memory: {
				class: 'Memory'
			}
		};
	}

	// Initialize bot
	Bot.init({

		// Backtesting
		backtest:
			playbookObject.hasOwnProperty('backtest')

				// Defined in playbook
				? playbookObject.backtest

				// Default to FALSE, if not defined
				: (process.env.BOT_BACKTEST === '1' ? true : false),
		
		// Dry-run
		dryrun:
			playbookObject.hasOwnProperty('dryrun')

				// Defined in playbook
				? playbookObject.dryrun

				// Default to TRUE, if not defined
				: (process.env?.BOT_DRYRUN === '0' ? false : true),
	});

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
					name: playbookObject[typeKey][itemName].name ?? `${typeKey}:${itemName}`
				};

				for (let key in finalItemData) {
					// console.log(`finalKey: ${key}`);
					let value = finalItemData[key];

					// Property matches a playbook item key, attempt to link existing reference
					if (playbookTypeKeys.indexOf(key) >= 0) {

						// Establish item reference
						if (typeof value === 'string') {
							let itemLookup: any = false;
							let cacheIdx = playbookCache[key].itemIndex.indexOf(value as string);
							if (cacheIdx >= 0)
								itemLookup = Bot.getItem(playbookCache[key].item[cacheIdx]);

							if (cacheIdx < 0 || itemLookup === false)
								throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value}' not found`);

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
										throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${value[valueIdx]}' not found`);
									
									finalValue.push(itemLookup);
								}
	
								finalItemData[key] = finalValue;
								// console.log(finalItemData[key]);
							}
							
							else {
								throw new Error(`Unsupported: Type '${typeKey}' item '${itemName}' key '${key}' value '${JSON.stringify(value)}'`);
							}
						}
					}

					// Handle pair assets
					else if (
						typeKey === 'pair'
						&& (key === 'a' || key === 'b')
					) {
						let itemLookup: any = false;
						let cacheIdx = playbookCache.asset.itemIndex.indexOf(value as string);
						if (cacheIdx >= 0)
							itemLookup = Bot.getItem(playbookCache.asset.item[cacheIdx]);

						if (cacheIdx < 0 || itemLookup === false)
							throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced asset '${value}' not found`);
						
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
								throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced scenario '${value[valueIdx][0]}' not found`);
							
							finalValueSet.push(itemLookup);
	
							// Optional `Strategy` lookup
							if (value[valueIdx].length === 2) {
								itemLookup = false;
								cacheIdx = playbookCache.strategy.itemIndex.findIndex((x: string) => x === value[valueIdx][1]);
								if (cacheIdx >= 0)
									itemLookup = Bot.getItem(playbookCache.strategy.item[cacheIdx]);

								if (cacheIdx < 0 || itemLookup === false)
									throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced strategy '${value[valueIdx][1]}' not found`);
								
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

							// Import module file with callback
							if (!existsSync(playbookActions))
								throw new Error(`Playbook subscription action file not found '${playbookActions}'`);
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
									// console.log(`value[valueIdx][setIdx]`);
									// console.log(value[valueIdx][setIdx]);

									// If `valueA` condition field contains a full-stop (.), and isn't prefixed `candle.`, add the `analysis` prefix, for Playbook name prefixing compatibility.
									if (
										value[valueIdx][setIdx][0].lastIndexOf('.') > 0
										&& value[valueIdx][setIdx][0].indexOf('candle.') !== 0
									) {
										value[valueIdx][setIdx][0] = `analysis:${value[valueIdx][setIdx][0]}`;
									}
									// If `valueB` condition field contains a full-stop (.), and isn't prefixed `candle.`, add the `analysis` prefix, for Playbook name prefixing compatibility.
									if (
										typeof value[valueIdx][setIdx][2] === 'string'
										&& value[valueIdx][setIdx][2].lastIndexOf('.') > 0
										&& value[valueIdx][setIdx][2].indexOf('candle.') !== 0
									) {
										value[valueIdx][setIdx][2] = `analysis:${value[valueIdx][setIdx][2]}`;
									}

									let operator = value[valueIdx][setIdx][1];
									if (scenarioConditionOperators.indexOf(operator) < 0)
										throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' has invalid operator '${operator}'`);
								}
							}
						
						// Handle subscription `condition`
						} else if (typeKey === 'subscription') {
							for (let valueIdx in value) {
								let operator = value[valueIdx][1];
								// console.log(value[valueIdx]);
								// console.log(operator);
								if (scenarioConditionOperators.indexOf(operator) < 0)
									throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' has invalid operator '${operator}'`);
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
								throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced timeframe '${value[valueIdx]}' not found`);
							
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
								throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' has invalid SHNO value '${shno}'`);
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

	// TEMP: Use first defined storage
	const playbookStore = Bot.getItem(playbookCache.storage.item[0]) as StorageItem;

	// Load the playbook state
	Bot.playbook = {
		name: playbookStateName,
		storage: playbookStore,
		lastState: await playbookStore.getItem(playbookStateName),
	};

	// Handle existing playbook state
	// TODO: Implement data validation? Version checks?
	if (Bot.playbook.lastState) {

		// Prime chart datasets, if available
		if (Bot.playbook.lastState.candleIndex?.length) {
			for (let chartIdx in Bot.playbook.lastState.candleIndex) {

				// Add dataset to chart
				const chart = Bot.getItem(Bot.playbook.lastState.candleIndex[chartIdx]) as ChartItem;
				if (chart && Bot.playbook.lastState.candle[chartIdx]) {
					try {
						// TODO: Set `datasetNextTime` based on tiemframe etc - currently falls back to default `BOT_CHART_DEFAULT_TOTAL_CANDLE`
						chart.updateDataset(Bot.playbook.lastState.candle[chartIdx]);
						chart.refreshDataset();
					} catch (error) {
						Bot.log(error, Log.Err);
					}
				}
			}
		}

		// Prime order state, if available
		if (Bot.playbook.lastState.orderIndex?.length) {
			for (let orderIdx in Bot.playbook.lastState.orderIndex) {
				const order = Bot.getItem(Bot.playbook.lastState.orderIndex[orderIdx]) as OrderItem;
				let orderData = Bot.playbook.lastState.order[orderIdx];
				if (order && orderData) {
					try {
						// TODO: Implement validation on state `status`, `responseStatus`
						order.update(orderData);
					} catch (error) {
						Bot.log(error, Log.Err);
					}
				}
			}
		}
	}
	
	// No existing playbook state, default to empty
	else {
		Bot.playbook.lastState = {
			candle: [],
			candleIndex: [],
			order: [],
			orderIndex: [],
			timeframe: [],
			timeframeIndex: [],
			updateTime: 0
		};
	}

	Bot.playbook.nextState = {
		...{
			candle: [],
			candleIndex: [],
			order: [],
			orderIndex: [],
			timeframe: [],
			timeframeIndex: [],
			updateTime: 0,
		},
		...Bot.playbook.lastState
	};

	// Attempt to execute all `Timeframe`
	if (playbookCache.timeframe.item.length === 0)
		Bot.log(`No timeframes to execute`, Log.Warn);
	else {

		// Execute all timeframes, in order they were found in the playbook
		for (let timeframeName in playbookCache.timeframe.item) {
			try {
				const timeframe = Bot.getItem(playbookCache.timeframe.item[timeframeName]) as TimeframeItem;

				// Establish interval
				if (timeframe.intervalTime)
					timeframe.activate();

				// Execute the timeframe
				await timeframe.execute();

				// No results, skip
				if (!timeframe.result.length)
					continue;

				// Send a despatch to subscribers, indicating the timeframe has results
				await Subscription.despatch({
					event: SubscriptionEvent.TimeframeResult,

					// The timeframe context
					timeframe: timeframe,
				});

				// Collect timeframe results for playbook state
				let timeframeSignal: number[] = [];

				// Walk through timeframe strategy results
				for (let i = 0; i < timeframe.result.length; i++) { // TODO: Changed from `<=` untested
					if (!timeframe.result[i])
						continue;

					// Log the last candle datapoint time field, of each matching scenario
					for (let j = 0; j <= timeframe.result[i].length; j++) {
						if (!timeframe.result[i][j])
							continue;

						const strategy = Bot.getItem(timeframe.resultIndex[i]) as StrategyItem;

						// TODO: Type
						const latestCandle = timeframe.result[i][j].length - 1;
						const datapoint = timeframe.result[i][j][latestCandle][0].datapoint;
						const timeField = strategy.chart.datasetTimeField;
						if (strategy.chart.dataset?.[timeField].hasOwnProperty(datapoint)) {
							// console.log(strategy.chart.dataset?[timeField][datapoint]);
							timeframeSignal.push(strategy.chart.dataset?.[timeField][datapoint]);
						}
					}
				}

				// Persist next state timeframe result timestamps
				const idxIndentifier = timeframe.name ?? timeframe.uuid;
				let index = Bot.playbook.nextState.timeframeIndex.findIndex(_name => _name === idxIndentifier);
				if (index >= 0) {

					// Add timeframe results, with deduplication
					Bot.playbook.nextState.timeframe[index] = [
						...new Set([
							...Bot.playbook.nextState.timeframe[index],
							...timeframeSignal
						])
					];
				} else {
					Bot.playbook.nextState.timeframe.push(timeframeSignal);
					Bot.playbook.nextState.timeframeIndex.push(idxIndentifier);
				}
			} catch (error) {
				Bot.log(error, Log.Err);
			}
		}
	}

	// Persist next state chart data
	if (playbookCache.chart.item.length) {
		for (let chartIdx in playbookCache.chart.itemIndex) {
			const chart = Bot.getItem(playbookCache.chart.item[chartIdx]) as ChartItem;

			// Add chart data to playbook state
			if (chart.dataset) {
				const idxIndentifier = chart.name ?? chart.uuid;
				let index = Bot.playbook.nextState.candleIndex.findIndex(_name => _name === idxIndentifier);
				if (index >= 0) {

					// Replace chart candles
					Bot.playbook.nextState.candle[index] = chart.dataset;
				} else {
					Bot.playbook.nextState.candle.push(chart.dataset);
					Bot.playbook.nextState.candleIndex.push(idxIndentifier);
				}
			}
		}
	}

	// Persist next state order data
	if (playbookCache.order.item.length) {
		for (let orderIdx in playbookCache.order.itemIndex) {
			const order = Bot.getItem(playbookCache.order.item[orderIdx]) as OrderItem;

			const idxIndentifier = order.name ?? order.uuid;
			let index = Bot.playbook.nextState.orderIndex.findIndex(_name => _name === idxIndentifier);
			if (index >= 0) {

				// Replace order
				Bot.playbook.nextState.order[index] = order;
			} else {
				Bot.playbook.nextState.order.push(order);
				Bot.playbook.nextState.orderIndex.push(idxIndentifier);
			}
		}
	}

	await Bot.exit();
})();
import { parse } from 'yaml'

import { YATAB, Log, YATAB_VERSION, YATAB_SCHEMA } from './YATAB/YATAB';
import { Strategy, StrategyData, StrategyItem } from './YATAB/Strategy';
import { Asset, AssetData } from './YATAB/Asset';
import { Pair, PairData, PairItem } from './YATAB/Pair';
import { Scenario, ScenarioData, ScenarioItem, scenarioConditionOperators } from './YATAB/Scenario';
import { Exchange, ExchangeData, ExchangeItem } from './YATAB/Exchange';
import { Chart, ChartData, ChartItem } from './YATAB/Chart';
import { Timeframe, TimeframeData, TimeframeItem } from './YATAB/Timeframe';
import { Order, OrderAction, OrderData, OrderItem } from './YATAB/Order';
import { Analysis, AnalysisData, AnalysisItem } from './YATAB/Analysis';
import { Storage, StorageData, StorageItem } from './YATAB/Storage';
import { Subscription, SubscriptionData, SubscriptionEvent } from './YATAB/Subscription';

import { existsSync, readFileSync } from 'node:fs';

import axios from 'axios';

import * as dotenv from 'dotenv';
import { configFields } from './Helper/Analysis';
dotenv.config();

export const REPO_URL = 'https://repo.yata.bot/';

export interface PlaybookRawData {
	[index: string]: any,
};

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

export type PlaybookState = {
	[index: string]: any,
	backtest?: boolean;
	dryrun?: boolean;
	version?: number;
} & PlaybookItems;

export type ItemIndexType = {
	itemIndex: string[],
	item: string[],
};

const mergePlaybook = (
	target: PlaybookRawData,
	source: PlaybookRawData
): PlaybookRawData => {
	for (const key in source) {
		// If both the target and source have the same key and
		// both values are objects, recursively merge them
		if (source.hasOwnProperty(key)) {
			if (
				source[key] && 
				typeof source[key] === 'object' &&
				!Array.isArray(source[key])
			) {
				if (!target[key])
					target[key] = {};

				target[key] = mergePlaybook(target[key], source[key]);
			} else {
				// Otherwise, just assign the source value to the target
				target[key] = source[key];
			}
		}
	}

	return target;
}

const parsePlaybook = async (
	data: string,
): Promise<PlaybookRawData | undefined> => {
	let playbookData: PlaybookRawData = parse(data);

	// Check playbook version
	if (!playbookData.hasOwnProperty('version'))
		throw new Error(`Missing required 'version' key`);
	if (Number(playbookData.version) > YATAB_SCHEMA)
		throw new Error(`Unsupported schema version`);

	// Fetch use references
	if (playbookData.hasOwnProperty('use')) {
		for (let key in playbookData.use) {
			const playbookObject = await use(playbookData.use[key]);
			if (!playbookObject) continue;

			playbookData = mergePlaybook(playbookData, playbookObject);

			// TODO: Storage item, verify hash?
		}
	}

	return playbookData;
};

const use = async (
	scopeRaw: string
): Promise<PlaybookRawData | undefined> => {
	const [type, name, ...params] = scopeRaw.split(':');
	if (!type)
			throw new Error(`Use '${scopeRaw}'; Missing 'type'`);
	if (!name)
			throw new Error(`Use '${scopeRaw}'; Missing 'name'`);
	
	let p = params;

	// TODO: Lookup existing data, avoid recursion loops
	let playbookData: PlaybookRawData | undefined = {};

	switch (type) {
		case 'playbook':
		case 'scenario':
			const endpointUrl = `${REPO_URL}${type}/raw?name=${name}`;
			YATAB.log(`Use '${scopeRaw}'; Endpoint '${endpointUrl}'`, Log.Verbose);

			const response = await axios.get(
				endpointUrl,
				{
					headers: {
						'Accept': `text/yaml`,
						'YATAB-Schema': YATAB_SCHEMA,
					}
				}
			);

			if (response.status !== 200)
				throw new Error(`Use '${scopeRaw}'; HTTP${response.status}; ${response.statusText}`);

			playbookData = await parsePlaybook(response.data);
			if (!playbookData)
				throw new Error(`Use '${scopeRaw}'; Data is invalid`);

			const p0 = String(p?.shift());

			if (type === 'scenario' || p0 === 'scenario') {
				if (!playbookData?.scenario || playbookData?.scenario?.hasOwnProperty(name))
					throw new Error(`Use '${scopeRaw}'; Scenario data is invalid`);

				const p1 = String(p?.shift());
				const scenarioKey = p0 === 'scenario' ? p1 : (p0 ?? name);
				const scenarioName = p0 === 'scenario' ? `${name}.${p1}` : (p0 ? `${name}.${p0}` : name);
				if (!playbookData?.scenario[scenarioKey])
					throw new Error(`Use '${scopeRaw}'; Scenario key not found '${scenarioKey}'`);

				let data: {
					[index: string]: any,
				} = {
					...playbookData?.scenario[scenarioKey],
				};

				// Apply named parameters to analysis config
				// TODO: Apply params by `idx` against order in `configFields[analysisType]`
				for (let idx in params) {
					if (params[idx].indexOf('=') < 0) continue;
					const [key, value] = params[idx].split('=');
					data[key] = value;
				}

				const newData: PlaybookRawData = {
					scenario: {
						[scenarioName]: {
							...data
						}
					}
				};

				// return newData;
				playbookData = mergePlaybook(playbookData, newData);
			}

			break;

		case 'analysis':
			// TODO: Use keyof on configFields
			const analysisType = String(p?.shift()).toUpperCase();

			if (!configFields[analysisType])
				throw new Error(`Use '${scopeRaw}'; Analysis type is invalid '${analysisType}'`);

			let config = {
				...configFields[analysisType],
			};

			// Apply named parameters to analysis config
			// TODO: Apply params by `idx` against order in `configFields[analysisType]`
			for (let idx in params) {
				if (params[idx].indexOf('=') < 0) continue;
				const [key, value] = params[idx].split('=');
				config[key] = value;
			}

			const newData: PlaybookRawData = {
				analysis: {
					[name]: {
						config: config,
						type: analysisType,
					}
				}
			};

			// return newData;
			playbookData = mergePlaybook(playbookData, newData);

			break;
	}

	return playbookData;
};

(async () => {
	const playbookName = process.argv[2].toLocaleLowerCase();
	const playbookPath = `./playbook/${playbookName}`;
	const playbookActions = `${playbookPath}/${playbookName}.ts`;
	const playbookStateName = `playbookState.${playbookName}`;
	const playbookTemplate = `${playbookPath}/${playbookName}.yml`;
	// console.log(`playbookPath: ${playbookPath}`);

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

	if (!existsSync(playbookTemplate))
		throw new Error(`Playbook '${playbookName}' not found '${playbookTemplate}'`);

	// Attempt to read YAML file
	let playbookContent: string = readFileSync(
		playbookTemplate,
		'utf8',
	);
	// console.log(`playbookContent: ${playbookContent}`);

	if (!playbookContent.length)
		throw new Error(`Playbook is empty '${playbookName}'`);

	// Validate playbook data
	let playbookState = await parsePlaybook(playbookContent) as PlaybookState;
	if (!playbookState)
		throw new Error(`Playbook is invalid '${playbookName}'`);

	// Default to `Memory` storage interface, if none are defined
	if (
		!playbookState.hasOwnProperty('storage')
		|| playbookState.storage === null
	) {
		playbookState.storage = {
			memory: {
				class: 'Memory'
			}
		};
	}

	// Initialize bot
	YATAB.init({

		// Backtesting
		backtest:
			playbookState.hasOwnProperty('backtest')

				// Defined in playbook
				? playbookState.backtest

				// Default to FALSE, if not defined
				: (process.env.BOT_BACKTEST === '1' ? true : false),
		
		// Dry-run
		dryrun:
			playbookState.hasOwnProperty('dryrun')

				// Defined in playbook
				? playbookState.dryrun

				// Default to TRUE, if not defined
				: (process.env?.BOT_DRYRUN === '0' ? false : true),
	});

	// Process YAML components
	for (let typeKey in playbookTypes) {
		const typeObject = playbookTypes[typeKey];
		// console.log(`key: ${typeKey}`);
		// console.log(`${typeObject}`);
	
		if (typeKey in playbookState) {
			// console.log(`typeKey: ${typeKey}`);
			// console.log(playbookState[typeKey]);

			for (let itemName in playbookState[typeKey]) {
				// console.log(`itemName: ${itemName}`);
				// console.log(object);

				let finalItemData: any = {
					...playbookState[typeKey][itemName] as object,

					// Allow custom `name` values, or default to type scope prefixed names
					name: playbookState[typeKey][itemName].name ?? `yatab:playbook:${playbookName}:${typeKey}:${itemName}`
				};
				// console.warn(finalItemData);

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
								itemLookup = YATAB.getItem(playbookCache[key].item[cacheIdx]);

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
									const itemNameTEMP = `${value[valueIdx]}`;
									let itemLookup: any = false;
									let cacheIdx = playbookCache[key].itemIndex.findIndex((x: string) => x === itemNameTEMP);
									if (cacheIdx >= 0)
										itemLookup = YATAB.getItem(playbookCache[key].item[cacheIdx]);

									if (cacheIdx < 0 || itemLookup === false)
										throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced item '${itemNameTEMP}' not found`);
									
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
							itemLookup = YATAB.getItem(playbookCache.asset.item[cacheIdx]);

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
								itemLookup = YATAB.getItem(playbookCache.scenario.item[cacheIdx]);

							if (cacheIdx < 0 || itemLookup === false)
								throw new Error(`Type '${typeKey}' item '${itemName}' key '${key}' referenced scenario '${value[valueIdx][0]}' not found`);
							
							finalValueSet.push(itemLookup);
	
							// Optional `Strategy` lookup
							if (value[valueIdx].length === 2) {
								itemLookup = false;
								cacheIdx = playbookCache.strategy.itemIndex.findIndex((x: string) => x === value[valueIdx][1]);
								if (cacheIdx >= 0)
									itemLookup = YATAB.getItem(playbookCache.strategy.item[cacheIdx]);

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
										value[valueIdx][setIdx][0] = `yatab:playbook:${playbookName}:analysis:${value[valueIdx][setIdx][0]}`;
									}
									// If `valueB` condition field contains a full-stop (.), and isn't prefixed `candle.`, add the `analysis` prefix, for Playbook name prefixing compatibility.
									if (
										typeof value[valueIdx][setIdx][2] === 'string'
										&& value[valueIdx][setIdx][2].lastIndexOf('.') > 0
										&& value[valueIdx][setIdx][2].indexOf('candle.') !== 0
									) {
										value[valueIdx][setIdx][2] = `yatab:playbook:${playbookName}:analysis:${value[valueIdx][setIdx][2]}`;
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
								itemLookup = YATAB.getItem(playbookCache.timeframe.item[cacheIdx]);

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
				let uuid = YATAB.setItem(item);

				playbookCache[typeKey].item.push(uuid);
				playbookCache[typeKey].itemIndex.push(itemName);
			}
		}
	}

	// TEMP: Use first defined storage
	const playbookStore = YATAB.getItem(playbookCache.storage.item[0]) as StorageItem;

	// Load the playbook state
	YATAB.playbook = {
		name: playbookStateName,
		storage: playbookStore,
		lastState: await playbookStore.getItem(playbookStateName),
	};

	// Handle existing playbook state
	// TODO: Implement data validation? Version checks?
	if (YATAB.playbook?.lastState) {

		// Prime chart datasets, if available
		if (YATAB.playbook.lastState.candleIndex?.length) {
			for (let chartIdx in YATAB.playbook.lastState.candleIndex) {
					try {
						// Add dataset to chart
						const chart = YATAB.getItem(YATAB.playbook.lastState.candleIndex[chartIdx]) as ChartItem;
						if (chart && YATAB.playbook.lastState.candle[chartIdx]) {
							// TODO: Set `datasetNextTime` based on tiemframe etc - currently falls back to default `BOT_CHART_DEFAULT_TOTAL_CANDLE`
							chart.updateDataset(YATAB.playbook.lastState.candle[chartIdx]);
							chart.refreshDataset();
						}
					} catch (error) {
						YATAB.log(error, Log.Err);
					}
			}
		}

		// Prime order state, if available
		if (YATAB.playbook.lastState.orderIndex?.length) {
			for (let orderIdx in YATAB.playbook.lastState.orderIndex) {
				try {
					const order = YATAB.getItem(YATAB.playbook.lastState.orderIndex[orderIdx]) as OrderItem;
					let orderData = YATAB.playbook.lastState.order[orderIdx];
					if (order && orderData) {
						// TODO: Implement validation on state `status`, `responseStatus`
						order.update(orderData);
					}
				} catch (error) {
					YATAB.log(error, Log.Err);
				}
			}
		}
	}
	
	// No existing playbook state, default to empty
	else {
		YATAB.playbook.lastState = {
			candle: [],
			candleIndex: [],
			order: [],
			orderIndex: [],
			timeframe: [],
			timeframeIndex: [],
			updateTime: 0
		};
	}

	YATAB.playbook.nextState = {
		...{
			candle: [],
			candleIndex: [],
			order: [],
			orderIndex: [],
			timeframe: [],
			timeframeIndex: [],
			updateTime: 0,
		},
		...YATAB.playbook.lastState
	};

	// Attempt to execute all `Timeframe`
	if (playbookCache.timeframe.item.length === 0)
		YATAB.log(`No timeframes to execute`, Log.Warn);
	else {

		// Execute all timeframes, in order they were found in the playbook
		for (let timeframeName in playbookCache.timeframe.item) {
			try {
				const timeframe = YATAB.getItem(playbookCache.timeframe.item[timeframeName]) as TimeframeItem;

				// Establish interval
				if (timeframe.intervalTime)
					timeframe.activate();

				// Execute the timeframe
				await timeframe.execute();

				// No results, skip
				if (!timeframe.result.length)
					continue;

				// Send a despatch to subscribers, indicating the timeframe has results
				const totalCallbacks = await Subscription.despatch({
					event: SubscriptionEvent.TimeframeResult,

					// The timeframe context
					timeframe: timeframe,
				});
				YATAB.log(`Timeframe '${timeframe.name}'; Subscription.despatch.totalCallbacks: ${totalCallbacks}`, Log.Verbose);

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

						const strategy = YATAB.getItem(timeframe.resultIndex[i]) as StrategyItem;

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
				let index = YATAB.playbook.nextState.timeframeIndex.findIndex(_name => _name === idxIndentifier);
				if (index >= 0) {

					// Add timeframe results, with deduplication
					YATAB.playbook.nextState.timeframe[index] = [
						...new Set([
							...YATAB.playbook.nextState.timeframe[index],
							...timeframeSignal
						])
					];
				} else {
					YATAB.playbook.nextState.timeframe.push(timeframeSignal);
					YATAB.playbook.nextState.timeframeIndex.push(idxIndentifier);
				}
			} catch (error) {
				YATAB.log(error, Log.Err);
			}
		}
	}

	// Persist next state chart data
	if (playbookCache.chart.item.length) {
		for (let chartIdx in playbookCache.chart.itemIndex) {
			const chart = YATAB.getItem(playbookCache.chart.item[chartIdx]) as ChartItem;

			// Add chart data to playbook state
			if (chart.dataset) {
				const idxIndentifier = chart.name ?? chart.uuid;
				let index = YATAB.playbook.nextState.candleIndex.findIndex(_name => _name === idxIndentifier);
				if (index >= 0) {

					// Replace chart candles
					YATAB.playbook.nextState.candle[index] = chart.dataset;
				} else {
					YATAB.playbook.nextState.candle.push(chart.dataset);
					YATAB.playbook.nextState.candleIndex.push(idxIndentifier);
				}
			}
		}
	}

	// Persist next state order data
	if (playbookCache.order.item.length) {
		for (let orderIdx in playbookCache.order.itemIndex) {
			const order = YATAB.getItem(playbookCache.order.item[orderIdx]) as OrderItem;

			const idxIndentifier = order.name ?? order.uuid;
			let index = YATAB.playbook.nextState.orderIndex.findIndex(_name => _name === idxIndentifier);
			if (index >= 0) {

				// Replace order
				YATAB.playbook.nextState.order[index] = order;
			} else {
				YATAB.playbook.nextState.order.push(order);
				YATAB.playbook.nextState.orderIndex.push(idxIndentifier);
			}
		}
	}

	await YATAB.exit();
})();
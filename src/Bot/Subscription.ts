import { v4 as uuidv4 } from 'uuid';
import { Bot, BotEvent, Log } from './Bot';
import { ChartCandleData, ChartItem } from './Chart';
import { OrderItem } from './Order';
import { StrategyItem } from "./Strategy";
import { TimeframeItem } from './Timeframe';

export type SubscriptionCallbackData = (
	subscribe: SubscriptionData,
) => void;

export type SubscriptionData = {
	action?: SubscriptionCallbackData,
	condition: Array<[string, string, string]>,
	chart: ChartItem,
	name?: string,
	order?: OrderItem,
	timeframeAny?: TimeframeItem[],
	timeframeTotal?: TimeframeItem[],
	uuid?: string,
}

export type SubscriptionInterface = {
	item: SubscriptionItem[],
	itemIndex: string[],
	new: (
	   data: SubscriptionData,
	) => void,
};

export class SubscriptionItem implements SubscriptionData {
	action?: SubscriptionCallbackData;
	condition: Array<[string, string, string]>;
	chart: ChartItem;
	name?: string;
	order?: OrderItem;
	timeframeAny?: TimeframeItem[];
	timeframeTotal?: TimeframeItem[];
	uuid: string;

	constructor (
		data: SubscriptionData,
	) {
		if (data.action)
			this.action = data.action;
		this.condition = data.condition;
		this.chart = data.chart;
		if (data.name)
			this.name = data.name;
		if (data.order)
			this.order = data.order;
		if (data.timeframeAny)
			this.timeframeAny = data.timeframeAny;
		if (data.timeframeTotal)
			this.timeframeTotal = data.timeframeTotal;
		this.uuid = data.uuid ?? uuidv4();
	}
}

export const Subscription: SubscriptionInterface = {

	/**
	 * Legacy item storage
	 */
	item: [],

	/**
	 * Legacy item storage index
	 */
	itemIndex: [],

	new (
		data: SubscriptionData,
	): SubscriptionItem {
		let item = new SubscriptionItem(data);
		let uuid = Bot.setItem(item);

		this.item.push(item);
		this.itemIndex.push(uuid);

		return Bot.getItem(uuid);
	}
};
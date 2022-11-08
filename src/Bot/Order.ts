import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { State } from "./State";
import { uuid } from 'uuidv4';
import { PositionItem } from "./Position";

export enum OrderState {
	Closed = 0,
	Open = 1,
};

export enum OrderType {
	MarketBuy = 0,
	MarketSell = 1,
	LimitBuy = 2,
	LimitSell = 3,
	TakeProfit = 4,
	StopLoss = 5,
};

export type OrderData = {
	amount?: string,
	confirmed?: boolean,
	exchange: ExchangeItem,
	live?: boolean,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
	related?: OrderItem,
	state?: OrderState,
	type?: OrderType,
	uuid?: string,
}

export class OrderItem implements OrderData {
	amount?: string = '0';
	confirmed?: boolean = false;
	exchange: ExchangeItem;
	live: boolean = false;
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	related?: OrderItem;
	state?: OrderState = OrderState.Closed;
	type?: OrderType = OrderType.MarketBuy;
	uuid: string;

	constructor (
		data: OrderData,
	) {
		if (data.hasOwnProperty('amount'))
			this.amount = data.amount;
		if (data.hasOwnProperty('confirmed'))
			this.confirmed = data.confirmed ? true : false;
		this.exchange = data.exchange;
		if (data.hasOwnProperty('live'))
			this.live = data.live ? true : false;
		else if (process.env.BOT_LIVE)
			this.live = process.env.BOT_LIVE === '1' ? true : false;
		this.pair = data.pair;
		if (data.hasOwnProperty('position'))
			this.position = data.position;
		if (data.hasOwnProperty('price'))
			this.price = data.price;
		if (data.hasOwnProperty('related'))
			this.related = data.related;
		if (data.hasOwnProperty('state'))
			this.state = data.state;
		if (data.hasOwnProperty('type'))
			this.type = data.type;
		this.uuid = data.uuid ?? uuid();
	}

	execute () {
		// if (this.state )
		// 	this.exchange.open();
	}
}

export const Order = {
	new (
		data: OrderData,
	): OrderItem {
		let item = new OrderItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
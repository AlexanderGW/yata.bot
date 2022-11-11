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
	dryrun?: boolean,
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
	dryrun: boolean = true;
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
		if (data.hasOwnProperty('dryrun'))
			this.dryrun = data.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN)
			this.dryrun = process.env.BOT_DRYRUN === '0' ? false : true;
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
		// 	this.exchange.order(data);
		// Bot.log(`Order '${this.uuid}' executed`);
		// if (this.confirmed === true)
		// 	Bot.log(`Order '${this.uuid}' confirmed`);
	}
}

export const Order = {
	new (
		data: OrderData,
	): OrderItem {
		if (
			data.amount?.substring(data.amount.length - 1) === '%'
			&& !data.hasOwnProperty('position')
		) {
			throw (`Order percentage amounts, require a position`);
		}

		let item = new OrderItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
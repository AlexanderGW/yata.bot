import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { PositionItem } from "./Position";
import { uuid } from 'uuidv4';

export enum OrderDirection {
	Buy = 1,
	Sell = 0,
};

export enum OrderType {
	Market = 1,
	Limit = 2,
	TakeProfit = 4,
	StopLoss = 8,
};

export type OrderData = {
	amount?: string,
	confirmed?: boolean,
	direction?: OrderDirection,
	dryrun?: boolean,
	exchange: ExchangeItem,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
	related?: OrderItem,
	type?: OrderType,
	uuid?: string,
}

export class OrderItem implements OrderData {
	amount?: string = '0';
	confirmed?: boolean = false;
	direction?: OrderDirection = OrderDirection.Buy;
	dryrun: boolean = true;
	exchange: ExchangeItem;
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	related?: OrderItem;
	type?: OrderType = OrderType.Market;
	uuid: string;

	constructor (
		data: OrderData,
	) {
		if (data.hasOwnProperty('amount'))
			this.amount = data.amount;
		if (data.hasOwnProperty('confirmed'))
			this.confirmed = data.confirmed ? true : false;
		this.exchange = data.exchange;
		if (data.hasOwnProperty('direction'))
			this.direction = data.direction;
		if (data.hasOwnProperty('dryrun'))
			this.dryrun = data.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN === '0')
			this.dryrun = false;
		this.pair = data.pair;
		if (data.hasOwnProperty('position'))
			this.position = data.position;
		if (data.hasOwnProperty('price'))
			this.price = data.price;
		if (data.hasOwnProperty('related'))
			this.related = data.related;
		if (data.hasOwnProperty('type'))
			this.type = data.type;
		this.uuid = data.uuid ?? uuid();
	}

	execute () {
		if (
			!this.amount
			|| this.amount === '0'
		)
			throw (`Order '${this.uuid}' amount is empty`);

		// if (this.direction )
		// 	this.exchange.order(data);
		Bot.log(`Order '${this.uuid}' executed`);
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
		)
			throw (`Order percentage amounts, require a position`);

		let item = new OrderItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
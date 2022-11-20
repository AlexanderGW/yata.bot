import { Bot } from "./Bot";
import { ExchangeItem } from "./Exchange";
import { PairItem } from "./Pair";
import { PositionItem } from "./Position";
import { uuid } from 'uuidv4';

export enum OrderSide {
	Buy = 1,
	Sell = 0,
};

export enum OrderStatus {
	Cancelled = 0,
	Open = 1,
	Filled = 2,
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
	dryrun?: boolean,
	exchange: ExchangeItem,
	filledAmount?: string,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
	related?: OrderItem,
	side?: OrderSide,
	status?: OrderStatus,
	type?: OrderType,
	uuid?: string,
}

export class OrderItem implements OrderData {
	amount?: string = '0';
	confirmed?: boolean = false;
	dryrun: boolean = true;
	exchange: ExchangeItem;
	filledAmount?: string = '0';
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	related?: OrderItem;
	side?: OrderSide = OrderSide.Buy;
	status?: OrderStatus = OrderStatus.Open;
	type?: OrderType = OrderType.Market;
	uuid: string;

	constructor (
		data: OrderData,
	) {
		if (data.hasOwnProperty('amount'))
			this.amount = data.amount;
		if (data.hasOwnProperty('confirmed'))
			this.confirmed = data.confirmed ? true : false;
		if (data.hasOwnProperty('dryrun'))
			this.dryrun = data.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN === '0')
			this.dryrun = false;
		this.exchange = data.exchange;
		if (data.hasOwnProperty('filledAmount'))
			this.filledAmount = data.filledAmount;
		this.pair = data.pair;
		if (data.hasOwnProperty('position'))
			this.position = data.position;
		if (data.hasOwnProperty('price'))
			this.price = data.price;
		if (data.hasOwnProperty('related'))
			this.related = data.related;
		if (data.hasOwnProperty('side'))
			this.side = data.side;
		if (data.hasOwnProperty('status'))
		this.status = data.status;
		if (data.hasOwnProperty('type'))
			this.type = data.type;
		this.uuid = data.uuid ?? uuid();
	}

	async execute () {
		if (
			!this.amount
			|| this.amount === '0'
		)
			throw (`Order '${this.uuid}' amount is empty`);

		// if (this.side )
		// 	this.exchange.order(data);
		Bot.log(`Order '${this.uuid}' ${OrderSide.Buy ? 'buy' : 'sell'} (${this.type}) '${this.exchange.name}:${this.pair.a.symbol}X${this.pair.b.symbol}' for ${this.amount} at ${this.price} placed`);
		
		let result: boolean = false;

		// Not a test, send to exchange
		if (this.dryrun === false) {
			Bot.log(`Order '${this.uuid}' execute on '${this.exchange.uuid}'`);
			result = await this.exchange.order(this);
		}

		// Dry-run testing
		else {
			Bot.log(`Dry-run: Order '${this.uuid}' execute on '${this.exchange.uuid}'`);
			result = true;
		}
		
		if (result === true) {
			this.confirmed = true;
			Bot.log(`Order '${this.uuid}' confirmed`);
		}
	}
}

export const Order = {
	new (
		data: OrderData,
	): OrderItem {

		// A percentage of a position
		if (data.amount?.substring(data.amount.length - 1) === '%') {
			if (!data.hasOwnProperty('position'))
				throw (`Order percentage amounts, require a position`);

			const amountPercent = Number.parseFloat(data.amount.substring(0, data.amount.length - 1));
			let positionAmount = '0';
			if (data.position?.amount)
				positionAmount = data.position.amount;
			data.amount = ((parseFloat(positionAmount) / 100) * amountPercent).toString();
		}
		
		let item = new OrderItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
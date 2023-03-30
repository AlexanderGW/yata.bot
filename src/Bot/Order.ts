import { Bot } from "./Bot";
import { PairItem } from "./Pair";
import { PositionItem } from "./Position";
import { v4 as uuidv4 } from 'uuid';

export enum OrderAction {
	Cancel = 0,
	Create = 1,
	Edit = 2,
}

export enum OrderSide {
	Buy = 1,
	Sell = 0,
};

export enum OrderStatus {
	Cancelled = 0,
	Open = 1,
};

export enum OrderType {
	Market = 1,
	Limit = 2,
	TakeProfit = 4,
	StopLoss = 8,
};

export type OrderData = {
	confirmed?: boolean,
	dryrun?: boolean,
	name?: string,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
	quantity?: string,
	quantityFilled?: string,
	referenceId?: number | string;
	related?: OrderItem,
	side?: OrderSide,
	status?: OrderStatus,
	stopPrice?: string,
	transactionId?: string[],
	type?: OrderType,
	uuid?: string,
}

export class OrderItem implements OrderData {
	confirmed?: boolean = false;
	dryrun: boolean = true;
	name?: string;
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	quantity?: string = '0';
	quantityFilled?: string = '0';
	referenceId?: number = 0;
	related?: OrderItem;
	side?: OrderSide = OrderSide.Buy;
	status?: OrderStatus = OrderStatus.Open;
	stopPrice?: string = '0';
	transactionId?: string[] = [];
	type?: OrderType = OrderType.Market;
	uuid: string;

	constructor (
		_: OrderData,
	) {
		if (_.hasOwnProperty('confirmed'))
			this.confirmed = _.confirmed ? true : false;
		if (_.hasOwnProperty('dryrun'))
			this.dryrun = _.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN === '0')
			this.dryrun = false;
		if (_.name)
			this.name = _.name;
		this.pair = _.pair;
		if (_.hasOwnProperty('position'))
			this.position = _.position;
		if (_.hasOwnProperty('price'))
			this.price = _.price;
		if (_.hasOwnProperty('quantity'))
		this.quantity = _.quantity;
		if (_.hasOwnProperty('quantityFilled'))
			this.quantityFilled = _.quantityFilled;
		if (_.hasOwnProperty('related'))
			this.related = _.related;
		if (_.hasOwnProperty('side'))
			this.side = _.side;
		if (_.hasOwnProperty('status'))
		this.status = _.status;
		if (_.hasOwnProperty('stopPrice'))
			this.stopPrice = _.stopPrice;
		if (_.hasOwnProperty('transactionId'))
			this.transactionId = _.transactionId;
		if (_.hasOwnProperty('type'))
			this.type = _.type;
		this.uuid = _.uuid ?? uuidv4();

		// TODO: Sync exchange order, position etc
	}

	isFilled() {
		return this.quantity === this.quantityFilled;
	}

	async execute (
		action: OrderAction,
	) {
		if (
			!this.quantity
			|| this.quantity === '0'
		)
			throw (`Order '${this.name}' quantity is empty`);

		// Build log message
		let logParts: string[] = [];

		if (this.dryrun)
			logParts.push('Dry-run:');

		logParts.push(`Order '${this.name}'`);
		logParts.push(`${this.pair.exchange.name}:${this.pair.a.symbol}-${this.pair.b.symbol};`);
		logParts.push(`action: ${action};`);
		logParts.push(`type: ${this.type};`);
		logParts.push(`side: ${this.side};`);
		logParts.push(`quantity: ${this.quantity};`);
		logParts.push(`price: ${this.price}`);
		// logParts.push(`stopPrice: ${this.stopPrice}`);

		Bot.log(logParts.join(' '));

		let orderResponse: OrderItem = this;
		let logMessage: string = '';
				
		// Dry-run testing
		if (this.dryrun) {
			logMessage = `Dry-run:`;
		}

		switch (action) {
			case OrderAction.Cancel : {
				Bot.log(`${logMessage} Order '${this.name}' cancel on '${this.pair.exchange.name}'`);
				orderResponse = await this.pair.exchange.cancelOrder(this);

				break;
			}

			case OrderAction.Create : {
				Bot.log(`${logMessage} Order '${this.name}' create on '${this.pair.exchange.name}'`);
				orderResponse = await this.pair.exchange.createOrder(this);

				break;
			}

			case OrderAction.Edit : {
				Bot.log(`${logMessage} Order '${this.name}' edited on '${this.pair.exchange.name}'`);
				orderResponse = await this.pair.exchange.editOrder(this);

				break;
			}
		}
		
		// Order response indicates confirmation
		if (orderResponse.confirmed === true) {
			this.confirmed = true;
			logMessage = `Order '${this.name}' confirmed on '${this.pair.exchange.name}'`;
				
			// Dry-run testing
			if (this.dryrun) {
				logMessage = `Dry-run: ${logMessage}`;
			}

			Bot.log(logMessage);
		}

		return orderResponse;
	}
}

export const Order = {
	new (
		_: OrderData,
	): OrderItem {

		// A percentage of a position
		if (_.quantity?.substring(_.quantity.length - 1) === '%') {
			if (!_.hasOwnProperty('position'))
				throw (`Order percentage quantities, require a position`);

			const quantityPercent = Number.parseFloat(_.quantity.substring(0, _.quantity.length - 1));
			let positionAmount = '0';
			if (_.position?.quantity)
				positionAmount = _.position.quantity;
			_.quantity = ((parseFloat(positionAmount) / 100) * quantityPercent).toString();
		}
		
		let item = new OrderItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
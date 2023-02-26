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
	quantity?: string,
	confirmed?: boolean,
	dryrun?: boolean,
	filledAmount?: string,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
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
	quantity?: string = '0';
	confirmed?: boolean = false;
	dryrun: boolean = true;
	filledAmount?: string = '0';
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	referenceId?: number = 0;
	related?: OrderItem;
	side?: OrderSide = OrderSide.Buy;
	status?: OrderStatus = OrderStatus.Open;
	stopPrice?: string = '0';
	transactionId?: string[] = [];
	type?: OrderType = OrderType.Market;
	uuid: string;

	constructor (
		data: OrderData,
	) {
		if (data.hasOwnProperty('quantity'))
			this.quantity = data.quantity;
		if (data.hasOwnProperty('confirmed'))
			this.confirmed = data.confirmed ? true : false;
		if (data.hasOwnProperty('dryrun'))
			this.dryrun = data.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN === '0')
			this.dryrun = false;
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
		if (data.hasOwnProperty('stopPrice'))
			this.stopPrice = data.stopPrice;
		if (data.hasOwnProperty('transactionId'))
			this.transactionId = data.transactionId;
		if (data.hasOwnProperty('type'))
			this.type = data.type;
		this.uuid = data.uuid ?? uuidv4();

		// TODO: Sync exchange order, position etc
	}

	isFilled() {
		return this.quantity === this.filledAmount;
	}

	async execute (
		action: OrderAction,
	) {
		if (
			!this.quantity
			|| this.quantity === '0'
		)
			throw (`Order '${this.uuid}' quantity is empty`);

		// Build log message
		let logParts: string[] = [];

		if (this.dryrun)
			logParts.push('Dry-run:');

		logParts.push(`Order '${this.uuid}'`);
		logParts.push(`${this.pair.exchange.name}:${this.pair.a.symbol}X${this.pair.b.symbol};`);
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
				Bot.log(`${logMessage} Order '${this.uuid}' cancel on '${this.pair.exchange.uuid}'`);
				orderResponse = await this.pair.exchange.cancelOrder(this);

				break;
			}

			case OrderAction.Create : {
				Bot.log(`${logMessage} Order '${this.uuid}' create on '${this.pair.exchange.uuid}'`);
				orderResponse = await this.pair.exchange.createOrder(this);

				break;
			}

			case OrderAction.Edit : {
				Bot.log(`${logMessage} Order '${this.uuid}' edited on '${this.pair.exchange.uuid}'`);
				orderResponse = await this.pair.exchange.editOrder(this);

				break;
			}
		}
		
		// Order response indicates confirmation
		if (orderResponse.confirmed === true) {
			this.confirmed = true;
			logMessage = `Order '${this.uuid}' confirmed on '${this.pair.exchange.uuid}'`;
				
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
		data: OrderData,
	): OrderItem {

		// A percentage of a position
		if (data.quantity?.substring(data.quantity.length - 1) === '%') {
			if (!data.hasOwnProperty('position'))
				throw (`Order percentage quantitys, require a position`);

			const quantityPercent = Number.parseFloat(data.quantity.substring(0, data.quantity.length - 1));
			let positionAmount = '0';
			if (data.position?.quantity)
				positionAmount = data.position.quantity;
			data.quantity = ((parseFloat(positionAmount) / 100) * quantityPercent).toString();
		}
		
		let item = new OrderItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};
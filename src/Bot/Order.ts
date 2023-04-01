import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";
import { PositionItem } from "./Position";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";

export enum OrderAction {
	Close = 'Close',
	Edit = 'Edit',
	None = 'None',
	Open = 'Open',
	Sync = 'Sync',
}

export enum OrderSide {
	Buy = 'Buy',
	Sell = 'Sell',
};

export enum OrderStatus {
	Close = 'Close',
	Edit = 'Edit',
	Error = 'Error',
	Open = 'Open',
	Pending = 'Pending',
	Unknown = 'Unknown',
};

export enum OrderType {
	Market = 'Market',
	Limit = 'Limit',
	TakeProfit = 'TakeProfit',
	StopLoss = 'StopLoss',
};

export type OrderData = {
	confirmStatus?: OrderStatus,
	confirmTime?: number,
	dryrun?: boolean,
	exchange?: ExchangeItem,
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
	updateTime?: number,
	uuid?: string,
}

export class OrderItem implements OrderData {
	confirmStatus: OrderStatus = OrderStatus.Unknown;
	confirmTime: number = 0;
	dryrun: boolean = true;
	exchange?: ExchangeItem;
	name?: string;
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	quantity?: string = '0';
	quantityFilled?: string = '0';
	referenceId?: number = 0;
	related?: OrderItem;
	side?: OrderSide = OrderSide.Buy;
	status: OrderStatus = OrderStatus.Unknown;
	stopPrice?: string = '0';
	transactionId: string[] = [];
	type?: OrderType = OrderType.Market;
	updateTime: number = 0;
	uuid: string;

	constructor (
		_: OrderData,
	) {
		if (_.confirmTime)
			this.confirmTime = _.confirmTime;
		if (_.hasOwnProperty('dryrun'))
			this.dryrun = _.dryrun ? true : false;
		else if (process.env.BOT_DRYRUN === '0')
			this.dryrun = false;
		if (_.name)
			this.name = _.name;
		this.pair = _.pair;
		if (_.hasOwnProperty('position'))
			this.position = _.position;
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
		if (_.status)
			this.status = _.status;
		if (_.hasOwnProperty('stopPrice'))
			this.stopPrice = _.stopPrice;
		if (_.transactionId)
			this.transactionId = _.transactionId;
		if (_.hasOwnProperty('type'))
			this.type = _.type;
		if (_.updateTime)
			this.updateTime = _.updateTime;
		this.uuid = _.uuid ?? uuidv4();

		// TODO: Sync exchange order, position etc
	}

	isFilled() {
		return this.quantity === this.quantityFilled;
	}

	nextAction () {

		// Confirmed status does not match status, test for next action
		if (this.confirmStatus !== this.status) {

			// Has no transaction ID
			if (
				!this.transactionId.length
			) {
				switch (this.status) {
					case OrderStatus.Open:
						return OrderAction.Open;
				}
			}
			
			// Order has a transaction ID
			else {
				switch (this.status) {
					case OrderStatus.Close:
						return OrderAction.Close;
					case OrderStatus.Edit:
						return OrderAction.Edit;
					default:
						return OrderAction.Sync;
				}
			}
		}

		return OrderAction.None;
	}

	async execute () {
		if (
			!this.quantity
			|| this.quantity === '0'
		)
			throw (`Order '${this.name}'; Requires a non-zero quantity`);

		if (
			this.type === OrderType.Limit
			&& Number.parseFloat(this.price as string) === 0
		)
			throw (`Order '${this.name}'; Defined as a limit, requires a non-zero price`);

		// Build log message
		let logParts: string[] = [];

		if (this.dryrun)
			logParts.push('DRYRUN');

		logParts.push(`Order '${this.name}'`);
		logParts.push(`${this.pair.exchange.name}:${this.pair.a.symbol}-${this.pair.b.symbol}`);
		logParts.push(`State: ${this.status};`);
		logParts.push(`Type '${this.type}'`);
		logParts.push(`Side '${this.side}'`);
		logParts.push(`Qty '${this.quantity}'`);
		logParts.push(`Price '${this.price}'`);
		// logParts.push(`stopPrice: ${this.stopPrice}`);

		Bot.log(logParts.join('; '));

		let orderResponse: OrderItem = this;

		let logLine: string = '';
				
		// Dry-run testing
		if (this.dryrun)
			logLine = `DRYRUN`;

		logLine = `Order '${this.name}'; Exchange '${this.pair.exchange.name}'`;

		// Determine next action with exchange
		const action = this.nextAction();

		switch (action) {
			case OrderAction.Close:
				Bot.log(`${logLine}; Close`);
				orderResponse = await this.pair.exchange.closeOrder(this);
				break;

			case OrderAction.Open:
				Bot.log(`${logLine}; Open`);
				orderResponse = await this.pair.exchange.openOrder(this);
				break;

			case OrderAction.Edit:
				Bot.log(`${logLine}; Edit`);
				orderResponse = await this.pair.exchange.editOrder(this);
				break;

			case OrderAction.Sync:
				Bot.log(`${logLine}; Sync`);
				orderResponse = await this.pair.exchange.syncOrder(this);
				break;

			default:
				Bot.log(`${logLine}; None`, Log.Verbose);
				break;
		}
		
		// Order response contains higher confirmation time
		if (orderResponse.confirmTime >= this.confirmTime) {
			Bot.log(`${logLine}; Confirmed`);

			// TODO: Log changed order values
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
	},

	// sync (): void {
	// 	for (let itemIdx in Bot.item) {
	// 		const item = Bot.item[itemIdx];
	// 		if (item instanceof OrderItem) {
	// 			item.execute();
	// 		}
	// 	}
	// },
};
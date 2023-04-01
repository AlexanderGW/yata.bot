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
	Get = 'Get',
}

export enum OrderSide {
	Buy = 'Buy',
	Sell = 'Sell',
	Unknown = 'Unknown',
};

export enum OrderStatus {
	Cancel = 'Cancel',
	Close = 'Close',
	Edit = 'Edit',
	Error = 'Error',
	Expired = 'Expired',
	Open = 'Open',
	Pending = 'Pending',
	Unknown = 'Unknown',
};

export enum OrderType {
	Market = 'Market',
	Limit = 'Limit',
	TakeProfit = 'TakeProfit',
	StopLoss = 'StopLoss',
	Unknown = 'Unknown',
};

export type OrderData = {
	closeTime?: number,
	dryrun?: boolean,
	expireTime?: number,
	limitPrice?: string,
	name?: string,
	openTime?: number,
	pair: PairItem,
	position?: PositionItem,
	price?: string,
	quantity?: string,
	quantityFilled?: string,
	referenceId?: number | string;
	related?: OrderItem,
	responseStatus?: OrderStatus,
	responseTime?: number,
	side?: OrderSide,
	startTime?: number,
	status?: OrderStatus,
	stopPrice?: string,
	transactionId?: string[],
	type?: OrderType,
	updateTime?: number,
	uuid?: string,
}

export type OrderExchangeData = {
	closeTime?: number,
	expireTime?: number,
	limitPrice?: string,
	openTime?: number,
	price?: string,
	quantity?: string,
	quantityFilled?: string,
	referenceId?: number | string,
	status?: OrderStatus,
	responseTime?: number,
	side?: OrderSide,
	startTime?: number,
	stopPrice?: string,
	transactionId?: string[],
	type?: OrderType,
}

export class OrderItem implements OrderData {
	closeTime?: number = 0;
	dryrun: boolean = true;
	expireTime?: number = 0;
	limitPrice?: string = '';
	name?: string;
	openTime?: number = 0;
	pair: PairItem;
	position?: PositionItem;
	price?: string = '0';
	quantity?: string = '0';
	quantityFilled?: string = '0';
	referenceId?: number = 0;
	related?: OrderItem;
	responseStatus: OrderStatus = OrderStatus.Unknown;
	responseTime: number = 0;
	side?: OrderSide = OrderSide.Buy;
	startTime?: number = 0;
	status: OrderStatus = OrderStatus.Unknown;
	stopPrice?: string = '0';
	transactionId: string[] = [];
	type?: OrderType = OrderType.Market;
	updateTime: number = 0;
	uuid: string;

	constructor (
		_: OrderData,
	) {
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
		if (_.responseTime)
			this.responseTime = _.responseTime;
		if (_.hasOwnProperty('side'))
			this.side = _.side;
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

		// TODO: Get exchange order, position etc
	}

	isFilled() {
		return this.quantity === this.quantityFilled;
	}

	nextAction () {

		// Confirmed status does not match status, test for next action
		if (

			// Unconfirmed
			!this.responseTime

			// Unknown state
			|| this.status === OrderStatus.Unknown

			// Status mismatch
			|| this.responseStatus !== this.status
		) {

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
						return OrderAction.Get;
				}
			}
		}

		return OrderAction.None;
	}

	async execute (
		_?: OrderAction
	) {
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

		let orderResponse: OrderExchangeData | undefined;
		
		// Build log message
		let logParts: string[] = [];
		let logType: Log = Log.Info;

		logParts.push(`Order '${this.name}'`);
		logParts.push(`Pair '${this.pair.name}'`);

		// Determine next action with exchange
		const action = _ ?? this.nextAction();

		switch (action) {
			case OrderAction.Close:
				logParts.push(`Close`);
				orderResponse = await this.pair.exchange.closeOrder(this);
				break;

			case OrderAction.Open:
				logParts.push(`Open`);
				orderResponse = await this.pair.exchange.openOrder(this);
				break;

			case OrderAction.Edit:
				logParts.push(`Edit`);
				orderResponse = await this.pair.exchange.editOrder(this);
				break;

			case OrderAction.Get:
				logParts.push(`Get`);
				orderResponse = await this.pair.exchange.getOrder(this);
				break;

			default:
				logParts.push(`None`);
				logType = Log.Verbose;
				break;
		}

		if (orderResponse) {

			// Order response contains higher confirmation time
			if (
				orderResponse.responseTime
				&& orderResponse.responseTime > this.responseTime
			) {
				logParts.push(`Confirmed '${orderResponse.status},${orderResponse.responseTime}'`);
			}

			// Log order response values
			logParts.push(`Type '${this.type}'`);
			if (
				orderResponse.price
				&& Number.parseFloat(orderResponse.price) > 0
			)
				logParts.push(`Price '${orderResponse.price}'`);
			logParts.push(`Side '${this.side}'`);
			if (
				orderResponse.stopPrice
				&& Number.parseFloat(orderResponse.stopPrice) > 0
			)
				logParts.push(`Stop '${orderResponse.stopPrice}'`);
			logParts.push(`Qty '${orderResponse.quantity ?? this.quantity}'`);
		}

		// Is a dry-run order
		if (this.dryrun)
			logParts.unshift('DRYRUN');

		Bot.log(logParts.join('; '), logType);

		return orderResponse;
	}

	update (
		_: OrderExchangeData
	) {
		
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
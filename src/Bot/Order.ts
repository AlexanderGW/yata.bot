import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";
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
	[index: string]: any,
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
	[index: string]: any,
	closeTime: number = 0;
	dryrun: boolean = true;
	expireTime: number = 0;
	limitPrice: string = '0';
	name?: string;
	openTime?: number = 0;
	pair: PairItem;
	price: string = '0';
	quantity: string = '0';
	quantityFilled: string = '0';
	referenceId: number = 0;
	related?: OrderItem;
	responseStatus: OrderStatus = OrderStatus.Unknown;
	responseTime: number = 0;
	side: OrderSide = OrderSide.Buy;
	startTime: number = 0;
	status: OrderStatus = OrderStatus.Unknown;
	stopPrice: string = '0';
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
		if (_.price)
			this.price = _.price;
		if (_.quantity)
		this.quantity = _.quantity;
		if (_.quantityFilled)
			this.quantityFilled = _.quantityFilled;
		if (_.related)
			this.related = _.related;
		if (_.responseTime)
			this.responseTime = _.responseTime;
		if (_.side)
			this.side = _.side;
		if (_.status)
			this.status = _.status;
		if (_.stopPrice)
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

		// Response status does not match status, test for next action
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
			(
				!this.quantity
				|| Number.parseFloat(this.quantity) === 0
			)
			&& this.status === OrderStatus.Open
			&& !this.transactionId.length
		)
			throw (`Order '${this.name}'; Requires a non-zero quantity`);

		if (
			this.type !== OrderType.Market
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

		console.log(`action`);
		console.log(action);

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
		console.log(`_`);
		console.log(_);
		for (let key in _) {
			if (this.hasOwnProperty(key)) {
				if (key === 'status')
					this.responseStatus = _.status ?? OrderStatus.Unknown;
				else
					this[key] = _[key];
			}
		}
	}
}

export const Order = {
	async new (
		_: OrderData,
	): Promise<OrderItem> {
		const assetASymbol = _.pair.a.symbol;
		const assetBSymbol = _.pair.b.symbol;
		const pairTicker = `${assetASymbol}-${assetBSymbol}`;

		const pairTickerIndex = _.pair.exchange.tickerIndex.indexOf(pairTicker);
		if (pairTickerIndex < 0)
			throw (`Exchange '${_.pair.exchange.name}'; No ticker information for '${pairTicker}'`);

		let assetAPrice = '0';
		switch (_.type) {
			case OrderType.Limit:
			case OrderType.StopLoss:
			case OrderType.TakeProfit:
				assetAPrice = _.price as string;
				break;
			default:
				assetAPrice = _.pair.exchange.ticker[pairTickerIndex].ask;
		}
		const assetAPriceFloat = Number.parseFloat(assetAPrice);

		console.log(`assetAPriceFloat`);
		console.log(assetAPriceFloat);

		let assetABalanceIndex = _.pair.exchange.balanceIndex.indexOf(assetASymbol);
		if (assetABalanceIndex < 0) {
			await _.pair.exchange.getBalances();
			assetABalanceIndex = _.pair.exchange.balanceIndex.indexOf(assetASymbol);
			if (assetABalanceIndex < 0)
				throw (`Order '${_.name}'; Asset '${_.pair.a.name}'; Quantity percentage values require balance information`);
		}

		const assetABalance = _.pair.exchange.balance[assetABalanceIndex];
		if (_.side === OrderSide.Sell && Number.parseFloat(assetABalance) === 0)
			throw (`Order '${_.name}'; Asset '${_.pair.a.name}'; Quantity percentage values require balance greater than zero`);

		console.log(`assetABalance`);
		console.log(assetABalance);

		let assetBBalanceIndex = _.pair.exchange.balanceIndex.indexOf(assetBSymbol);
		if (assetBBalanceIndex < 0)
			throw (`Order '${_.name}'; Asset '${_.pair.b.name}'; Quantity percentage values require balance information`);

		const assetBBalance = _.pair.exchange.balance[assetBBalanceIndex];
		if (_.side === OrderSide.Buy && Number.parseFloat(assetBBalance) === 0)
			throw (`Order '${_.name}'; Asset '${_.pair.b.name}'; Quantity percentage values require balance greater than zero`);

		console.log(`assetBBalance`);
		console.log(assetBBalance);

		console.log(`quantityBefore`);
		console.log(_.quantity);
			
		// A percentage of a pair asset amount
		if (_.quantity?.substring(_.quantity.length - 1) === '%') {
			const quantityPercent = Number.parseFloat(_.quantity.substring(0, _.quantity.length - 1));

			// Buy side order
			if (_.side === OrderSide.Buy) {
				const assetBQuantity = (parseFloat(assetBBalance) / 100) * quantityPercent;
				const assetAQuantity = assetBQuantity / assetAPriceFloat;
				_.quantity = assetAQuantity.toString();
			}
			
			// Sell side order
			else if (_.side === OrderSide.Sell) {
				const assetAQuantity = (parseFloat(assetABalance) / 100) * quantityPercent;
				_.quantity = assetAQuantity.toString();
			}
		}

		console.log(`order`);
		console.log(_);

		// TODO: Check range boundaries, price min/max etc

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
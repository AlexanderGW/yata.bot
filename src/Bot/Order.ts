import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";
import { isPercentage, toFixedNumber } from "./Helper";

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
	[index: string]: any,
	closeTime?: number,
	dryrun?: boolean,
	expireTime?: number,
	inSync?: boolean,
	limitPrice?: string, // for stop limit triggers?
	name?: string,
	openTime?: number,
	pair: PairItem,
	price?: string,
	priceActual?: number,
	quantity?: string,
	quantityActual?: number,
	quantityFilled?: number,
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

// TODO: Consolidate with `OrderData`? - Split out?
// MOVE TO `ExchangeOrderData` ?
export type OrderExchangeData = {
	[index: string]: any,
	closeTime?: number,
	expireTime?: number,
	limitPrice?: string,
	openTime?: number,
	price?: string,
	quantity?: string,
	quantityFilled?: number,
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
	priceActual?: number = 0;
	quantity: string = '0';
	quantityFilled: number = 0;
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
		this.update(_);
		this.pair = _.pair;
		this.uuid = _.uuid ?? uuidv4();

		// TODO: Get exchange order, position etc
		
	}

	isFilled() {
		return this.quantityActual === this.quantityFilled;
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

	async setPrice (
		price: string,
	) {
		try {
			let priceActual: number = 0;

			const ticker = await this.pair.exchange.getTicker(this.pair);

			if (isPercentage(price)) {
				const pricePercent = Number.parseFloat(
					price.substring(0, price.length - 1)
				);

				const tickerPrice = Number(ticker?.price);
				if (!tickerPrice)
					throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Price is zero`);

				const priceChange = (tickerPrice / 100) * pricePercent;
				priceActual = tickerPrice + priceChange;
			} else
				priceActual = Number.parseFloat(price);

			if (priceActual <= 0)
				throw new Error(`Order '${this.name}'; Price is zero`);

			// Prune any extraneous decimals
			priceActual = toFixedNumber(
				priceActual,
				Number(ticker?.decimals)
			);

			Bot.log(`Order '${this.name}'; Actual price: ${priceActual}`);

			this.price = price;
			this.priceActual = priceActual;

			return true;
		} catch (error) {
			Bot.log(error, Log.Err);

			return false;
		}
	}

	async setQuantity (
		quantity: string,
	) {
		try {
			let quantityActual: number = 0;

			const ticker = await this.pair.exchange.getTicker(this.pair);

			if (isPercentage(quantity)) {
				const quantityPercent = Number.parseFloat(
					quantity.substring(0, quantity.length - 1)
				);

				switch (this.side) {
					case OrderSide.Buy:
						const assetASymbol = this.pair.a.symbol;
						const balanceA = await this.pair.exchange.getBalance(assetASymbol);

						// Balance is zero
						if (!balanceA?.available || balanceA.available <= 0) {
							// throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Balance is zero`);
							const assetBSymbol = this.pair.b.symbol;
							const balanceB = await this.pair.exchange.getBalance(assetBSymbol);

							if (!balanceB?.available || balanceB.available <= 0)
								throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.b.name}'; Balance is zero`);

							quantityActual = (balanceB.available / 100) * quantityPercent;
							break;
						}

						quantityActual = (balanceA.available / 100) * quantityPercent;

						break;
					case OrderSide.Sell:
						if (!this.quantityActual) {
							// TODO: Get order
							const orderResponse = await this.pair.exchange.api?.getOrder(this);
							
						}
						quantityActual = (this.quantityActual / 100) * quantityPercent;
						
						break;
				}
			} else
				quantityActual = Number.parseFloat(quantity);

			if (!quantityActual || quantityActual <= 0)
				throw new Error(`Order '${this.name}'; Quantity is zero`);

			// Prune any extraneous decimals
			quantityActual = toFixedNumber(
				quantityActual,
				Number(ticker?.decimals),
			);

			Bot.log(`Order '${this.name}'; Actual quantity: ${quantityActual}`);

			this.quantity = quantity;
			this.quantityActual = quantityActual;

			return true;
		} catch (error) {
			Bot.log(error, Log.Err);
			
			return false;
		}
	}







	async execute (
		_?: OrderAction
	) {

		// Check quantity
		const resultQuantity = await this.setQuantity(this.quantity);
		// Bot.log(`resultQuantity`);
		// Bot.log(resultQuantity);
		if (!resultQuantity)
			throw new Error(`Order '${this.name}'; No quantity defined`);

		// Check price against type
		switch (this.type) {
			case OrderType.Limit:
			case OrderType.StopLoss:
			case OrderType.TakeProfit:
				const priceResult = await this.setPrice(this.price);
				if (!priceResult)
					throw new Error(`Order '${this.name}'; Price required for this type`);
		}






		// if (
		// 	(
		// 		!this.quantity
		// 		|| Number.parseFloat(this.quantity) === 0
		// 	)
		// 	&& this.status === OrderStatus.Open
		// 	&& !this.transactionId.length
		// )
		// 	throw new Error(`Order '${this.name}'; Requires a non-zero quantity`);

		// if (
		// 	this.type !== OrderType.Market
		// 	&& Number.parseFloat(this.price as string) === 0
		// )
		// 	throw new Error(`Order '${this.name}'; Defined as a limit, requires a non-zero price`);

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
				orderResponse = await this.pair.exchange.api?.closeOrder(this);
				break;

			case OrderAction.Open:
				logParts.push(`Open`);
				orderResponse = await this.pair.exchange.api?.openOrder(this);
				break;

			case OrderAction.Edit:
				logParts.push(`Edit`);
				orderResponse = await this.pair.exchange.api?.editOrder(this);
				break;

			case OrderAction.Get:
				logParts.push(`Get`);
				orderResponse = await this.pair.exchange.api?.getOrder(this);
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
		_: OrderData
	) {
		this.dryrun = _.dryrun ?? Bot.dryrun;
		if (_.name)
			this.name = _.name;
		if (_.pair)
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
		if (this.type)
			this.type = _.type;
		if (_.updateTime)
			this.updateTime = _.updateTime;
		// console.log(`_`);
		// console.log(_);


		// for (let key in _) {
		// 	if (this.hasOwnProperty(key)) {
		// 		// if (key === 'status')
		// 		// 	this.responseStatus = _.status ?? OrderStatus.Unknown;
		// 		// else if (key === 'price') // await this.setPrice(_.price as string);
		// 		// 	this.price = _.price;
		// 		// else if (key === 'quantity') // await this.setQuantity(_.quantity as string);
		// 		// 	this.quantity = _.quantity;
		// 		// else
		// 		// 	this[key] = _[key];
		// 	}
		// }
	}
}

export const Order = {
	async new (
		_: OrderData,
	): Promise<OrderItem> {
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
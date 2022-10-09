import { Exchange, ExchangeData, ExchangeInterface } from '../Exchange';

export class Kraken extends Exchange implements ExchangeInterface {
	constructor (
		data: ExchangeData,
	) {
		super(data);

		const KrakenClient = require('kraken-api');
		this.api = new KrakenClient(data.key, data.secret);
	}

	async request (
		data: object
	) {
		return '';
	}

	getPrimer () {}

	getLatestTicker () {}
}
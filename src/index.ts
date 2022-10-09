class Exchange {
	
}

class Pair {

}

class Position {
	constructor (
		exchangeId,
		pairId,
	) {
		this.exchangeId = exchangeId;
		this.pairId = pairId;
	}
}


let bot = {
	exchange: [],
	pair: [],
	position: [],
};
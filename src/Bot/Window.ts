import { uuid } from 'uuidv4';
import { Strategy } from "./Strategy";

export type WindowData = {
	active?: boolean,
	lastRun?: number,
	name?: string,
	strategy: Array<Strategy>,
	pollTime?: number,
}

export class Window {
	active: boolean;
	lastRun: number;
	name?: string;
	pollTime: number;
	strategy: Array<Strategy>;
	uuid: string; 

	constructor (
		data: WindowData,
	) {
		if (data.active)
			this.active = data.active ? true : true;
		else
			this.active = true;
		if (data.lastRun)
			this.lastRun = data.lastRun > 0 ? data.lastRun : 0;
		else
			this.lastRun = 0;
		if (data.name)
			this.name = data.name;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60;
		else
			this.pollTime = 60;
		this.strategy = data.strategy;
		this.uuid = uuid();
	}

	activate () {
		this.active = true;
	}

	deactivate () {
		this.active = false;
	}

	execute () {
		if (!this.active)
			throw (`Window '${this.uuid}' is inactive.`);

		const now = Date.now();
		const pollTime = this.pollTime * 1000;

		if ((now - this.lastRun) >= pollTime) {
			console.log(`this.lastRun ${this.lastRun}`);
			console.log(`since ${now - this.lastRun}`);
			
			for (let i = 0; i < this.strategy.length; i++) {
				let strategy = this.strategy[i];
				console.log(`this.lastRun: ${this.lastRun}`);
				console.log(`timeSince: ${now - this.lastRun}`);
	
				// Execute strategies that are overdue to run
				// if ((now - this.lastRun) >= strategy.chart.pollTime) {
				// 	try {
				// 		// strategy.execute();
				// 	} catch (err) {
				// 		console.error(err);
				// 	}
				// }
				try {
					strategy.execute();
				} catch (err) {
					console.error(err);
				}
			}

			this.lastRun = now;
		}
	}
}
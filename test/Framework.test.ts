import { expect } from 'chai';

import * as dotenv from 'dotenv';

import { Asset } from '../src/Bot/Asset';
import { Bot } from '../src/Bot/Bot';
import { Chart } from '../src/Bot/Chart';
import { Kraken } from '../src/Bot/Exchange/Kraken';
import { Pair } from '../src/Bot/Pair';
import { Strategy } from '../src/Bot/Strategy';
import { Timeframe } from '../src/Bot/Timeframe';

// Helpers
import {
	BollingerBullishLowerCrossover as scenarioBollingerBullishLowerCrossover,
	BullishMacd12_26_9Crossover as scenarioBullishMacd12_26_9Crossover,
	BullishRsi14Oversold as scenarioBullishRsi14Oversold,
	Sma20CrossUp as scenarioSma20CrossUp
} from '../src/Helper/Scenario';
import {
	Bollinger20 as analysisBollinger20,
	Macd12_26_9 as analysisMacd12_26_9,
	Rsi14 as analysisRsi14,
	Sma20 as analysisSma20
} from '../src/Helper/Analysis';

dotenv.config();

const fs = require('fs');

describe('Storage tests', () => {
    it('should return same item with set/get', () => {
        let exchangeKraken = Kraken.new({
            name: 'Kraken',
            key: process.env.KRAKEN_CLIENT_KEY,
            secret: process.env.KRAKEN_CLIENT_SECRET,
        });

        let assetEth = Asset.new({
            exchange: exchangeKraken,
            symbol: 'ETH'
        });

        let getItem = Bot.getItem(exchangeKraken.uuid);

        expect(getItem.uuid).to.equal(exchangeKraken.uuid);

        //.to.be.false;
        // expect(options.fpsLimit).to.equal(30);

        // expect(options.interactivity.modes.emitters).to.be.empty;
        // expect(options.particles.color).to.be.an("object").to.have.property("value").to.equal("#fff");
    });
});
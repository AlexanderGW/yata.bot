import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset } from '../src/Bot/Asset';
import { Bot, BotSubscribeData } from '../src/Bot/Bot';
import { Chart, ChartCandleData } from '../src/Bot/Chart';
import { Kraken } from '../src/Bot/Exchange/Kraken';
import { Pair } from '../src/Bot/Pair';
import { Strategy, StrategyItem } from '../src/Bot/Strategy';
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
import { uuid } from 'uuidv4';
import { Position, PositionItem } from '../src/Bot/Position';
import { Order, OrderType } from '../src/Bot/Order';

const fs = require('fs');

describe('Backtest dataset 1', () => {
    it('should match known chart datapoint analysis scenarios, against test JSON', () => {

        // Create Kraken exchange client
        const exchangeKraken = Kraken.new({
            name: 'Kraken',
            key: process.env.KRAKEN_CLIENT_KEY,
            secret: process.env.KRAKEN_CLIENT_SECRET,
        });

        // Create ETH asset
        let assetEth = Asset.new({
            exchange: exchangeKraken,
            symbol: 'ETH'
        });

        // Create BTC asset
        let assetBtc = Asset.new({
            exchange: exchangeKraken,
            symbol: 'BTC'
        });

        // Create ETH BTC pair of assets
        let pairEthBtc = Pair.new({
            a: assetEth,
            b: assetBtc
        });

        // Create an existing position on exchange
        let pos1 = Position.new({
        	exchange: exchangeKraken,
        	pair: pairEthBtc,
        	amount: '2.23523552'
        });

        // Create an order, ready to be executed on exchange
        let order1 = Order.new({
        	exchange: exchangeKraken,
        	pair: pairEthBtc,
            position: pos1,
            price: '0.05',
            type: OrderType.LimitBuy,
        	amount: '10%' // of provided position
        });
        // order1.execute();

        // Create a ETHBTC pair chart, and 1 minute, for Kraken exchange data
        let chartKrakenEthBtc4h = Chart.new({
            exchange: exchangeKraken,
            pair: pairEthBtc,
            pollTime: 300, // 5m in seconds
            candleTime: 14400 // 4h in seconds
        });

        // Push Kraken exchange data to chart (if exchange/chart are compatible)
        try {
            // Request from Kraken
            // exchangeKraken.primeChart(
            // 	chartKrakenEthBtc4h
            // );

            // Load from storage
            let response: any = fs.readFileSync(
                './test/2022-10-15-ethbtc-4h-700.json',
                'utf8',
                function (
                    err: object,
                    data: object
                ) {
                    if (err)
                        console.error(err);
                }
            );

            let responseJson = JSON.parse(response);
            if (responseJson) {
                exchangeKraken.refreshChart(
                    chartKrakenEthBtc4h,
                    responseJson,
                );
            }
        } catch (err) {
            console.error(err);
        }

        // RSI crossing upward into 30 range
        let stratBullishRsi14Oversold = Strategy.new({
            action: [
                [scenarioBullishRsi14Oversold],
            ],
            analysis: [
                analysisRsi14,
            ],
            chart: chartKrakenEthBtc4h,
            name: 'BullishRsi14Oversold',
        });

        // MACD crossing upward
        let stratBullishMacd12_26_9Crossover = Strategy.new({
            action: [

                // Trigger another strategy, if this scenario matches
                [scenarioBullishMacd12_26_9Crossover, stratBullishRsi14Oversold],
                // [scenarioBullishMacd12_26_9Crossover],
            ],
            analysis: [
                analysisMacd12_26_9,
            ],
            chart: chartKrakenEthBtc4h,
            name: 'BullishMacd12_26_9Crossover',
        });

        let stratBullishBollinger20LowerCross = Strategy.new({
            action: [

                // Trigger another strategy, if this scenario matches
                // [scenarioBollingerBullishLowerCrossover, stratBullishRsi14Oversold],
                [scenarioBollingerBullishLowerCrossover],
            ],
            analysis: [
                analysisSma20, // Must execute before `analysisBollinger20`
                analysisBollinger20, // Depends on `analysisSma20` result
            ],
            chart: chartKrakenEthBtc4h,
            name: 'BullishBollingerLowerCross',
        });

        let stratBullishSma20Cross = Strategy.new({
            action: [
                [scenarioSma20CrossUp],
            ],
            analysis: [
                analysisSma20,
            ],
            chart: chartKrakenEthBtc4h,
            name: 'BullishSma20Cross',
        });

        // Timeframes will trigger by default
        let defaultTimeframe = Timeframe.new({
            active: false, // Run once, do not intiate a `setInterval()`
            intervalTime: 1000, // 1 second
            maxTime: 86400000 * 100, // last 100 days
            strategy: [
                // stratBullishMacd12_26_9Crossover,
                // stratBullishRsi14Oversold,
                stratBullishBollinger20LowerCross,
                // stratBullishSma20Cross,
            ],
        });

        // Timeframes will trigger by default
        let testTimeframe = Timeframe.new({
            active: false, // Run once, do not intiate a `setInterval()`
            intervalTime: 1500, // 1 second
            maxTime: 86400000 * 50, // last 50 days
            strategy: [
                // stratBullishMacd12_26_9Crossover,
                stratBullishRsi14Oversold,
                // stratBullishBollinger20LowerCross,
                // stratBullishSma20Cross,
            ],
        });

        // Timeframe strategy expected result dates (latest datapoint for matching scenarios)
        let expectedResult: Array<number[]> = [];
        let expectedResultIndex: string[] = [];

        // Expected results for `Timeframe` defaultTimeframe
        expectedResult.push([
            1657684800000,
            1658404800000,
            1658865600000,
            1659441600000,
            1661198400000,
            1661774400000,
            1663084800000,
            1663862400000,
            1664395200000,
            1665014400000,
        ]);
        expectedResultIndex.push(defaultTimeframe.uuid);

        // Expected results for `Timeframe` testTimeframe
        expectedResult.push([
            1661616000000,
            1663027200000,
            1663084800000,
            1663416000000,
            1663560000000,
            1663833600000,
            1663862400000
        ]);
        expectedResultIndex.push(testTimeframe.uuid);

        let actualResult: Array<number[]> = [];
        let actualResultIndex: string[] = [];

        // Check pot, allow action of fixed val, or %
        const actionEthBtcBuy = (
            subscribe: BotSubscribeData
        ) => {
            // Bot.log(`TEST: chart: ${subscribe.chart.uuid}`);
            // Bot.log(`TEST: do: actionEthBtcBuy`);

            if (subscribe.timeframeAny?.length) {
                for (let i = 0; i < subscribe.timeframeAny.length; i++) {
                    let timeframe = subscribe.timeframeAny[i];

                    // Index timeframe UUID for test comparison
                    actualResultIndex.push(timeframe.uuid);
                    Bot.log(`TEST: Timeframe '${timeframe.uuid}'`);
            
                    Bot.log(`TEST: timeframeResultCount: ${timeframe.result.length}`);
            
                    let timeField: string = '';
            
                    if (subscribe.chart.dataset?.openTime)
                        timeField = 'openTime';
                    else if (subscribe.chart.dataset?.closeTime)
                        timeField = 'closeTime';
            
                    for (let j = 0; j < timeframe.result.length; j++) {
                        let result: any = timeframe.result[j];
                        let uuid = timeframe.resultIndex[j];
            
                        if (result?.length) {
                            Bot.log(`TEST: Strategy (${j}) '${uuid}'`);

                            // Get strategy from storage, by UUID
                            let strategy: StrategyItem = Bot.getItem(uuid);
            
                            Bot.log(`TEST: Strategy '${strategy.name}', scenario '${strategy.action[j][0].name}' has ${result.length} matches`);
                            Bot.log(`TEST: Total: ${result?.length}. Leading frame matches (by field: ${timeField.length ? timeField : 'index'})`);
            
                            let actualTimeframeResult: number[] = [];

                            // let strategy = Strategy.getResult
                            for (let k = 0; k < result.length; k++) {
                                let latestCandle = result[k].length - 1;
                                let matchFirstCond = result[k][latestCandle][0];
                                
                                if (subscribe.chart.dataset?.hasOwnProperty(timeField)) {
                                    let datasetValue = subscribe.chart.dataset[timeField as keyof ChartCandleData];
                                    if (datasetValue) {
                                        let date = new Date(parseInt(datasetValue[matchFirstCond.k] as string) * 1000);
                                        
                                        // Add time for test comparison
                                        actualTimeframeResult.push(date.getTime());
                                        
                                        // resultTimes.push(date.toISOString());
                                        Bot.log(`TEST: Match: ${date.toISOString()}`);
                                        // Bot.log(date.getTime());
                                        
                                        // Output details on all matching scenario conditions
                                        // for (let l = 0; l < result[k].length; l++) {
                                        // 	Bot.log(result[k][l]);
                                        // }
                                    }
                                }
                            }

                            actualResult.push(actualTimeframeResult);
                        }
                    }
                }

                // Bot.log(expectedResult);
                // Bot.log(expectedResultIndex);

                // Bot.log(actualResult);
                // Bot.log(actualResultIndex);

                expect(JSON.stringify(actualResult)).to.equal(JSON.stringify(expectedResult));
                expect(JSON.stringify(actualResultIndex)).to.equal(JSON.stringify(expectedResultIndex));
            }
        };

        Bot.subscribe({
            action: actionEthBtcBuy,
            chart: chartKrakenEthBtc4h,
            condition: [
                ['total', '>=', '12'],
            ],
            // event: BotEvent.TimeframeResult,
            name: 'buyEthBtcKraken',
            timeframeAny: [
                defaultTimeframe,
                testTimeframe,
            ],
        });

        defaultTimeframe.execute();
        testTimeframe.execute();
    });
});

//.to.be.false;
// expect(options.fpsLimit).to.equal(30);

// expect(options.interactivity.modes.emitters).to.be.empty;
// expect(options.particles.color).to.be.an("object").to.have.property("value").to.equal("#fff");
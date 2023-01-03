import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset, AssetItem } from '../src/Bot/Asset';
import { Bot, BotSubscribeData, Log } from '../src/Bot/Bot';
import { Chart, ChartCandleData, ChartItem } from '../src/Bot/Chart';
import { Pair, PairItem } from '../src/Bot/Pair';
import { Strategy, StrategyItem } from '../src/Bot/Strategy';
import { Timeframe, TimeframeItem } from '../src/Bot/Timeframe';

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
import { Position, PositionItem } from '../src/Bot/Position';
import { Order, OrderAction, OrderItem, OrderSide, OrderType } from '../src/Bot/Order';
import { Exchange, ExchangeItem } from '../src/Bot/Exchange';

const fs = require('fs');

describe('Backtest dataset 1', () => {
    let expectedResult: Array<number[]> = [];
    let expectedResultIndex: string[] = [];

    let actualResult: Array<number[]> = [];
    let actualResultIndex: string[] = [];
    
    let exchangeDefaultPaper: ExchangeItem;
    let assetEth: AssetItem;
    let assetBtc: AssetItem;
    let pairEthBtc: PairItem;
    let pos1: PositionItem;
    let chartEthBtc4h: ChartItem;

    let stratBullishRsi14Oversold: StrategyItem;
    let stratBullishMacd12_26_9Crossover: StrategyItem;
    let stratBullishBollinger20LowerCross: StrategyItem;
    let stratBullishSma20Cross: StrategyItem;

    const botSubscriptionActionCallbackHandler = async (
        subscribe: BotSubscribeData,
    ) => {
        let actualResult: Array<number[]> = [];
        let actualResultIndex: string[] = [];

        if (subscribe.timeframeAny?.length) {
            for (let i = 0; i < subscribe.timeframeAny.length; i++) {
                let timeframe = subscribe.timeframeAny[i];

                // Index timeframe UUID for test comparison
                actualResultIndex.push(timeframe.uuid);
                Bot.log(`TEST: Timeframe '${timeframe.uuid}'; timeframeResultCount: ${timeframe.result.length}`, Log.Debug);
        
                let timeField: string = '';
        
                if (subscribe.chart.dataset?.openTime)
                    timeField = 'openTime';
                else if (subscribe.chart.dataset?.closeTime)
                    timeField = 'closeTime';
        
                for (let j = 0; j < timeframe.result.length; j++) {
                    let result: any = timeframe.result[j];
                    let uuid = timeframe.resultIndex[j];
        
                    if (result?.length) {

                        // Get strategy from storage, by UUID
                        let strategy: StrategyItem = Bot.getItem(uuid);
        
                        Bot.log(`TEST: Strategy '${strategy.name}' (${j + 1}/${timeframe.result.length}), scenario '${strategy.action[j][0].name}' has ${result.length} matches`, Log.Debug);
                        Bot.log(`TEST: Total: ${result?.length}. Leading frame matches (by field: ${timeField.length ? timeField : 'index'})`, Log.Debug);
        
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
                                    Bot.log(`TEST: Match: (${date.getTime().toString()}) ${date.toISOString()}`, Log.Debug);
                                    
                                    // Output details on all matching scenario conditions
                                    for (let l = 0; l < result[k].length; l++) {
                                        Bot.log(JSON.stringify(result[k][l]), Log.Debug);
                                    }
                                }
                            }
                        }

                        actualResult.push(actualTimeframeResult);
                    }
                }
            }

            return {
                actualResult,
                actualResultIndex
            };
        }
    };

    const botTimeframeHandler = async function (
        timeframe: TimeframeItem,
    ) {
        return new Promise((resolve, reject) => {
            
            // Check pot, allow action of fixed val, or %
            const botSubscriptionActionCallback = async (
                subscribe: BotSubscribeData
            ) => {

                // Handle `BotSubscribeData`
                const botSubscriptionActionCallbackResult = await botSubscriptionActionCallbackHandler(
                    subscribe
                );

                // Merge returned matches into tracked actual results
                if (
                    botSubscriptionActionCallbackResult?.actualResult.length
                    && botSubscriptionActionCallbackResult?.actualResultIndex.length
                ) {
                    actualResult.push.apply(
                        actualResult,
                        botSubscriptionActionCallbackResult.actualResult
                    );

                    actualResultIndex.push.apply(
                        actualResultIndex,
                        botSubscriptionActionCallbackResult.actualResultIndex
                    );

                    resolve('Ok');
                } else {
                    reject('No results');
                }
            };

            Bot.subscribe({
                action: botSubscriptionActionCallback,
                chart: chartEthBtc4h,
                condition: [
                    ['total', '>=', '1'],
                ],
                name: 'botSubscriptionActionCallback',
                timeframeAny: [
                    timeframe,
                ],
            });

            // Execute the timeframes once each (both are defined `active:false`,
            // so that they don't run every `intervalTime`)
            timeframe.execute();
        })

        .then(
            function (result) {
                expect(JSON.stringify(actualResult)).to.equal(JSON.stringify(expectedResult));
                expect(JSON.stringify(actualResultIndex)).to.equal(JSON.stringify(expectedResultIndex));
            }
        )
    };

    before(async function () {

        /**
         * Backtesting with a cut-off point (see `maxTime` within one of the `Timeframe` below)
         */

        // Create exchange client
        exchangeDefaultPaper = await Exchange.new({
            // Using all default options
        });

        // Create ETH asset
        assetEth = Asset.new({
            exchange: exchangeDefaultPaper,
            symbol: 'ETH'
        });

        // Create BTC asset
        assetBtc = Asset.new({
            exchange: exchangeDefaultPaper,
            symbol: 'BTC'
        });

        // Create ETH BTC pair of assets
        pairEthBtc = Pair.new({
            a: assetEth,
            b: assetBtc
        });

        // Create an existing position on exchange
        pos1 = Position.new({
        	exchange: exchangeDefaultPaper,
        	pair: pairEthBtc,
        	amount: '10.123456789'
        });

        // Create a ETHBTC pair chart, and 1 minute, for exchange data
        chartEthBtc4h = Chart.new({
            exchange: exchangeDefaultPaper,
            pair: pairEthBtc,
            pollTime: 300, // 5m in seconds
            candleTime: 14400 // 4h in seconds
        });

        // Push exchange data to chart (if exchange/chart are compatible)
        try {
            // Request from exchange (Binance, Kraken, etc.)
            // exchangeDefaultPaper.syncChart(
            // 	chartEthBtc4h
            // );

            // Load from storage
            let response: any = fs.readFileSync(
                './test/Kraken-ETHBTC-2023-01-02-13-04-20.json',
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
                exchangeDefaultPaper.refreshChart(
                    chartEthBtc4h,
                    responseJson,
                );
            }
        } catch (err) {
            console.error(err);
        }

        // RSI crossing upward into 30 range
        stratBullishRsi14Oversold = Strategy.new({
            action: [
                [scenarioBullishRsi14Oversold],
            ],
            analysis: [
                analysisRsi14,
            ],
            chart: chartEthBtc4h,
            name: 'BullishRsi14Oversold',
        });

        // MACD crossing upward
        stratBullishMacd12_26_9Crossover = Strategy.new({
            action: [
                [scenarioBullishMacd12_26_9Crossover],
            ],
            analysis: [
                analysisMacd12_26_9,
            ],
            chart: chartEthBtc4h,
            name: 'BullishMacd12_26_9Crossover',
        });

        stratBullishBollinger20LowerCross = Strategy.new({
            action: [
                [scenarioBollingerBullishLowerCrossover],
            ],
            analysis: [
                analysisSma20, // Must execute before `analysisBollinger20`
                analysisBollinger20, // Depends on `analysisSma20` result
            ],
            chart: chartEthBtc4h,
            name: 'BullishBollingerLowerCross',
        });

        stratBullishSma20Cross = Strategy.new({
            action: [
                [scenarioSma20CrossUp],
            ],
            analysis: [
                analysisSma20,
            ],
            chart: chartEthBtc4h,
            name: 'BullishSma20Cross',
        });
    });

    beforeEach(function () {
        expectedResult = [];
        expectedResultIndex = [];

        actualResult = [];
        actualResultIndex = [];
    });

    it('should match known "stratBullishRsi14Oversold" scenarios', async () => {

        // Define timeframe, which runs once
        let defaultTimeframe = Timeframe.new({

            // Run once, do not intiate a `setInterval()`
            active: false,
            
            // 1 second
            intervalTime: 1000,

            // last 100 days of the dataset
            maxTime: 86400000 * 50,

            // Strategies to run
            strategy: [
                stratBullishRsi14Oversold,
            ],
        });

        // Expected results for `stratBullishRsi14Oversold` against the dataset
        expectedResult.push([
            1668945600000,
            1669003200000,
            1669060800000,
            1671307200000,
        ]);
        expectedResultIndex.push(defaultTimeframe.uuid);

        // Subscribe to timeframe with callback testing, and execute timeframe
        return await botTimeframeHandler(
            defaultTimeframe
        );
    });

    it('should match known "stratBullishMacd12_26_9Crossover" scenarios', async () => {

        // Define timeframe, which runs once
        let defaultTimeframe = Timeframe.new({

            // Run once, do not intiate a `setInterval()`
            active: false,
            
            // 1 second
            intervalTime: 1000,

            // last 100 days of the dataset
            maxTime: 86400000 * 50,

            // Strategies to run
            strategy: [
                stratBullishMacd12_26_9Crossover,
            ],
        });

        // Expected results for `stratBullishMacd12_26_9Crossover` against the dataset
        expectedResult.push([
            1668427200000,
            1668484800000,
            1668787200000,
            1669147200000,
            1669708800000,
            1670500800000,
            1670673600000,
            1670932800000,
            1671350400000,
            1671739200000,
            1671897600000,
            1672315200000,
            1672632000000,
        ]);
        expectedResultIndex.push(defaultTimeframe.uuid);

        // Subscribe to timeframe with callback testing, and execute timeframe
        return await botTimeframeHandler(
            defaultTimeframe
        );
    });
});

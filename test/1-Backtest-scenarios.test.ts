import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset, AssetItem } from '../src/Bot/Asset';
import { Bot, Log } from '../src/Bot/Bot';
import { Chart, ChartCandleData, ChartItem } from '../src/Bot/Chart';
import { Pair, PairItem } from '../src/Bot/Pair';
import { Strategy, StrategyItem } from '../src/Bot/Strategy';
import { Timeframe, TimeframeItem } from '../src/Bot/Timeframe';

// Helpers
import {
	BollingerBullishLowerCross as scenarioBollingerBullishLowerCross,
	Macd12_26_9BullishCross as scenarioMacd12_26_9BullishCross,
	Rsi14BullishOversold as scenarioRsi14BullishOversold,
	Sma20BullishCross as scenarioSma20BullishCross
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
import { Subscription, SubscriptionData } from '../src/Bot/Subscription';

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
    let chartEthBtc4h: ChartItem;

    let stratRsi14BullishOversold: StrategyItem;
    let stratMacd12_26_9BullishCross: StrategyItem;
    let stratBullishBollinger20LowerCross: StrategyItem;
    let stratBullishSma20Cross: StrategyItem;

    /**
     * Callback for timeframe subscriptions; processes the results of all subscribed 
     * timeframes (in `subscribe.timeframeAny`) for eventual test comparison, and 
     * outputs its findings to log for debugging
     * 
     * @param subscribe 
     * @returns 
     */
    const botSubscriptionActionCallbackHandler = async (
        subscribe: SubscriptionData,
    ) => {
        let actualResult: Array<number[]> = [];
        let actualResultIndex: string[] = [];

        if (subscribe.timeframeAny?.length) {
            for (let i = 0; i < subscribe.timeframeAny.length; i++) {
                let timeframe = subscribe.timeframeAny[i];

                // Index timeframe UUID for test comparison
                actualResultIndex.push(timeframe.uuid);
                Bot.log(`TEST: Timeframe '${timeframe.name}'; timeframeResultCount: ${timeframe.result.length}`, Log.Debug);
        
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
        }

        return {
            actualResult,
            actualResultIndex
        };
    };

    /**
     * Subscribe to an established timeframe with callback testing, then execute timeframe.
     * 
     * @param timeframe 
     * @returns 
     */
    const botTimeframeHandler = async function (
        timeframe: TimeframeItem,
    ) {
        return new Promise((resolve, reject) => {
            
            // Called if subscription conditions match
            const botSubscriptionActionCallback = async (
                subscribe: SubscriptionData
            ) => {

                // Handle `SubscriptionData`
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

            Subscription.new({

                // The callback function if conditons are matched
                actionCallback: botSubscriptionActionCallback,

                // The dataset to be used to cross reference the timeframe signals
                chart: chartEthBtc4h,

                // The signal conditions within a timeframe, that will trigger a callback
                // NOTE: The following would trigger a callback whenever any of the timeframes 
                // are triggered, no matter what signal count (this is good for testing)
                condition: [
                    ['total', '>=', '0'],
                ],

                // A friendly name...
                name: 'botSubscriptionActionCallback',

                // Subscribe to any of the following timeframes
                timeframeAny: [
                    timeframe,
                ],
            });

            // The timeframe `keepalive` is `false`, so it must be executed manually
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

        // Create exchange client
        exchangeDefaultPaper = await Exchange.new({
            // Using all default options
        });

        // Create ETH asset
        assetEth = Asset.new({
            symbol: 'ETH'
        });

        // Create BTC asset
        assetBtc = Asset.new({
            symbol: 'BTC'
        });

        // Create ETH BTC pair of assets
        pairEthBtc = Pair.new({
            a: assetEth,
            b: assetBtc,
            exchange: exchangeDefaultPaper,
        });

        // Create a ETHBTC pair chart, and 1 minute, for exchange data
        chartEthBtc4h = Chart.new({
            datasetFile: 'test/Kraken-ETHBTC-2023-01-02-13-04-20.json',
            pair: pairEthBtc,
            pollTime: 300000, // 5m in seconds
            candleTime: 14400000 // 4h in seconds
        });

        // RSI crossing upward into 30 range
        stratRsi14BullishOversold = Strategy.new({
            action: [
                [scenarioRsi14BullishOversold],
            ],
            analysis: [
                analysisRsi14,
            ],
            chart: chartEthBtc4h,
            name: 'Rsi14BullishOversold',
        });

        // MACD crossing upward
        stratMacd12_26_9BullishCross = Strategy.new({
            action: [
                [scenarioMacd12_26_9BullishCross],
            ],
            analysis: [
                analysisMacd12_26_9,
            ],
            chart: chartEthBtc4h,
            name: 'Macd12_26_9BullishCross',
        });

        stratBullishBollinger20LowerCross = Strategy.new({
            action: [
                [scenarioBollingerBullishLowerCross],
            ],
            analysis: [
                analysisSma20, // Must execute before `analysisBollinger20`
                analysisBollinger20, // Depends on `analysisSma20` result
            ],
            chart: chartEthBtc4h,
            name: 'BollingerBullishLowerCross',
        });

        stratBullishSma20Cross = Strategy.new({
            action: [
                [scenarioSma20BullishCross],
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

    it('should match known "stratRsi14BullishOversold" scenarios', async () => {

        // Define timeframe, which runs once
        let defaultTimeframe = Timeframe.new({

            // Prevent timeframe from running every `intervalTime`,
            // and instead execute manually later.
            keepalive: false,
            
            // 1 second
            intervalTime: 1000,

            // last 100 days of the dataset
            windowTime: 86400000 * 50,

            // Strategies to run
            strategy: [
                stratRsi14BullishOversold,
            ],
        });

        // Expected results for `stratRsi14BullishOversold` against the dataset
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

    it('should match known "stratMacd12_26_9BullishCross" scenarios', async () => {

        // Define timeframe, which runs once
        let defaultTimeframe = Timeframe.new({

            // Prevent timeframe from running every `intervalTime`,
            // and instead execute manually later.
            keepalive: false,
            
            // 1 second
            intervalTime: 1000,

            // last 100 days of the dataset
            windowTime: 86400000 * 50,

            // Strategies to run
            strategy: [
                stratMacd12_26_9BullishCross,
            ],
        });

        // Expected results for `stratMacd12_26_9BullishCross` against the dataset
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

    it('should match known "stratBullishSma20Cross" scenarios', async () => {

        // Define timeframe, which runs once
        let defaultTimeframe = Timeframe.new({

            // Prevent timeframe from running every `intervalTime`,
            // and instead execute manually later.
            keepalive: false,
            
            // 1 second
            intervalTime: 1000,

            // last 100 days of the dataset
            windowTime: 86400000 * 50,

            // Strategies to run
            strategy: [
                stratBullishSma20Cross,
            ],
        });

        // Expected results for `stratBullishSma20Cross` against the dataset
        expectedResult.push([
            1668499200000,
            1668873600000,
            1669176000000,
            1669708800000,
            1670212800000,
            1670515200000,
            1670688000000,
            1670889600000,
            1670947200000,
            1671465600000,
            1671753600000,
            1672099200000,
            1672315200000,
        ]);
        expectedResultIndex.push(defaultTimeframe.uuid);

        // Subscribe to timeframe with callback testing, and execute timeframe
        return await botTimeframeHandler(
            defaultTimeframe
        );
    });
});

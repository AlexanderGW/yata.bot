import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset } from '../src/Bot/Asset';
import { Bot, Log } from '../src/Bot/Bot';
import { Chart, ChartCandleData } from '../src/Bot/Chart';
import { Pair } from '../src/Bot/Pair';
import { Strategy, StrategyItem } from '../src/Bot/Strategy';
import { Timeframe } from '../src/Bot/Timeframe';

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
import { Position } from '../src/Bot/Position';
import { Order, OrderAction, OrderSide, OrderType } from '../src/Bot/Order';
import { Exchange } from '../src/Bot/Exchange';
import { Subscription, SubscriptionData } from '../src/Bot/Subscription';

const fs = require('fs');

describe('Backtest dataset 1', () => {
    it('should match the same data point on a chained strategy, against a truncated dataset', async () => {

        /**
         * Backtesting with a cut-off point (see `windowTime` within one of the `Timeframe` below)
         */

        // Create exchange client
        let exchangeDefaultPaper = await Exchange.new({
            // Using all default options
        });

        // Example Binance exchange client
        // let exchangeBinance = await Exchange.new({
        //     class: 'Binance',
        //     key: process.env.BINANCE_CLIENT_KEY,
        //     secret: process.env.BINANCE_CLIENT_SECRET,
        // });

        // Example Kraken exchange client
        // let exchangeKraken = await Exchange.new({
        //     class: 'Kraken',
        //     key: process.env.KRAKEN_CLIENT_KEY,
        //     secret: process.env.KRAKEN_CLIENT_SECRET,
        // });

        // Create ETH asset
        let assetEth = Asset.new({
            symbol: 'ETH'
        });

        // Create BTC asset
        let assetBtc = Asset.new({
            symbol: 'BTC'
        });

        // Create ETH BTC pair of assets, with Kraken
        let pairEthBtcKraken = Pair.new({
            a: assetEth,
            b: assetBtc,
            exchange: exchangeDefaultPaper,
        });

        // Create an existing position on exchange
        let pos1 = Position.new({
        	pair: pairEthBtcKraken,
        	quantity: '10.123456789'
        });

        // Create a ETHBTC pair chart, and 1 minute, for exchange data
        let chartEthBtc4h = Chart.new({
            pair: pairEthBtcKraken,
            pollTime: 300000, // 5m in seconds
            candleTime: 14400000 // 4h in seconds
        });

        // Push exchange data to chart (if exchange/chart are compatible)
        try {
            // Request from exchange (Binance, Kraken, etc.)
            // exchangeDefaultPaper.syncChart(
            // 	chartEthBtc4h
            // );

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
                        console.log(JSON.stringify(err), Log.Err);
                }
            );

            let responseJson = JSON.parse(response);
            if (responseJson) {

                // TODO: There is something wrong with BBAND analysis offset - check all DP and analysis offset logic

                for (let i in responseJson) {
                    responseJson[i] = responseJson[i].slice(26,74);
                    // console.log(responseJson[i][responseJson[i].length - 1]);
                }
                
                chartEthBtc4h.dataset = responseJson;
            }
        } catch (err) {
            Bot.log(err as string, Log.Err);
        }

        // RSI crossing upward into 30 range
        let stratRsi14BullishOversold = Strategy.new({
            action: [
                [scenarioRsi14BullishOversold],
            ],
            analysis: [
                analysisRsi14,
            ],
            chart: chartEthBtc4h,
            name: 'Rsi14BullishOversold',
        });

        let stratBullishBollinger20LowerCross = Strategy.new({
            action: [

                // Trigger another strategy, if this scenario matches
                [scenarioBollingerBullishLowerCross, stratRsi14BullishOversold],
                // [scenarioBollingerBullishLowerCross],
            ],
            analysis: [
                analysisSma20, // Must execute before `analysisBollinger20`
                analysisBollinger20, // Depends on `analysisSma20` result
            ],
            chart: chartEthBtc4h,
            name: 'BollingerBullishLowerCross',
        });

        // Timeframes will trigger by default
        let defaultTimeframe = Timeframe.new({
            intervalTime: 0, // Default, run once
            windowTime: 86400000 * 100,//chartEthBtc4h.candleTime * 4000, // last four 4h candles (just enough for the four scenario datapoints) - rename: `windowTime`
            strategy: [
                // stratMacd12_26_9BullishCross,
                stratBullishBollinger20LowerCross,
                // stratRsi14BullishOversold,
                // stratBullishSma20Cross,
            ],
        });

        // Timeframe strategy expected result dates (latest datapoint for matching scenarios)
        let expectedResult: Array<number[]> = [];
        let expectedResultIndex: string[] = [];

        // Expected results for `Timeframe` defaultTimeframe - Once for the `stratBullishBollinger20LowerCross`
        expectedResult.push([
            1663084800000,
        ]);

        // Second identical timestamp for `stratRsi14BullishOversold`
        expectedResult.push([
            1663084800000,
        ]);
        expectedResultIndex.push(defaultTimeframe.uuid);

        let actualResult: Array<number[]> = [];
        let actualResultIndex: string[] = [];

        // For testing, capture timeframe subscription results
        let subscriptionPromise = new Promise((resolve, reject) => {

            // Check pot, allow action of fixed val, or %
            const actionEthBtcBuy = async (
                subscribe: SubscriptionData
            ) => {

                // Create an order, ready to be executed on exchange
                try {
                    let order1 = Order.new({
                        quantity: '10%', // of provided position,
                        side: OrderSide.Buy,
                        pair: pairEthBtcKraken,
                        position: pos1,
                        price: '0.05',
                        type: OrderType.Limit,
                    });
                    order1.execute(OrderAction.Create);
                } catch (err) {
                    Bot.log(err as string);
                }

                if (subscribe.timeframeAny?.length) {
                    for (let i = 0; i < subscribe.timeframeAny.length; i++) {
                        let timeframe = subscribe.timeframeAny[i];

                        // Index timeframe UUID for test comparison
                        actualResultIndex.push(timeframe.uuid);
                        Bot.log(`TEST: Timeframe '${timeframe.name}'; timeframeResultCount: ${timeframe.result.length}`);
                
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
                
                                //'${strategy.action[j][0].name}'
                                Bot.log(`TEST: Strategy '${strategy.name}' (${j + 1}/${timeframe.result.length}), scenario '${strategy.action[j][0].name}' has ${result.length} matches`);
                                Bot.log(`TEST: Total: ${result?.length}. Leading frame matches (by field: ${timeField.length ? timeField : 'index'})`);
                
                                let actualTimeframeResult: number[] = [];

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
                                            
                                            // Output details on all matching scenario conditions
                                            for (let l = 0; l < result[k].length; l++) {
                                                Bot.log(JSON.stringify(result[k][l]));
                                            }
                                        }
                                    }
                                }

                                actualResult.push(actualTimeframeResult);
                            }
                        }
                    }

                    resolve('Ok');
                } else {
                    reject('No results');
                }
            };

            // Established subscriber on Timeframe `defaultTimeframe`
            Subscription.new({
                actionCallback: actionEthBtcBuy,
                chart: chartEthBtc4h,
                condition: [
                    ['total', '==', '2'],
                ],
                // event: BotEvent.TimeframeResult,
                name: 'buyEthBtc',
                timeframeAny: [
                    defaultTimeframe,
                ],
            });
        })
        
        .then(
            function (result) {
                expect(JSON.stringify(actualResult)).to.equal(JSON.stringify(expectedResult));
                expect(JSON.stringify(actualResultIndex)).to.equal(JSON.stringify(expectedResultIndex));
            }
        )
        
        .catch((err) => {
            console.error(err);
        });

        // Execute the timeframe
        defaultTimeframe.execute();
    });
});

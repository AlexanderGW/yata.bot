import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset, AssetItem } from '../src/Bot/Asset';
import { Bot, Log } from '../src/Bot/Bot';
import { Pair, PairItem } from '../src/Bot/Pair';

import { Position, PositionItem } from '../src/Bot/Position';
import { Order, OrderAction, OrderItem, OrderSide, OrderStatus, OrderType } from '../src/Bot/Order';
import { Exchange, ExchangeItem } from '../src/Bot/Exchange';

const fs = require('fs');

// Only test if we have a Kraken API key/secret
if (
    process.env.KRAKEN_CLIENT_KEY?.length
    && process.env.KRAKEN_CLIENT_SECRET?.length
) {
    describe('Kraken support', () => {
        let exchangeKraken: ExchangeItem;
        let assetEth: AssetItem;
        let assetBtc: AssetItem;
        let pairEthBtcKraken: PairItem;
        let position1: PositionItem;
        let order1: OrderItem;

        let order1OpenMarketBuy: OrderItem;
        let order1CloseLimitBuy: OrderItem;
        let order1OpenLimitBuy: OrderItem;
        let order1EditLimitBuy: OrderItem;
    
        before(async function () {
    
            // Example Kraken exchange client
            exchangeKraken = await Exchange.new({
                class: 'Kraken',
                key: process.env.KRAKEN_CLIENT_KEY,
                secret: process.env.KRAKEN_CLIENT_SECRET,
            });
    
            // ETH asset
            assetEth = Asset.new({
                symbol: 'ETH'
            });
    
            // BTC asset
            assetBtc = Asset.new({
                symbol: 'BTC'
            });
    
            // ETH BTC pair of assets
            pairEthBtcKraken = Pair.new({
                a: assetEth,
                b: assetBtc,
                exchange: exchangeKraken,
            });
    
            // Existing position on exchange
            position1 = Position.new({
                pair: pairEthBtcKraken,
    
                // 0.1 ETH
                quantity: '0.1'
            });
    
            order1 = Order.new({

                // Percentages can only be used if a `position` is provided, otherwise e.g. 0.01
                // For ETHBTC, this would be the quantity of ETH
                quantity: '10%',

                // NOTE: Ensure we are only testing orders
                // `BOT_DRYRUN=1` environment (will set all orders to default dry-run)
                dryrun: true,

                // The trading pair, i.e. ETH/BTC on Kraken
                pair: pairEthBtcKraken,

                // An optional `Position`
                position: position1,

                // Either `OrderSide.Buy`, or `OrderSide.Sell`
                side: OrderSide.Buy,

                // Exchange response should match this, with a new `responseTime`
                status: OrderStatus.Open,

                // Default: Order type is `OrderType.Market`
                type: OrderType.Market,
            });
        });

        it('should validate market buy order creation', async () => {

            // Execute market buy order create on exchange
            try {

                // Response will contain the exchange side transaction ID, and a
                // new `responseTime`, and `status` if successful. You will
                // need to update the order accordingly.
                let orderResponse = await order1.execute();

                // Check order confirmation
                console.log(orderResponse);
            } catch (err) {
                Bot.log(err as string, Log.Err);
            }
        });
    
        // it('should validate limit buy order creation', async () => {
    
        //     // Execute limit buy order create on exchange
        //     try {

        //         // Price. For ETHBTC, This would be at the price of BTC
        //         order1.price = '0.01';

        //         // Type of order
        //         order1.type = OrderType.Limit;

        //         // Response will contain the exchange side transaction ID, and a
        //         // new `responseTime`, and `status` if successful. You will
        //         // need to update the order accordingly.
        //         let orderResponse = await order1.execute();

        //         // Check order confirmation
        //         console.log(orderResponse);
        //     } catch (err) {
        //         Bot.log(err as string, Log.Err);
        //     }
        // });

        // it('should validate limit buy order edit', async () => {

        //     // Execute limit buy order edit on exchange
        //     try {
        //         // Modifying `order1`

        //         // Price. For ETHBTC, This would be at the price of BTC
        //         order1OpenLimitBuy.price = '0.009';

        //         // Type of order 
        //         order1OpenLimitBuy.type = OrderType.Limit;

        //         // Call requires `transactionId` value
        //         order1OpenLimitBuy.transactionId = ['false'];

        //         // Response will contain original `order1` with any changes, such as 
        //         // the exchange side transaction ID, and `confirmed` should be `true` if successful
        //         // For the purposes of testing, we'll store the response in its own variable
        //         order1EditLimitBuy = await order1OpenLimitBuy.execute(OrderAction.Edit);
        //         console.log(order1EditLimitBuy);
        //     } catch (err) {
        //         Bot.log(err as string, Log.Err);
        //     }
        // });
    
        // it('should validate limit buy order cancel', async () => {
    
        //     // Execute limit buy order cancel on exchange
        //     try {
        //         // Modifying `order1`

        //         // Call requires `transactionId` value
        //         order1OpenLimitBuy.transactionId = ['false'];

        //         // Response will contain original `order1` with any changes, such as 
        //         // the exchange side transaction ID, and `confirmed` should be `true` if successful
        //         // For the purposes of testing, we'll store the response in its own variable
        //         order1CloseLimitBuy = await order1OpenLimitBuy.execute(OrderAction.Close);
        //         console.log(order1CloseLimitBuy);
        //     } catch (err) {
        //         Bot.log(err as string, Log.Err);
        //     }
        // });
    });
}

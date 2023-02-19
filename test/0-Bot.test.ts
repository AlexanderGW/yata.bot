import { expect } from 'chai';

import * as dotenv from 'dotenv';

import { Bot, ItemBaseData } from '../src/Bot/Bot';
import { Storage } from '../src/Bot/Storage';

import { v4 as uuidv4, validate } from 'uuid';

dotenv.config();

const fs = require('fs');

describe('Bot tests', () => {
    it('should return same item with set/get', () => {
        let exchangeKraken: ItemBaseData = {
            uuid: uuidv4(),
        };
        
        expect(validate(exchangeKraken.uuid)).to.be.true;

        let returnedUuid = Bot.setItem(exchangeKraken);
        
        expect(returnedUuid).to.equal(exchangeKraken.uuid);

        let getItem = Bot.getItem(returnedUuid);

        expect(getItem.uuid).to.equal(exchangeKraken.uuid);
    });

    it('should return same item with set/get via storage interface', async () => {
        let redis = await Storage.new({
            class: 'Redis',
        });

        let redisSet = await redis.setItem({
            name: 'aaa',
            uuid: 'aaa',
        });
        console.log(`redisSet: ${redisSet}`);

        // Redis hit
        let redisGet = await redis.getItem('aaa');
        console.log(`redisGet: ${JSON.stringify(redisGet)}`);

        // Memory cached hit
        let redisGetCached = await redis.getItem('aaa');
        console.log(`redisCachedGet: ${JSON.stringify(redisGetCached)}`);

        let exchangeKraken: ItemBaseData = {
            uuid: uuidv4(),
        };
        
        expect(validate(exchangeKraken.uuid)).to.be.true;

        let returnedUuid = Bot.setItem(exchangeKraken);
        
        expect(returnedUuid).to.equal(exchangeKraken.uuid);

        let getItem = Bot.getItem(returnedUuid);

        expect(getItem.uuid).to.equal(exchangeKraken.uuid);

        await redis.client.disconnect();
    });
});
import { expect } from 'chai';

import * as dotenv from 'dotenv';

import { YATAB, ItemBaseData } from '../src/YATAB/YATAB';
import { Storage } from '../src/YATAB/Storage';

import { v4 as uuidv4, validate } from 'uuid';

dotenv.config();

const fs = require('fs');

describe('YATAB tests', () => {
    it('should return same item with set/get', () => {
        let exchangeKraken: ItemBaseData = {
            uuid: uuidv4(),
        };
        
        expect(validate(exchangeKraken.uuid)).to.be.true;

        let returnedUuid = YATAB.setItem(exchangeKraken);
        
        expect(returnedUuid).to.equal(exchangeKraken.uuid);

        let getItem = YATAB.getItem(returnedUuid);

        expect(getItem?.uuid).to.equal(exchangeKraken.uuid);
    });

    it('should return same item with set/get via storage interface', async () => {
        let redis = await Storage.new({
            class: 'Redis',
        });

        const itemData = {
            name: 'aaa',
            uuid: 'aaa',
        }

        let redisSet = await redis.setItem('aaa', itemData);
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

        let returnedUuid = YATAB.setItem(exchangeKraken);
        
        expect(returnedUuid).to.equal(exchangeKraken.uuid);

        let getItem = YATAB.getItem(returnedUuid);

        expect(getItem?.uuid).to.equal(exchangeKraken.uuid);

        await redis.disconnect();
    });
});
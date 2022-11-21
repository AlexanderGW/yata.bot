import { expect } from 'chai';

import * as dotenv from 'dotenv';

import { Bot, ItemBaseData } from '../src/Bot/Bot';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const fs = require('fs');

describe('Bot tests', () => {
    it('should return same item with set/get', () => {
        let exchangeKraken: ItemBaseData = {
            uuid: uuidv4(),
        };

        let returnedUuid = Bot.setItem(exchangeKraken);
        
        expect(returnedUuid).to.equal(exchangeKraken.uuid);

        let getItem = Bot.getItem(returnedUuid);

        expect(getItem.uuid).to.equal(exchangeKraken.uuid);
    });
});
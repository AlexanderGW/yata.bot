# TradeBot
Still in very early stages of development. Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

Following a concept of strategies, which look for scenarios (definable sets of conditions over a number of data frames) on chart and/or technical analysis; firing events (such as buy, sell, SL, etc.), based on the number of signals within a given time frame.

## Todo

- Monitor strategy signals within a timeframe; At Nth, trigger buy, sell, SL, etc.
- Implement a progressive chart for active strategies (currently parses the entire dataset).
- Implement JSON/YAML support

## Development
```
tsc --watch
node dist/index.js
```

## Caveats

### `Scenario.test()`
Currrently doesn't care how many result datasets have the same output field names. If you run conditions on field names that happen to exist in more that one of the provided datasets, it will skew your `conditionMatch` count, thus invalidating your scenario. Changing all dataset output field names, would mitigate this.
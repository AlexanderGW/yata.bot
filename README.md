# TradeBot
Still in very early stages of development. Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

Following a concept of strategies, which look for scenarios (definable sets of conditions over a number of data frames) on chart and/or technical analysis; firing events (such as buy, sell, SL, etc.), based on the number of signals within a given time frame.

## Structuring
Here is a basic overview of how the bot is currently structured. Subject to change, as this project is still in development.
- Timeframe
  
  Run over `intervalTime`, checking one or more strategies
  - Strategy

    One or more `Analysis` result sets, for a given `Chart`, looking for one or more `Scenario` condition matches (which can trigger an optional chained `Strategy`).
    - Scenario

	  One or more sets of conditions against one or more sets of `Analysis` and/or `Chart` metrics.
	  - Analysis

	    A light `talib` wrapper, with configuration.
	    - Chart

		  Collection of data points for a `Chart` with `Pair` of `Asset`, sourced from storage.
		  - Exchange

		    A potential source of `Chart` data, or destination for `Exchange` actions, based on a `Bot.subscribe()` despatch to open/close a `Position`.

## Todo

- Monitor strategy signals within a timeframe; At Nth, trigger buy, sell, SL, etc.
- Progressive chart for active strategies (currently parses the entire dataset).
- JSON/YAML support for configurations

## Development
```
tsc --watch
node dist/index.js
```

## Caveats

### `Scenario.test()`
Currrently doesn't care how many result datasets have the same output field names. If you run conditions on field names that happen to exist in more that one of the provided datasets, it will skew your `conditionMatch` count, thus invalidating your scenario. Changing all dataset output field names, would mitigate this.
# TradeBot
Still in very early stages of development. Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

Following a concept of timeframes with strategies, which look for scenarios (definable sets of conditions over a given number of data frames) on a combination of chart datapoints and/or technical analysis; with subscriptions for firing events (such as buy, sell, SL, etc.), based on a definable number of signals within a given timeframe.
 
## Update: March 2023
- Planning a candidate release in the coming months.
- YAML playbook templates to configure environments, and execute callbacks 
- Spot trading only (could expand on this later)

## Playbooks (YAML templates)
Bot instances can be configured using YAML templates, known as playbooks, stored in the `~/playbook/<name>/<name>.yml` directory. Replace `<name>` with actual template name.

In this example; A `subscription` callback `action` function will be imported from `~/playbook/<name>/<name>.ts`

### Running templates
Without the YML file extension.

```
npm run playbook <name>
```

See [`~/playbook/eth-btc-mockup/eth-btc-mockup.yml`](playbook/eth-btc-mockup/eth-btc-mockup.yml) for a very simple example playbook, which would sell bearish overbought and buy bullish oversold RSI conditions of ETH/BTC, on Kraken.

### Subscription actions (callbacks)
See [`~/playbook/eth-btc-mockup/eth-btc-mockup.ts`](playbook/eth-btc-mockup/eth-btc-mockup.ts) for an example set of callbacks, reference in the `eth-btc-mockup` playbook above

### Times and shorthand notation
Notations `s,m,h,d,w` (i.e. `5m` for five minutes in milliseconds) are available for better readability on `Time` (i.e. `intervalTime`) suffixed fields, otherwise values are treated as milliseconds.

```
chart:
  ethBtcKraken4h:
    pair: ethBtcKraken
    pollTime: 5m          # five minutes; 300000 milliseconds
    candleTime: 4h        # four hours; 14400000 milliseconds
```

### Item referencing
All items are identified in playbooks with a `name`, which is then used to link items together.

An example `Scenario` called `rsi14BearishOverbought`, referencing `Analysis` called `analysisRsi14`
```
analysis:
  rsi14:
    ...

scenario:
  rsi14BearishOverbought:
    analysis:
      - rsi14
    ...
```

## Environment
See `.env.example` for bot configuration options, and exchange API keys

## Todo
- In-progress: JSON/YAML support for configurations
- In-progress: Expand `Bot.setItem` and `Bot.getItem` storage interface (File, Memory, Redis, MongoDB, etc)
- Scenario condition percentage values (changes from previous datapoints)
- Cleanup `Helper` structure

## Testing
Mocha, Chai unit test coverage. Currently tests a known dataset for strategy scenarios, against two timeframes.
```
npm test
```

## Development
```
tsc --watch
```

## Structure
Here is a basic overview of how the bot is currently structured. Subject to change, as this project is still in development.

### Subscribing to `Timeframe` changes
Available condition values
- `high` for the timeframe with the most amount of signals
- `low` for the timeframe with the least amount of signals
- `total` for the sum of all timeframe signals

```
Subscription.new({
  action: (
    subscribe: SubscriptionData
  ) => {},
  chart: chartKrakenEthBtc4h,
  condition: [
    ['total', '>=', '3'],
  ],
  name: 'buyEthBtcKraken',
  timeframeAny: [
    defaultTimeframe,
  ],
});
```

### `Timeframe`
Run over `intervalTime`, checking one or more `Strategy`. Matches will `Bot.despatch()` to any `Timeframe` subscribers.

```
let defaultTimeframe = Timeframe.new({
  intervalTime: 1000, // 1 second
  windowTime: 86400000 * 30, // last 30 days
  strategy: [
    stratBullishSma20Cross,
  ],
});

setTimeout(function () {
  defaultTimeframe.deactivate();
}, 2000);
```

### `Strategy` (belonging to a `Timeframe`)
One or more `Analysis` result sets, for a given `Chart`, looking for one or more `Scenario` condition matches (which can trigger an optional chained `Strategy`).

```
let stratBullishSma20Cross = Strategy.new({
  action: [
    [scenarioSma20BullishCross],
  ],
  analysis: [
    analysisSma20,
  ],
  chart: chartKrakenEthBtc4h,
  name: 'BullishSma20Cross',
});
```

### `Scenario` (belonging to a `Strategy`)
One or more sets of conditions against one or more sets of `Analysis` and/or `Chart` metrics.

```
const Sma20BullishCross = Scenario.new({
  analysis: [
    analysisSma20,
  ],
  condition: [

    // Three candles back
    [
      ['close', '<', 'outReal'],
    ],

    // Two...
    [
      ['close', '<', 'outReal'],
    ],

    // Previous candle
    [
      ['close', '>=', 'outReal'],
    ],

    // Latest candle
    [
      ['close', '>=', 'outReal'],
    ],
  ],
  name: 'scenarioSma20BullishCross',
});
```

### `Analysis` (belonging to a `Strategy` and/or `Scenario`)
A light `talib` wrapper, with configuration.

```
const analysisSma20 = Analysis.new({
  name: 'SMA20',
  config: {
    inRealField: 'close',
    optInTimePeriod: 20,
    // startIndex: 20, // Force offset of TA, to chart datapoints
  },
  type: 'SMA',
});
```

### `Chart` (belonging to an `Exchange`)
Collection of data points for a `Chart` with `Pair` of `Asset`, for a `candleTime`, updated every `pollTime`, sourced from storage.

```
let chartKrakenEthBtc4h = Chart.new({
  exchange: exchangeKraken,
  pair: pairEthBtc,
  pollTime: 300000, // 5 minutes in milliseconds
  candleTime: 14400000 // 4 hours in milliseconds
});
```

### `Asset` (belonging to a `Pair`)
TBC

```
let assetEth = Asset.new({
  exchange: exchangeKraken,
  symbol: 'ETH'
});

let assetBtc = Asset.new({
  exchange: exchangeKraken,
  symbol: 'BTC'
});

let pairEthBtc = Pair.new({
  a: assetEth,
  b: assetBtc
});
```

### `Exchange`
A potential source of `Chart` data, or destination for `Exchange` actions. I.e. based on a `Subscription` despatch to open/close a `Position`.

Support for web3 RPC nodes, will be added.

```
const exchangeKraken = Exchange.new({
  class: 'Kraken', // Defaults to `Paper` class, `Kraken` in development
  key: process.env.KRAKEN_CLIENT_KEY,
  secret: process.env.KRAKEN_CLIENT_SECRET,
});
```

## Storage
All created items (i.e. `Pair.new()`) are kept in a simple global storage system, identified by their own UUID. Using `Bot.setItem(object): uuid` and `Bot.getItem(uuid): object`

## Caveats

### `Scenario.test()`
Currrently doesn't care how many result datasets have the same output field names. If you run conditions on field names that happen to exist in more that one of the provided datasets, it will skew your `conditionMatch` count, thus invalidating your scenario. Changing all dataset output field names, would mitigate this.
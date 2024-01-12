# TradeBot
Still in very early stages of development. Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

Following a concept of timeframes with strategies, which look for scenarios (definable sets of conditions over a given number of data frames) on a combination of chart datapoints and/or technical analysis; with subscriptions for firing events (such as buy, sell, SL, etc.), based on a definable number of signals within a given timeframe.

## Update: January 2024
- Planning a candidate release for March 2024.
- YAML playbook templates to configure environments, and execute callbacks 
- Spot trading only (could expand on this later)

## Todo
- In-progress
  - JSON/YAML support for configurations
  - Expand storage interfacing (File, Memory, Redis, MongoDB, etc)
  - State persistence: Timeframe results, chart datasets, orders, asset positions, etc.
- Support for web3 exchanges
- Scenario condition percentage values (changes from previous datapoints)
- Unify log formatting for better data ingestion
- D3 UI
- Cleanup `Helper` structure

## Playbooks (YAML templates)
Bot instances can be configured using YAML templates, known as playbooks, stored in the `~/playbook/<name>/<name>.yml` directory. Replace `<name>` with actual template name.

In this example; A `subscription` callback `action` function will be imported from `~/playbook/<name>/<name>.ts`

### Running templates
Without the YML file extension.

```
npm run playbook <name>
```

See [`~/playbook/eth-btc-mockup/eth-btc-mockup.yml`](playbook/eth-btc-mockup/eth-btc-mockup.yml) for a very simple example playbook, which would sell bearish overbought and buy bullish oversold RSI conditions of ETH/BTC, on Kraken.

## Items
The concept of items, refers to all core components of the bot.
Items are listed in order of dependency.

| Item | Description |
| ---- | ----------- |
| `Exchange` | Interface with external exchanges (i.e. `Kraken`, `Uniswap`, etc.) |
| `Asset` | Identifies individual assets, tokens, across the ecosystem |
| `Pair` | Two `Asset` items, tied to an `Exchange` |
| `Position` | Information such as price, associated with a `Pair` |
| `Order` | Provides actionable context on a `Pair` and `Position` |
| `Chart` | Holds dataset information for a `Pair` |
| `Analysis` | Provides contexts of configured technical analysis |
| `Scenario` | A set of conditions, for `Chart` and/or `Analysis` |
| `Strategy` | Collection of `Scenario` against a `Chart` |
| `Timeframe` | Collection of `Strategy` within time constraints |
| `Subscription` | Collection of `Timeframe`, awaiting a set of signal conditions, to do actions (callbacks) |

### Subscription actions (callbacks)
See [`~/playbook/eth-btc-mockup/eth-btc-mockup.ts`](playbook/eth-btc-mockup/eth-btc-mockup.ts) for an example set of callbacks, reference in the `eth-btc-mockup` playbook above

### Timings
All time values are in milliseconds, with the following exceptions;

- `ChartData.closeTime` and `ChartData.openTime` are stored in seconds.
- Minutes are used when storing datasets. i.e. `240` for four hours; `storage/dataset/Kraken/ETHBTC/2023/03/18/240/`

#### Shorthand notation in playbooks
Notations `s,m,h,d,w` (i.e. `5m` for five minutes in milliseconds) are available for better readability on `Time` (i.e. `intervalTime`) suffixed fields, otherwise values are treated as milliseconds.

```yaml
chart:
  ethBtcKraken4h:
    pair: ethBtcKraken
    pollTime: 5m          # five minutes; 300000 milliseconds
    candleTime: 4h        # four hours; 14400000 milliseconds
```

### `Chart.datasetNextTime`
Is defined in order of what information is available.

- Can be set directly `Chart.datasetNextTime`
- When a dataset is added; moves to `Chart.endTime`
- Now, minus `Timeframe.windowTime`
- If available; `Chart.datasetUpdateTime`
- Otherwise; now, minus `Chart.candleTime` multiplied by `BOT_CHART_DEFAULT_TOTAL_CANDLE` (default 50)

Finally, `Chart.candleTime` is deducted from the time to ensure integrity of any existing candle delta on dataset.

### Item referencing
All items are identified in playbooks with a `name` (names are only unique to item type), which is then used to link items together.

An example `Scenario` called `rsi14BearishOverbought`, referencing `Analysis` called `rsi14`

```yaml
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

## Testing
Mocha, Chai unit test coverage. Currently tests a known dataset for strategy scenarios, against two timeframes.
```
npm test
```

## Development
```
tsc --watch
```

## Donations
If you'd like to support, and see more time dedicated to the development of this project; donations will allow me to do that, and are greatly appreciated.

#### Bitcoin
`bc1qjzxdlf0w8dn3uvr2q7d4htqzg9fx3zs66shlht`

#### Ethereum (EVM chains):
`0x18cbb0b7Cf158042C9A9e660189Db76Ec0604370`

## Structure
Here is a basic overview of how the bot is currently structured. Subject to change, as this project is still in development.

### How a `Subscription` applies to `Timeframe` changes
Available `condition` values
- `high` for the timeframe with the most amount of signals
- `low` for the timeframe with the least amount of signals
- `new` for any previously unseen signals (depends on state data passed with a `Subscription.despatch`)
- `total` for the sum of all timeframe signals

```js
Subscription.new({
  action: (
    subscribe: SubscriptionData
  ) => {},
  chart: chartKrakenEthBtc4h,
  condition: [
    ['total', '>=', '3'],
  ],
  match: 'new', // Or `all`
  name: 'buyEthBtcKraken',
  timeframeAny: [
    defaultTimeframe,
  ],
});
```

### `Timeframe`
Run over `intervalTime`, checking one or more `Strategy`. Matches will `Subscription.despatch()` to any `Timeframe` subscribers.

```js
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

```js
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

```js
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

```js
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

```js
let chartKrakenEthBtc4h = Chart.new({
  exchange: exchangeKraken,
  pair: pairEthBtc,
  pollTime: 300000, // 5 minutes in milliseconds
  candleTime: 14400000 // 4 hours in milliseconds
});
```

### `Asset` (belonging to a `Pair`)
TBC

```js
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

```js
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
# Yet Another Technical Analysis Bot (YATAB)

## Use at Your Own Risk
[See disclaimer at the end of this file, before using this project.](#disclaimer)

## What is YATAB?
This is a technical analysis, financial market trading bot (currently supports crypto markets), with support for [YAML playbook templates](#playbooks-yaml-templates), to control how and what the bot does; whether thats automated trading, or simple notifications.

Following a concept of timeframes with strategies (which can be chained together with other strategies), to look for scenarios (definable sets of conditions over a given number of data frames) on a combination of chart datapoints and/or technical analysis; with subscriptions for callbacks, based on a definable number of signals within a given timeframe.

Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

## Project status
- Planning a candidate release towards the end of 2024
- Implemented: [YAML playbook templates](#playbooks-yaml-templates)
- Spot trading only (could expand on this later)
- Storage; `File`, `Memory`, `Redis`
- Exchanges; `Paper`, `Kraken`

### In development
- Storage; `S3`, `DynamoDB`
- Exchanges; `UniswapV3`, `GeckoTerminalV2`

### Backlog
- `talib@1.1.6`
- Storage; `MongoDB`
- Exchanges; `UniswapV2`
- Testing; Mock JSON
- D3 UI
- Playbooks, helpers repo: `repo.yata.bot`

## Setup
First, you'll need to install NPM packages.
```bash
npm install
```

Then choose to use [Playbooks](#playbooks-yaml-templates), or write your own scripts using the examples shown in the [Structure](#structure) section, below.

## Playbooks (YAML templates)
Bot instances can be configured using YAML templates, known as playbooks, stored in the `~/playbook/<name>/<name>.yml` directory. Replace `<name>` with actual template name.

In this example; A `subscription` callback `action` function will be imported from `~/playbook/<name>/<name>.ts`

### Running templates
Without the YML file extension.

```bash
# NPM
npm run playbook <name>

# PNPM
pnpm playbook <name>
```

See [`~/playbook/sample-eth-btc/sample-eth-btc.yml`](playbook/sample-eth-btc/sample-eth-btc.yml) for a very simple example playbook, which would sell bearish overbought and buy bullish oversold RSI conditions of ETH/BTC, on Kraken.

## Items
The concept of items, refers to all core components of the bot.
Items are listed in order of dependency.

| Item | Description |
| ---- | ----------- |
| `Analysis` | Provides contexts of configured technical analysis |
| `Asset` | Identifies individual assets across the ecosystem |
| `Exchange` | Interface with external exchanges (i.e. `Kraken`, `Uniswap`, etc.) |
| `Pair` | Two `Asset` items, tied to an `Exchange`, tracking balances, prices |
| `Order` | Provides trade actions on `Pair` |
| `Chart` | Manage dataset information on `Pair` |
| `Scenario` | A set of conditions, against `Chart` and/or `Analysis` data |
| `Strategy` | Collection of `Scenario` against a `Chart` |
| `Timeframe` | Collection of `Strategy` within time constraints |
| `Subscription` | Collection of `Timeframe`, awaiting a set of signal conditions, to do actions (callbacks) |

### Subscription actions (callbacks)
See [`~/playbook/sample-eth-btc/sample-eth-btc.ts`](playbook/sample-eth-btc/sample-eth-btc.ts) for an example set of callbacks, reference in the `sample-eth-btc` playbook above

### `use` references

#### Examples
```yaml
use:
 # Use playbook, local file or https://repo.yata.bot/playbook?name=sample-eth-btc
 - playbook:sample-eth-btc

 # Similar to above, just using the playbook's scenario `foobar`
 - playbook:sample-eth-btc:scenario:foobar

 # Use scenario `bearish-cross` from `bull-market-support-band`, local file or https://repo.yata.bot/scenario?name=bull-market-support-band
 - scenario:bull-market-support-band:bearish-cross

 # Alternative way to define and use analysis; RSI, overriding `optInTimePeriod` (default `14`) with `28`, and `inRealField` (default `candle.close`) with `candle.open`
 - analysis:rsi28:RSI:optInTimePeriod=28:inRealField=candle.open

 # To use default RSI configuration
 - analysis:rsi14:RSI
```

#### Format
```yaml
<type>:<name>:<param0>:<param1>:...
```
- Supported `type` (required) values are; `playbook`, `scenario`, and `analysis`
- The `name` (required) value can be any alphanumeric string, with hyphens `-` or underscores `_`
- All remaining, unlimited `param` values are optional, depending on requirements.
- When `type` is `analysis`, `param0` is always the analysis type, i.e; `RSI`, `SMA`, `MACD`, etc.
- All analysis config fields and default values are defined in [`~/src/Helper/Analysis.ts`](`src/Helper/Analysis.ts`)
- Analysis config fields can be passed as `param` values, i.e. `inRealField=candle.close`

#### Notes
- Whenever referencing a `playbook` or `scenario`, all `use` references within that source, will be added to your playbook.
- A `use` reference will always update a previously defined `use` reference, with the same `type` and `name`.

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

### `Order.setQuantity()`
Quantities will always be stored as literal values, unless the quantity is a percentage value. In which case, it will operate under the follow conditions;

| Side | Last Qty. | Operation |
| ---- | --------- | ----------- |
| `Buy` | `0` | Percentage of Balance B |
| `Buy` | `> 0` | Change current order quantity, by this percentage |
| `Sell` | `0` | Percentage of Balance A |
| `Sell` | `> 0` | Change current order quantity, by this percentage |

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

The example below defines two assets; `BTC` and `USD`, the exchange `Kraken`, and a `Pair`, which consists of both assets, on the exchange. This is to allow price tracking, for these assets, specific to Kraken.

See the [Items](#Items) table above for more details on how items are related.

```yaml
asset:
  btc:
    symbol: BTC
  usd:
    symbol: USD
exchange:
  kraken:
    # More exchanges are in development; Binance, Coinbase, including decentralised options, such as Uniswap
    class: Kraken
pair:
  btcUsdKraken:
    a: btc
    b: usd
    exchange: kraken
```

### Scenarios in playbooks
When defining scenarios, we're looking for at least one condition (you can define as many as you need), across one or more candles.
Each condition can target either `Chart` candle metrics, or any associated `Analytic`.

In the example below, we're looking for the scenario where the RSI is moving to the upside, from at or below a value of `30` (oversold) on the previous candle, to the latest (current) candle, with an RSI value above `30`, where the candles current price (we use close, as it's the latest reading, until the candle closes) is `5%` higher than the previous candle close.

Alternatively, you can also use fixed values, instead of percentages. 

Example YAML templates can be found (more to be added) in: [`~/playbook/`](playbook/)

```yaml
analysis:
  rsi14:
    config:
      inRealField: close
      optInTimePeriod: 14
    type: RSI
scenario:
  # This is the name of the scenario, and would be used as a reference in strategies
  rsi14BullishOversold:
    # You'll need to define, and include any analysis below, if you're using it in the conditions below
    analysis:
      - rsi14
    condition:
      # Previous candle
      -
        # Condition 1 - RSI was below 30
        - [rsi14.outReal, '<', 30]
      # Latest candle
      -
        # Condition 1 - RSI is now 30 or higher
        - [rsi14.outReal, '>=', 30]
        # Condition 2 - price is also 5% higher than the previous candle close
        - [candle.close, '>=', 5%]
        # Or a fixed price, when the price is 42K or higher
        # - [candle.close, '>=', 42000]
```

### Scenario condition field names
If you define condition fields without prefixes (i.e `outReal` instead of `rsi14.outReal` for analysis named `rsi14`), the condition will be evaluated on all datasets that use that field name.

Use the `candle.` prefix to target only `Chart` candle metrics. Available fields; `close`, `closeTime`, `high`, `low`, `open`, `openTime`, `tradeCount`, `volume`, `vwap`

### Examples

#### Bull Market Support Band

```yaml
analysis:
  ema21:
    config:
      inRealField: close
      optInTimePeriod: 21
    type: EMA
  sma20:
    config:
      inRealField: close
      optInTimePeriod: 20
    type: SMA
scenario:
  # EMA21 crossing below the SMA20
  bearishCrossBullMarketSupportBand:
    analysis:
      - ema21
      - sma20
    condition:
      - # Previous candle - TIP: If this candle is removed, then the scenario could be used to indicate and trigger other strategies, while bullish, instead of a cross
        - [ema21.outReal, '>=', sma20.outReal]
      - # Latest candle
        - [ema21.outReal, '<', sma20.outReal]
    windowTime: 4w
  # EMA21 crossing above SMA20
  bullishCrossBullMarketSupportBand:
    analysis:
      - ema21
      - sma20
    condition:
      - # Previous candle
        - [ema21.outReal, '<', sma20.outReal]
      - # Latest candle
        - [ema21.outReal, '>=', sma20.outReal]
    windowTime: 4w
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

### ethers.js
Tested using an Anvil hardfork of local mainnet RPC.
```
anvil --fork-url http://192.168.2.3:8545 --fork-block-number 17480237 --fork-chain-id 1 --chain-id 1
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
  class: 'Kraken',
  key: process.env.KRAKEN_CLIENT_KEY,
  secret: process.env.KRAKEN_CLIENT_SECRET,
});
```

## Storage
All created items (i.e. `Pair.new()`) are kept in a simple global storage system, identified by their own UUID. Using `Bot.setItem(object): uuid` and `Bot.getItem(uuid): object`

## Web3: Fantom testnet
Notes for EVM testing.

### UniswapV2Factory `0xEE4bC42157cf65291Ba2FE839AE127e3Cc76f741`
### UniswapV2Router02 `0xa6AD18C2aC47803E193F75c3677b14BF19B94883`
### WFTM `0xf1277d1Ed8AD466beddF92ef448A132661956621`
### USDT `0xc7ddde830db19bd94dd584dcac774f0be47b29d1`

# Disclaimer

### Use at Your Own Risk

This project is provided for educational and informational purposes only. It is not intended to be used as financial, trading, or investment advice. The algorithms and technical analysis tools implemented in this bot are based on publicly available methods, but there is no guarantee that they will be accurate, profitable, or effective in any market condition.

### No Liability

I, the repository owner, do not assume any responsibility for any financial losses, damages, or issues that may arise from the use of this bot. You are solely responsible for your trading decisions and the risks associated with using automated trading tools.

### Not Financial Advice

This bot does not provide any buy/sell recommendations or market predictions. Please consult with a licensed financial advisor or conduct your own research before making any financial decisions.

### Important:

- Use this bot at your own discretion.
- Past performance is not indicative of future results.
- Ensure compliance with any relevant regulations or exchange rules.
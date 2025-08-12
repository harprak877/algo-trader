# Automated Trading Bot with Moving Average Crossover Strategy

A sophisticated Python-based automated trading bot that implements a **Dual Moving Average Crossover** strategy for paper trading. The bot features real-time signal generation, comprehensive risk management, and detailed performance analytics including **Sharpe ratio calculation**.

![Python](https://img.shields.io/badge/python-v3.9+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Features

### Strategy & Trading
- **Dual SMA Crossover Strategy**: Configurable short-term (default 20) and long-term (default 50) moving averages
- **Golden Cross & Death Cross Detection**: Automatic buy/sell signal generation
- **Multiple Data Sources**: Alpaca API with yfinance fallback
- **Real-time & Historical Data**: Support for 1m, 5m, 15m, 30m, 1h, 1d intervals

### Risk Management
- **Stop-Loss & Take-Profit**: Configurable percentage-based exits (default 3%/6%)
- **Position Sizing**: Percentage-based or fixed dollar amount position sizing
- **Capital Controls**: Maximum position limits and exposure management
- **Real-time Risk Monitoring**: Continuous position and portfolio risk assessment

### Execution & Brokers
- **Alpaca Paper Trading**: Direct integration with Alpaca's paper trading API
- **Fallback Paper Broker**: Built-in simulation when Alpaca is unavailable
- **Market Orders**: Immediate execution with real-time price feeds
- **Position Tracking**: Complete trade lifecycle management

### Analytics & Logging
- **Sharpe Ratio Calculation**: Real-time and historical performance measurement
- **Comprehensive Metrics**: Win rate, P&L, drawdown, volatility analysis
- **Trade Logging**: CSV format with full trade details and P&L tracking
- **Real-time Console Output**: Color-coded trade notifications and position updates
- **Performance Reports**: Detailed backtest results with visual indicators

### User Interface
- **CLI Interface**: Easy-to-use command-line interface
- **Live Trading Mode**: Real-time automated trading with monitoring
- **Backtesting Mode**: Historical strategy performance analysis
- **Position Monitoring**: Current portfolio status and risk metrics

## 📋 Requirements

- Python 3.9 or higher
- Internet connection for market data
- Alpaca API credentials (optional - will use paper broker fallback)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd trading-bot

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Edit `config.yaml` to customize your trading parameters:

```yaml
# Basic strategy settings
strategy:
  short_sma: 20    # Short-term SMA period
  long_sma: 50     # Long-term SMA period
  data_interval: "1h"  # Data frequency

# Trading symbols
symbols:
  - "AAPL"
  - "TSLA"
  - "SPY"

# Risk management
risk:
  stop_loss_pct: 0.03      # 3% stop loss
  take_profit_pct: 0.06    # 6% take profit
  position_size_pct: 0.25  # 25% of capital per trade

# Capital settings
capital:
  initial_balance: 100000
  position_size_type: "percentage"  # or "fixed_dollar"
```

### 3. Run a Backtest

```bash
# Run backtest with default date range
python main.py backtest

# Run backtest with custom date range
python main.py backtest --start-date 2023-01-01 --end-date 2024-01-01
```

### 4. Start Live Trading

```bash
# Start live paper trading
python main.py live
```

### 5. Check Positions

```bash
# View current positions and account status
python main.py positions
```

## 📊 Sample Backtest Output

```
📊 Starting Backtest Mode
Period: 2023-01-01 to 2024-01-01
Symbols: ['AAPL', 'TSLA', 'SPY']
Strategy: 20/50 SMA Crossover
Initial Capital: $100,000.00

📈 Backtesting AAPL...
  Signals generated: 12
📈 Backtesting TSLA...
  Signals generated: 15
📈 Backtesting SPY...
  Signals generated: 8

==================================================
📊 BACKTEST RESULTS
==================================================
Initial Capital: $100,000.00
Final Capital: $108,450.00
Total Return: 8.5%
Total P&L: $8,450.00

Total Completed Trades: 17
Winning Trades: 11
Losing Trades: 6
Win Rate: 64.7%
Average P&L per Trade: $497.06

Sharpe Ratio: 🟢 1.245
==================================================

🔄 RECENT TRADES:
💰 2023-12-15 14:30 | AAPL | $+1,250.00 (+4.2%)
💸 2023-12-18 10:15 | TSLA | $-450.00 (-1.8%)
💰 2023-12-20 16:00 | SPY | $+850.00 (+2.9%)
```

## 📈 Live Trading Output

```
🚀 Starting Live Trading Mode
Symbols: ['AAPL', 'TSLA', 'SPY']
Strategy: 20/50 SMA Crossover
Interval: 1h
Press Ctrl+C to stop

📡 SIGNAL: BUY AAPL @ $185.50 | Golden Cross: 20SMA(186.20) > 50SMA(184.80)
🔹 TRADE EXECUTED: BUY 135 AAPL @ $185.50 (Total: $25,042.50) | Reason: Golden Cross

📊 POSITION: AAPL | 135 shares @ $185.50 | Current: $187.20 | P&L: $+229.50 (+1.2%)

📡 SIGNAL: SELL AAPL @ $192.30 | Death Cross: 20SMA(191.50) < 50SMA(192.80)
🔹 TRADE EXECUTED: SELL 135 AAPL @ $192.30 (Total: $26,000.50) | P&L: $+918.00 (+3.7%)

📈 PERFORMANCE METRICS
Total Trades: 1
Win Rate: 100.0%
Total P&L: $918.00
Sharpe Ratio: 2.150
```

## 🔧 Configuration Options

### Strategy Parameters
- `short_sma`: Short-term SMA period (default: 20)
- `long_sma`: Long-term SMA period (default: 50)
- `data_interval`: Market data frequency

### Risk Management
- `stop_loss_pct`: Stop-loss percentage (default: 3%)
- `take_profit_pct`: Take-profit percentage (default: 6%)
- `position_size_pct`: Position size as % of equity (default: 25%)
- `max_positions`: Maximum concurrent positions (default: 1)

### Data Sources
- **Alpaca API**: Primary data source (requires API credentials)
- **yfinance**: Fallback data source (no credentials required)

### Alpaca Setup (Optional)
1. Create a free Alpaca account at [alpaca.markets](https://alpaca.markets)
2. Generate paper trading API credentials
3. Add to `config.yaml`:
```yaml
api:
  alpaca:
    api_key: "YOUR_API_KEY"
    secret_key: "YOUR_SECRET_KEY"
```

## 📁 Project Structure

```
trading-bot/
├── main.py              # Main CLI entry point
├── config.yaml          # Configuration file
├── data.py              # Data acquisition module
├── strategy.py          # SMA crossover strategy
├── broker.py            # Trading execution layer
├── risk.py              # Risk management module
├── logger.py            # Logging and metrics
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── trade_log.csv       # Trade history (generated)
├── metrics.csv         # Performance metrics (generated)
└── trading_bot.log     # Application logs (generated)
```

## 🎛️ CLI Commands

### Live Trading
```bash
python main.py live [--config custom_config.yaml]
```
Start real-time automated trading with continuous monitoring.

### Backtesting
```bash
python main.py backtest [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--config custom_config.yaml]
```
Run historical strategy analysis with performance metrics.

### Position Monitoring
```bash
python main.py positions [--config custom_config.yaml]
```
Display current portfolio status and risk metrics.

## 📊 Metrics & Analytics

### Key Performance Indicators
- **Sharpe Ratio**: Risk-adjusted return measurement
- **Win Rate**: Percentage of profitable trades
- **Total Return**: Overall portfolio performance
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Average P&L per Trade**: Mean profit/loss per completed trade
- **Volatility**: Annualized return standard deviation

### Sharpe Ratio Formula
```
Sharpe = (mean(returns) - risk_free_rate) / std(returns) * sqrt(252)
```
- Risk-free rate: 0% (configurable)
- Annualized using 252 trading days
- Color-coded output: 🟢 >1.0, 🟡 >0, 🔴 ≤0

## 🛡️ Risk Management Features

### Position-Level Controls
- **Stop-Loss Orders**: Automatic position exit on adverse moves
- **Take-Profit Orders**: Automatic position exit on favorable moves
- **Position Sizing**: Controlled exposure per trade
- **No Overlapping Positions**: One position per symbol maximum

### Portfolio-Level Controls
- **Maximum Positions**: Limit concurrent positions
- **Capital Allocation**: Percentage-based position sizing
- **Exposure Monitoring**: Real-time portfolio risk assessment
- **Drawdown Tracking**: Continuous peak-to-trough monitoring

## 🔍 Strategy Details

### Moving Average Crossover Logic
1. **Data Collection**: Continuous price data for configured symbols
2. **SMA Calculation**: Rolling simple moving averages
3. **Signal Generation**:
   - **Golden Cross**: Short SMA crosses above Long SMA → BUY signal
   - **Death Cross**: Short SMA crosses below Long SMA → SELL signal
4. **Signal Validation**: Risk management and position checks
5. **Order Execution**: Market orders with immediate fills
6. **Position Monitoring**: Continuous risk assessment

### Signal Quality Filters
- Minimum data requirements (55+ periods)
- Crossover confirmation (actual line crossing)
- Recent signal detection (last 5 minutes for live trading)
- Position limits and capital availability

## 🐛 Troubleshooting

### Common Issues

**"No valid symbols to trade"**
- Check internet connection
- Verify symbol names in config.yaml
- Ensure symbols have sufficient historical data

**"Alpaca API not available"**
- Install alpaca-py: `pip install alpaca-py`
- Check API credentials in config.yaml
- Bot will fallback to paper broker simulation

**"Insufficient data for [symbol]"**
- Reduce SMA periods or increase lookback_periods
- Check if symbol has data for selected interval
- Try different time intervals (1h instead of 1m)

### Debug Mode
Enable debug logging in config.yaml:
```yaml
logging:
  level: "DEBUG"
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is for educational and paper trading purposes only. It is not intended for live trading with real money. Always conduct thorough testing and understand the risks involved in algorithmic trading. The authors are not responsible for any financial losses incurred through the use of this software.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the configuration options
3. Enable debug logging for detailed information
4. Open an issue on GitHub with your configuration and error logs
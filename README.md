# 🚀 Algorithmic Trading Bot

A comprehensive algorithmic trading bot with real-time market data, live trading capabilities, and a professional web dashboard.

## ✨ Features

- **🤖 Automated Trading**: Dual SMA crossover strategy with configurable parameters
- **📊 Real-time Dashboard**: Live market charts, trading logs, and portfolio tracking
- **🔌 Multiple Data Sources**: Alpaca API integration with yfinance fallback
- **⚡ Risk Management**: Stop-loss, take-profit, and position sizing controls
- **📈 Performance Analytics**: Sharpe ratio, P&L tracking, and trade history
- **🌐 Web Interface**: Modern React frontend with real-time WebSocket updates
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Trading Engine**: Core strategy implementation and execution
- **Data Management**: Real-time market data fetching and processing
- **Risk Controls**: Position sizing and loss protection
- **WebSocket Server**: Real-time communication for live updates
- **API Endpoints**: RESTful API for trading operations

### Frontend (React/TypeScript)
- **Live Dashboard**: Real-time trading status and portfolio view
- **Market Charts**: Interactive price charts with technical indicators
- **Trading Controls**: Start/stop trading and symbol management
- **Live Logs**: Real-time trading activity and system messages
- **Responsive UI**: Modern design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Alpaca Trading Account (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/algorithmic-trading-bot.git
cd algorithmic-trading-bot
```

### 2. Backend Setup
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure trading parameters
cp config.yaml.example config.yaml
# Edit config.yaml with your settings
```

### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Start Trading
```bash
# Terminal 1: Start backend
python trading_api.py

# Terminal 2: Start frontend
npm run dev

# Open browser: http://localhost:5173/trading-dashboard.html
```

## 📁 Project Structure

```
algorithmic-trading-bot/
├── src/                    # React frontend source
│   ├── components/        # React components
│   ├── stores/           # State management (Zustand)
│   └── pages/            # Page components
├── public/                # Static assets
│   └── trading-dashboard.html  # Main dashboard
├── trading_api.py         # FastAPI backend server
├── main.py               # CLI trading bot
├── broker.py             # Trading execution
├── strategy.py           # Trading strategy logic
├── risk.py              # Risk management
├── data.py              # Data fetching
├── logger.py             # Logging and metrics
├── config.yaml           # Configuration file
└── requirements.txt      # Python dependencies
```

## 🔧 Configuration

### Trading Parameters (`config.yaml`)
```yaml
strategy:
  short_sma: 20
  long_sma: 50
  symbols: ["AAPL", "TSLA", "SPY"]

risk:
  stop_loss: 0.05
  take_profit: 0.10
  max_position_size: 0.1

alpaca:
  api_key: "your_api_key"
  secret_key: "your_secret_key"
  paper: true
```

### Environment Variables
```bash
ALPACA_API_KEY=your_api_key
ALPACA_SECRET_KEY=your_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

## 📊 Trading Strategy

The bot implements a **Dual Simple Moving Average (SMA) Crossover** strategy:

- **Buy Signal**: When short SMA crosses above long SMA
- **Sell Signal**: When short SMA crosses below long SMA
- **Risk Management**: Stop-loss and take-profit orders
- **Position Sizing**: Configurable position size limits

## 🌐 Web Dashboard

### Features
- **Live Trading Status**: Real-time bot status and session management
- **Market Charts**: Interactive price charts for each symbol
- **Trading Controls**: Start/stop trading with symbol selection
- **Live Logs**: Real-time trading activity and system messages
- **Portfolio View**: Current positions and P&L tracking
- **Performance Metrics**: Sharpe ratio, win rate, and drawdown

### Access
- **Development**: `http://localhost:5173/trading-dashboard.html`
- **Production**: Deploy to your preferred hosting service

## 🔌 API Endpoints

### Trading Operations
- `POST /api/trading/start` - Start trading session
- `POST /api/trading/stop` - Stop trading session
- `GET /api/trading/sessions` - List active sessions

### Market Data
- `GET /api/dashboard` - Dashboard data
- `GET /api/performance` - Performance metrics
- `GET /api/settings` - Bot configuration

### WebSocket
- `ws://localhost:8000/ws/trading/stream` - Real-time data stream

## 📈 Performance Tracking

The bot automatically tracks:
- **Trade History**: Entry/exit prices and timestamps
- **P&L Analysis**: Realized and unrealized gains/losses
- **Risk Metrics**: Maximum drawdown and Sharpe ratio
- **Portfolio Balance**: Cash, equity, and position values

## 🚨 Risk Warning

**⚠️ This software is for educational and research purposes only.**

- Trading involves substantial risk of loss
- Past performance does not guarantee future results
- Always test thoroughly with paper trading
- Never risk more than you can afford to lose
- Consider consulting with a financial advisor

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Alpaca Markets](https://alpaca.markets/) for trading API
- [yfinance](https://github.com/ranaroussi/yfinance) for market data
- [FastAPI](https://fastapi.tiangolo.com/) for backend framework
- [React](https://reactjs.org/) for frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/algorithmic-trading-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/algorithmic-trading-bot/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/algorithmic-trading-bot/wiki)

---

**⭐ Star this repository if you find it helpful!**

**�� Happy Trading!**

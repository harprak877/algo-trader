"""
Main entry point for the automated trading bot.
Handles CLI interface, live trading, and backtesting modes.
"""

import argparse
import yaml
import logging
import time
import signal
import sys
from datetime import datetime
from typing import Dict, List
from pathlib import Path
import pandas as pd

from data import DataProvider
from strategy import SMAStrategy, SignalType
from broker import BrokerManager, OrderSide, AlpacaBroker
from risk import RiskManager
from logger import TradeLogger
from html_report import HTMLReportGenerator
import warnings
warnings.filterwarnings('ignore', message='.*OpenSSL.*')

class TradingBot:
    """Main trading bot orchestrator."""
    
    def __init__(self, config_path: str = 'config.yaml'):
        """Initialize the trading bot with configuration."""
        self.config = self._load_config(config_path)
        self._setup_logging()
        
        # Initialize components
        self.data_provider = DataProvider(self.config)
        self.strategy = SMAStrategy(self.config)
        self.broker = BrokerManager(self.config)
        self.risk_manager = RiskManager(self.config)
        self.trade_logger = TradeLogger(self.config)
        
        # State management
        self.running = False
        self.positions_tracker = {}  # Track entry prices for P&L calculation
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        self.logger.info("Trading Bot initialized successfully")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            print(f"✅ Configuration loaded from {config_path}")
            return config
        except FileNotFoundError:
            print(f"❌ Configuration file not found: {config_path}")
            sys.exit(1)
        except yaml.YAMLError as e:
            print(f"❌ Error parsing configuration file: {e}")
            sys.exit(1)
    
    def _setup_logging(self):
        """Setup logging configuration."""
        log_level = getattr(logging, self.config['logging']['level'].upper())
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('trading_bot.log'),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger(__name__)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        self.logger.info(f"Received signal {signum}, shutting down...")
        self.running = False
    
    def _validate_symbols(self, symbols: List[str]) -> List[str]:
        """Validate trading symbols."""
        valid_symbols = []
        
        for symbol in symbols:
            if self.data_provider.validate_symbol(symbol):
                valid_symbols.append(symbol)
                self.logger.info(f"✅ Symbol validated: {symbol}")
            else:
                self.logger.warning(f"❌ Invalid symbol: {symbol}")
        
        return valid_symbols
    
    def _execute_trade(self, signal, current_price: float):
        """Execute a trade based on signal."""
        symbol = signal.symbol
        
        # Get current positions and account info
        positions = self.broker.get_positions()
        account_info = self.broker.get_account_info()
        
        # Validate trade with risk manager
        is_valid, reason = self.risk_manager.validate_trade(signal, positions, account_info)
        
        if not is_valid:
            self.logger.warning(f"Trade rejected: {reason}")
            return
        
        # Calculate position size
        if signal.signal_type == SignalType.BUY:
            position_size = self.risk_manager.calculate_position_size(
                symbol, current_price, account_info.get('equity', 0)
            )
            
            if position_size <= 0:
                self.logger.warning(f"Position size too small for {symbol}")
                return
            
            # Execute buy order
            order = self.broker.submit_order(
                symbol, OrderSide.BUY, position_size, current_price, signal.reason
            )
            
            if order.status.name == 'FILLED':
                # Track entry price for P&L calculation
                self.positions_tracker[symbol] = order.filled_price
                
                # Set risk levels
                self.risk_manager.update_risk_levels_on_entry(
                    symbol, order.filled_price, 'BUY'
                )
                
                # Log the trade
                self.trade_logger.log_trade(order, signal)
                
        elif signal.signal_type == SignalType.SELL:
            # Get current position
            position = self.broker.get_position(symbol)
            
            if position and position.quantity > 0:
                # Execute sell order
                order = self.broker.submit_order(
                    symbol, OrderSide.SELL, position.quantity, current_price, signal.reason
                )
                
                if order.status.name == 'FILLED':
                    # Calculate P&L
                    entry_price = self.positions_tracker.get(symbol, position.avg_price)
                    pnl = (order.filled_price - entry_price) * order.filled_quantity
                    
                    # Clear risk levels
                    self.risk_manager.clear_risk_levels(symbol)
                    
                    # Remove from position tracker
                    if symbol in self.positions_tracker:
                        del self.positions_tracker[symbol]
                    
                    # Log the trade with P&L
                    self.trade_logger.log_trade(order, signal, entry_price, pnl)
    
    def _check_risk_alerts(self):
        """Check for risk management alerts."""
        positions = self.broker.get_positions()
        
        for position in positions:
            symbol = position.symbol
            current_price = self.data_provider.get_latest_price(symbol)
            
            if current_price:
                alerts = self.risk_manager.check_risk_triggers(symbol, current_price, position)
                
                for alert in alerts:
                    self.trade_logger.log_risk_alert(alert)
                    
                    # Execute risk management action
                    if alert.action_required:
                        # Create a sell signal for risk management
                        from strategy import Signal
                        risk_signal = Signal(
                            symbol=symbol,
                            signal_type=SignalType.SELL,
                            timestamp=alert.timestamp,
                            price=current_price,
                            short_sma=0,  # Not applicable for risk signals
                            long_sma=0,   # Not applicable for risk signals
                            reason=alert.message
                        )
                        
                        self._execute_trade(risk_signal, current_price)
    
    def run_live_trading(self):
        """Run live trading mode."""
        print("🚀 Starting Live Trading Mode")
        print(f"Symbols: {self.config['symbols']}")
        print(f"Strategy: {self.config['strategy']['short_sma']}/{self.config['strategy']['long_sma']} SMA Crossover")
        print(f"Interval: {self.config['strategy']['data_interval']}")
        print("Press Ctrl+C to stop\n")
        
        symbols = self._validate_symbols(self.config['symbols'])
        if not symbols:
            print("❌ No valid symbols to trade")
            return
        
        self.running = True
        iteration = 0
        
        while self.running:
            try:
                iteration += 1
                self.logger.debug(f"Trading iteration {iteration}")
                
                # Get live data for all symbols
                live_data = self.data_provider.get_live_data(
                    symbols, 
                    self.config['strategy']['data_interval'],
                    lookback_periods=100
                )
                
                # Check each symbol for signals
                for symbol in symbols:
                    if symbol not in live_data or live_data[symbol].empty:
                        continue
                    
                    data = live_data[symbol]
                    
                    # Get latest signal
                    latest_signal = self.strategy.get_latest_signal(symbol, data)
                    
                    if latest_signal:
                        # Check if this is a new signal (within last few minutes)
                        time_diff = datetime.now() - latest_signal.timestamp.replace(tzinfo=None)
                        
                        if time_diff.total_seconds() < 300:  # Signal within last 5 minutes
                            self.trade_logger.log_signal(latest_signal)
                            current_price = self.data_provider.get_latest_price(symbol)
                            
                            if current_price:
                                self._execute_trade(latest_signal, current_price)
                
                # Check risk management alerts
                self._check_risk_alerts()
                
                # Update position tracking
                positions = self.broker.get_positions()
                current_prices = {}
                
                for position in positions:
                    current_price = self.data_provider.get_latest_price(position.symbol)
                    if current_price:
                        current_prices[position.symbol] = current_price
                        
                        # Update paper broker positions if needed
                        self.broker.update_paper_positions(current_prices)
                        
                        # Log position update every 10 iterations
                        if iteration % 10 == 0:
                            self.trade_logger.log_position_update(
                                position.symbol, position, current_price
                            )
                
                # Save metrics periodically
                if iteration % 50 == 0:
                    self.trade_logger.save_metrics(self.config['capital']['initial_balance'])
                
                # Sleep before next iteration
                time.sleep(60)  # Check every minute
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.logger.error(f"Error in trading loop: {e}")
                time.sleep(60)
        
        print("\n🛑 Live trading stopped")
        self.trade_logger.save_metrics(self.config['capital']['initial_balance'])
    
    def run_backtest(self, start_date: str = None, end_date: str = None):
        """Run backtesting mode."""
        start_date = start_date or self.config['backtest']['start_date']
        end_date = end_date or self.config['backtest']['end_date']
        
        print("📊 Starting Backtest Mode")
        print(f"Period: {start_date} to {end_date}")
        print(f"Symbols: {self.config['symbols']}")
        print(f"Strategy: {self.config['strategy']['short_sma']}/{self.config['strategy']['long_sma']} SMA Crossover")
        print(f"Initial Capital: ${self.config['capital']['initial_balance']:,.2f}\n")
        
        symbols = self._validate_symbols(self.config['symbols'])
        if not symbols:
            print("❌ No valid symbols to backtest")
            return
        
        # Initialize paper broker for backtesting
        from broker import PaperBroker
        backtest_broker = PaperBroker(self.config['capital']['initial_balance'])
        
        all_trades = []
        all_signals = []
        
        for symbol in symbols:
            print(f"📈 Backtesting {symbol}...")
            
            # Get historical data
            historical_data = self.data_provider.get_historical_data(
                symbol, start_date, end_date, self.config['strategy']['data_interval']
            )
            
            if historical_data.empty:
                print(f"❌ No data available for {symbol}")
                continue
            
            # Generate signals
            signals, stats = self.strategy.backtest_signals(symbol, historical_data)
            all_signals.extend(signals)
            
            print(f"  Signals generated: {len(signals)}")
            
            # Simulate trades
            position = None
            entry_price = None
            
            for signal in signals:
                current_price = signal.price
                
                if signal.signal_type == SignalType.BUY and position is None:
                    # Calculate position size
                    account_info = {'equity': backtest_broker.balance}
                    position_size = self.risk_manager.calculate_position_size(
                        symbol, current_price, account_info['equity']
                    )
                    
                    if position_size > 0:
                        # Execute buy
                        order = backtest_broker.submit_order(
                            symbol, OrderSide.BUY, position_size, current_price, signal.reason
                        )
                        
                        if order.status.name == 'FILLED':
                            position = position_size
                            entry_price = current_price
                            # Log the trade
                            self.trade_logger.log_trade(
                                order,
                                signal=signal,
                                entry_price=current_price
                            )
                            all_trades.append({
                                'timestamp': signal.timestamp,
                                'symbol': symbol,
                                'action': 'BUY',
                                'price': current_price,
                                'quantity': position_size,
                                'reason': signal.reason
                            })
                
                elif signal.signal_type == SignalType.SELL and position is not None:
                    # Execute sell
                    order = backtest_broker.submit_order(
                        symbol, OrderSide.SELL, position, current_price, signal.reason
                    )
                    
                    if order.status.name == 'FILLED':
                        # Calculate P&L
                        pnl = (current_price - entry_price) * position
                        pnl_pct = (pnl / (position * entry_price)) * 100
                        
                        # Log the trade
                        self.trade_logger.log_trade(
                            order,
                            signal=signal,
                            entry_price=entry_price,
                            pnl=pnl
                        )
                        all_trades.append({
                            'timestamp': signal.timestamp,
                            'symbol': symbol,
                            'action': 'SELL',
                            'price': current_price,
                            'quantity': position,
                            'reason': signal.reason,
                            'pnl': pnl,
                            'pnl_pct': pnl_pct,
                            'entry_price': entry_price
                        })
                        
                        position = None
                        entry_price = None
        
        # Calculate and display results
        self._display_backtest_results(all_trades, backtest_broker)
    
    def _display_backtest_results(self, trades: List[Dict], broker):
        """Display backtest results with metrics."""
        if not trades:
            print("❌ No trades executed in backtest")
            return
        
        # Calculate metrics
        buy_trades = [t for t in trades if t['action'] == 'BUY']
        sell_trades = [t for t in trades if t['action'] == 'SELL' and 'pnl' in t]
        
        total_trades = len(sell_trades)
        winning_trades = len([t for t in sell_trades if t['pnl'] > 0])
        losing_trades = len([t for t in sell_trades if t['pnl'] < 0])
        
        if total_trades > 0:
            win_rate = winning_trades / total_trades
            total_pnl = sum(t['pnl'] for t in sell_trades)
            avg_pnl = total_pnl / total_trades
            
            # Calculate returns for Sharpe ratio
            returns = [t['pnl_pct'] / 100 for t in sell_trades]
            
            if len(returns) > 1:
                sharpe_ratio = self.trade_logger.calculate_sharpe_ratio(returns)
            else:
                sharpe_ratio = 0
            
            initial_balance = self.config['capital']['initial_balance']
            final_balance = broker.balance
            total_return = (final_balance - initial_balance) / initial_balance
            
            # Display results
            print("\n" + "="*50)
            print("📊 BACKTEST RESULTS")
            print("="*50)
            print(f"Initial Capital: ${initial_balance:,.2f}")
            print(f"Final Capital: ${final_balance:,.2f}")
            print(f"Total Return: {total_return:.1%}")
            print(f"Total P&L: ${total_pnl:,.2f}")
            print("")
            print(f"Total Completed Trades: {total_trades}")
            print(f"Winning Trades: {winning_trades}")
            print(f"Losing Trades: {losing_trades}")
            print(f"Win Rate: {win_rate:.1%}")
            print(f"Average P&L per Trade: ${avg_pnl:.2f}")
            print("")
            
            # Sharpe ratio with color
            if sharpe_ratio > 1:
                sharpe_color = "🟢"
            elif sharpe_ratio > 0:
                sharpe_color = "🟡"
            else:
                sharpe_color = "🔴"
            
            print(f"Sharpe Ratio: {sharpe_color} {sharpe_ratio:.3f}")
            print("="*50)
            
            # Show recent trades
            print("\n🔄 RECENT TRADES:")
            for trade in sell_trades[-5:]:
                pnl_emoji = "💰" if trade['pnl'] > 0 else "💸"
                print(f"{pnl_emoji} {trade['timestamp'].strftime('%Y-%m-%d %H:%M')} | "
                      f"{trade['symbol']} | ${trade['pnl']:+.2f} ({trade['pnl_pct']:+.1f}%)")
        
        else:
            print("❌ No completed trades in backtest")
    
    def show_positions(self):
        """Show current positions."""
        positions = self.broker.get_positions()
        account_info = self.broker.get_account_info()
        
        print("\n💼 ACCOUNT SUMMARY")
        print(f"${account_info.get('buying_power', 0):,.2f} is available as buying power")
        print(f"Cash Balance: ${account_info.get('cash', 0):,.2f}")
        print(f"Portfolio Value: ${account_info.get('equity', 0):,.2f}")
        
        if account_info.get('trading_blocked', False):
            print('⚠️ Account is currently restricted from trading.')
        
        if account_info.get('pattern_day_trader', False):
            print('📊 Pattern Day Trader Status: Active')
        
        print(f"\nPositions: {len(positions)}")
        
        if positions:
            print("\n📈 CURRENT POSITIONS:")
            for position in positions:
                current_price = self.data_provider.get_latest_price(position.symbol)
                if current_price:
                    risk_info = self.risk_manager.get_position_risk_info(
                        position.symbol, position, current_price
                    )
                    
                    pnl_emoji = "💰" if position.unrealized_pnl >= 0 else "💸"
                    print(f"{pnl_emoji} {position.symbol}: {position.quantity} shares @ "
                        f"${position.avg_price:.2f} | Current: ${current_price:.2f} | "
                        f"P&L: ${position.unrealized_pnl:+.2f} "
                        f"({risk_info.get('unrealized_pnl_pct', 0):+.1f}%)")
        else:
            print("\n📭 No open positions")

    def show_assets(self, symbol: str = None):
        """Show tradable assets information."""
        if isinstance(self.broker.broker, AlpacaBroker):
            assets = self.broker.broker.get_tradable_assets(symbol)
            
            if symbol:
                if assets:
                    asset = assets[0]
                    print(f"\n📈 Asset Information for {symbol}")
                    print(f"Name: {asset['name']}")
                    print(f"Exchange: {asset['exchange']}")
                    print(f"Tradable: {'✅' if asset['tradable'] else '❌'}")
                    print(f"Marginable: {'✅' if asset['marginable'] else '❌'}")
                    print(f"Shortable: {'✅' if asset['shortable'] else '❌'}")
                    print(f"Easy to Borrow: {'✅' if asset['easy_to_borrow'] else '❌'}")
                    print(f"Fractionable: {'✅' if asset['fractionable'] else '❌'}")
                else:
                    print(f"\n❌ Symbol {symbol} not found or not tradable")
            else:
                print(f"\n📊 Total Tradable Assets: {len(assets)}")
                if len(assets) > 0:
                    print("\n📈 Sample Assets (first 10):")
                    for asset in assets[:10]:
                        print(f"- {asset['symbol']}: {asset['name']} ({asset['exchange']})")
                    if len(assets) > 10:
                        print(f"... and {len(assets) - 10} more assets")
                        print(f"\n💡 Use --symbol <SYMBOL> to get detailed info for a specific asset")
        else:
            print("\n❌ Asset information only available with Alpaca broker")

    def generate_html_report(self):
        """Generate HTML report with charts and analytics."""
        try:
            # Load trade data
            if not Path(self.config['logging']['trade_log_file']).exists():
                print("❌ No trade data available for report generation")
                return
            
            trades_df = pd.read_csv(self.config['logging']['trade_log_file'])
            
            if trades_df.empty:
                print("❌ No trades found for report generation")
                return
            
            # Calculate metrics
            metrics = self.trade_logger.calculate_performance_metrics(
                self.config['capital']['initial_balance']
            )
            
            if not metrics:
                print("❌ No metrics available for report generation")
                return
            
            # Log metrics for debugging
            print("\n📊 Performance Metrics:")
            print(f"Total Trades: {metrics['total_trades']}")
            print(f"Win Rate: {metrics['win_rate']:.1%}")
            print(f"Total P&L: ${metrics['total_pnl']:.2f}")
            print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.3f}")
            print(f"Total Return: {metrics['total_return']:.1%}")
            
            # Generate HTML report
            report_generator = HTMLReportGenerator(self.config)
            report_file = report_generator.generate_report(
                trades_df, 
                metrics, 
                self.config['capital']['initial_balance']
            )
            
            print(f"✅ HTML Report generated: {report_file}")
            print(f"📊 Open the file in your browser to view charts and analytics")
            
        except Exception as e:
            print(f"❌ Error generating HTML report: {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description='Automated Trading Bot with SMA Crossover Strategy')
    parser.add_argument('mode', choices=['live', 'backtest', 'positions', 'report', 'assets'], 
                       help='Trading mode')
    parser.add_argument('--config', default='config.yaml', 
                       help='Configuration file path')
    parser.add_argument('--start-date', type=str, 
                       help='Backtest start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, 
                       help='Backtest end date (YYYY-MM-DD)')
    parser.add_argument('--symbol', type=str, 
                       help='Symbol to check (for assets mode)')
    
    args = parser.parse_args()
    
    try:
        bot = TradingBot(args.config)
        
        if args.mode == 'live':
            bot.run_live_trading()
        elif args.mode == 'backtest':
            bot.run_backtest(args.start_date, args.end_date)
        elif args.mode == 'positions':
            bot.show_positions()
        elif args.mode == 'report':
            bot.generate_html_report()
        elif args.mode == 'assets':
            bot.show_assets(args.symbol)
            
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

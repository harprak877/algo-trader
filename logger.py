"""
Logging and metrics module for the trading bot.
Handles trade logging, performance metrics, and Sharpe ratio calculation.
"""

import pandas as pd
import numpy as np
import logging
import csv
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import json

try:
    from colorama import init, Fore, Back, Style
    init()  # Initialize colorama
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False

from broker import Order, Position, OrderStatus, OrderSide
from strategy import Signal, SignalType


class TradeLogger:
    """Handles trade logging and performance tracking."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # File paths
        self.trade_log_file = config['logging']['trade_log_file']
        self.metrics_file = config['logging']['metrics_file']
        
        # Console colors
        self.use_colors = config['logging'].get('console_colors', True) and COLORAMA_AVAILABLE
        
        # Performance tracking
        self.trades = []
        self.equity_curve = []
        self.daily_returns = []
        
        # Initialize CSV files
        self._initialize_trade_log()
        self._initialize_metrics_file()
        
        self.logger.info(f"Trade Logger initialized: {self.trade_log_file}")
    
    def _initialize_trade_log(self):
        """Initialize the trade log CSV file with headers."""
        if not Path(self.trade_log_file).exists():
            with open(self.trade_log_file, 'w', newline='') as f:
                fieldnames = [
                    'timestamp', 'symbol', 'action', 'quantity', 'price', 
                    'total_value', 'reason', 'order_id', 'commission',
                    'entry_price', 'exit_price', 'pnl', 'pnl_pct'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
    
    def _initialize_metrics_file(self):
        """Initialize the metrics CSV file with headers."""
        if not Path(self.metrics_file).exists():
            with open(self.metrics_file, 'w', newline='') as f:
                fieldnames = [
                    'timestamp', 'total_trades', 'winning_trades', 'losing_trades',
                    'win_rate', 'total_pnl', 'avg_pnl_per_trade', 'sharpe_ratio',
                    'max_drawdown', 'total_return', 'volatility'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
    
    def _colorize_text(self, text: str, color: str) -> str:
        """Add color to text if colors are enabled."""
        if not self.use_colors:
            return text
        
        color_map = {
            'green': Fore.GREEN,
            'red': Fore.RED,
            'yellow': Fore.YELLOW,
            'blue': Fore.BLUE,
            'cyan': Fore.CYAN,
            'magenta': Fore.MAGENTA,
            'white': Fore.WHITE,
            'reset': Style.RESET_ALL
        }
        
        return f"{color_map.get(color, '')}{text}{Style.RESET_ALL}"
    
    def log_trade(self, order: Order, signal: Optional[Signal] = None, 
                  entry_price: Optional[float] = None, pnl: Optional[float] = None):
        """
        Log a trade to file and console.
        
        Args:
            order: Executed order
            signal: Signal that triggered the trade (optional)
            entry_price: Entry price for calculating P&L (optional)
            pnl: Realized P&L (optional)
        """
        if order.status != OrderStatus.FILLED:
            return
        
        # Calculate values
        total_value = order.filled_quantity * order.filled_price
        pnl_pct = None
        
        if entry_price and pnl:
            pnl_pct = (pnl / (order.filled_quantity * entry_price)) * 100
        
        # Prepare trade data
        trade_data = {
            'timestamp': order.timestamp.isoformat(),
            'symbol': order.symbol,
            'action': order.side.value,
            'quantity': order.filled_quantity,
            'price': order.filled_price,
            'total_value': total_value,
            'reason': signal.reason if signal else order.reason,
            'order_id': order.id,
            'commission': order.commission,
            'entry_price': entry_price or '',
            'exit_price': order.filled_price if order.side == OrderSide.SELL else '',
            'pnl': pnl or '',
            'pnl_pct': pnl_pct or ''
        }
        
        # Write to CSV
        with open(self.trade_log_file, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=trade_data.keys())
            writer.writerow(trade_data)
        
        # Console output with colors
        action_color = 'green' if order.side == OrderSide.BUY else 'red'
        action_text = self._colorize_text(order.side.value, action_color)
        
        console_msg = (f"🔹 TRADE EXECUTED: {action_text} {order.filled_quantity} "
                      f"{order.symbol} @ ${order.filled_price:.2f} "
                      f"(Total: ${total_value:.2f})")
        
        if pnl is not None:
            pnl_color = 'green' if pnl >= 0 else 'red'
            pnl_text = self._colorize_text(f"P&L: ${pnl:.2f}", pnl_color)
            if pnl_pct:
                pnl_text += self._colorize_text(f" ({pnl_pct:+.2f}%)", pnl_color)
            console_msg += f" | {pnl_text}"
        
        if signal:
            console_msg += f" | Reason: {signal.reason}"
        
        print(console_msg)
        self.logger.info(f"Trade logged: {order.side.value} {order.filled_quantity} "
                        f"{order.symbol} @ ${order.filled_price:.2f}")
        
        # Store trade for metrics calculation
        self.trades.append(trade_data)
    
    def log_position_update(self, symbol: str, position: Position, current_price: float):
        """Log position status update."""
        unrealized_pnl = position.unrealized_pnl
        unrealized_pnl_pct = (unrealized_pnl / (position.quantity * position.avg_price)) * 100
        
        pnl_color = 'green' if unrealized_pnl >= 0 else 'red'
        pnl_text = self._colorize_text(f"${unrealized_pnl:+.2f}", pnl_color)
        pnl_pct_text = self._colorize_text(f"({unrealized_pnl_pct:+.2f}%)", pnl_color)
        
        console_msg = (f"📊 POSITION: {symbol} | {position.quantity} shares @ "
                      f"${position.avg_price:.2f} | Current: ${current_price:.2f} | "
                      f"P&L: {pnl_text} {pnl_pct_text}")
        
        print(console_msg)
    
    def log_signal(self, signal: Signal):
        """Log a trading signal."""
        signal_color = 'green' if signal.signal_type == SignalType.BUY else 'red'
        signal_text = self._colorize_text(signal.signal_type.value, signal_color)
        
        console_msg = (f"📡 SIGNAL: {signal_text} {signal.symbol} @ "
                      f"${signal.price:.2f} | {signal.reason}")
        
        print(console_msg)
        self.logger.info(f"Signal generated: {signal.signal_type.value} "
                        f"{signal.symbol} @ ${signal.price:.2f}")
    
    def log_risk_alert(self, alert):
        """Log a risk management alert."""
        alert_msg = self._colorize_text(f"⚠️  RISK ALERT: {alert.message}", 'yellow')
        print(alert_msg)
        self.logger.warning(f"Risk alert: {alert.message}")
    
    def calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.0) -> float:
        """
        Calculate Sharpe ratio.
        
        Args:
            returns: List of returns (as decimals, not percentages)
            risk_free_rate: Risk-free rate (annualized)
            
        Returns:
            Sharpe ratio
        """
        if len(returns) < 2:
            return 0.0
        
        returns_array = np.array(returns)
        
        # Calculate excess returns
        excess_returns = returns_array - (risk_free_rate / 252)  # Daily risk-free rate
        
        # Calculate Sharpe ratio
        if np.std(excess_returns) == 0:
            return 0.0
        
        sharpe = np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
        return sharpe
    
    def calculate_max_drawdown(self, equity_curve: List[float]) -> float:
        """Calculate maximum drawdown from equity curve."""
        if len(equity_curve) < 2:
            return 0.0
        
        peak = equity_curve[0]
        max_drawdown = 0.0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            max_drawdown = max(max_drawdown, drawdown)
        
        return max_drawdown
    
    def calculate_performance_metrics(self, initial_balance: float) -> Dict:
        """Calculate comprehensive performance metrics."""
        if not Path(self.trade_log_file).exists():
            return {}
        
        # Load all trades from CSV
        trades_df = pd.read_csv(self.trade_log_file)
        
        # Calculate basic metrics
        total_trades = len(trades_df)
        
        # Convert numeric columns
        trades_df['pnl'] = pd.to_numeric(trades_df['pnl'], errors='coerce')
        trades_df['price'] = pd.to_numeric(trades_df['price'], errors='coerce')
        trades_df['quantity'] = pd.to_numeric(trades_df['quantity'], errors='coerce')
        trades_df['total_value'] = pd.to_numeric(trades_df['total_value'], errors='coerce')
        
        # Calculate P&L metrics
        realized_trades = trades_df[trades_df['pnl'].notna()].copy()
        
        if len(realized_trades) > 0:
            total_pnl = realized_trades['pnl'].sum()
            winning_trades = len(realized_trades[realized_trades['pnl'] > 0])
            losing_trades = len(realized_trades[realized_trades['pnl'] < 0])
            win_rate = winning_trades / len(realized_trades) if len(realized_trades) > 0 else 0
            avg_pnl_per_trade = realized_trades['pnl'].mean()
            
            # Calculate returns for Sharpe ratio
            if len(realized_trades) > 1:
                # Sort by timestamp and calculate equity curve
                realized_trades['timestamp'] = pd.to_datetime(realized_trades['timestamp'])
                realized_trades = realized_trades.sort_values('timestamp')
                
                # Create equity curve
                equity_curve = [initial_balance]
                running_balance = initial_balance
                
                for pnl in realized_trades['pnl']:
                    running_balance += pnl
                    equity_curve.append(running_balance)
                
                # Calculate daily returns
                daily_returns = []
                for i in range(1, len(equity_curve)):
                    daily_return = (equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1]
                    daily_returns.append(daily_return)
                
                # Calculate metrics
                sharpe_ratio = self.calculate_sharpe_ratio(
                    daily_returns, 
                    self.config['metrics']['risk_free_rate']
                )
                max_drawdown = self.calculate_max_drawdown(equity_curve)
                total_return = (equity_curve[-1] - initial_balance) / initial_balance
                volatility = np.std(daily_returns) * np.sqrt(252) if daily_returns else 0
            else:
                sharpe_ratio = 0
                max_drawdown = 0
                total_return = total_pnl / initial_balance
                volatility = 0
        else:
            total_pnl = 0
            winning_trades = 0
            losing_trades = 0
            win_rate = 0
            avg_pnl_per_trade = 0
            sharpe_ratio = 0
            max_drawdown = 0
            total_return = 0
            volatility = 0
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': win_rate,
            'total_pnl': total_pnl,
            'avg_pnl_per_trade': avg_pnl_per_trade,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'total_return': total_return,
            'volatility': volatility
        }
        
        return metrics
    
    def save_metrics(self, initial_balance: float):
        """Calculate and save performance metrics to file."""
        metrics = self.calculate_performance_metrics(initial_balance)
        
        if metrics:
            # Write to CSV
            with open(self.metrics_file, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=metrics.keys())
                writer.writerow(metrics)
            
            # Console output
            print(f"\n{self._colorize_text('📈 PERFORMANCE METRICS', 'cyan')}")
            print(f"Total Trades: {metrics['total_trades']}")
            print(f"Win Rate: {metrics['win_rate']:.1%}")
            print(f"Total P&L: ${metrics['total_pnl']:.2f}")
            print(f"Avg P&L per Trade: ${metrics['avg_pnl_per_trade']:.2f}")
            
            sharpe_color = 'green' if metrics['sharpe_ratio'] > 1 else 'yellow' if metrics['sharpe_ratio'] > 0 else 'red'
            sharpe_value = f"{metrics['sharpe_ratio']:.3f}"
            print(f"Sharpe Ratio: {self._colorize_text(sharpe_value, sharpe_color)}")
            
            print(f"Max Drawdown: {metrics['max_drawdown']:.1%}")
            print(f"Total Return: {metrics['total_return']:.1%}")
            print(f"Volatility: {metrics['volatility']:.1%}")
            
            self.logger.info(f"Metrics saved: Sharpe={metrics['sharpe_ratio']:.3f}, "
                           f"Return={metrics['total_return']:.1%}")
    
    def get_trade_summary(self) -> Dict:
        """Get a summary of all trades."""
        if not Path(self.trade_log_file).exists():
            return {}
        
        trades_df = pd.read_csv(self.trade_log_file)
        
        if trades_df.empty:
            return {}
        
        # Group by symbol
        symbol_summary = {}
        for symbol in trades_df['symbol'].unique():
            symbol_trades = trades_df[trades_df['symbol'] == symbol]
            
            buy_trades = symbol_trades[symbol_trades['action'] == 'BUY']
            sell_trades = symbol_trades[symbol_trades['action'] == 'SELL']
            
            symbol_summary[symbol] = {
                'total_trades': len(symbol_trades),
                'buy_trades': len(buy_trades),
                'sell_trades': len(sell_trades),
                'total_volume': symbol_trades['quantity'].sum(),
                'avg_price': symbol_trades['price'].mean()
            }
        
        return {
            'total_trades': len(trades_df),
            'symbols_traded': len(trades_df['symbol'].unique()),
            'symbol_breakdown': symbol_summary,
            'date_range': {
                'start': trades_df['timestamp'].min(),
                'end': trades_df['timestamp'].max()
            }
        }

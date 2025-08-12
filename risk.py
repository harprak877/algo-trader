"""
Risk management module for the trading bot.
Handles stop-loss, take-profit, position sizing, and risk controls.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from broker import Position, Order, OrderSide
from strategy import Signal, SignalType


class RiskTrigger(Enum):
    """Types of risk management triggers."""
    STOP_LOSS = "STOP_LOSS"
    TAKE_PROFIT = "TAKE_PROFIT"
    MAX_POSITION_LIMIT = "MAX_POSITION_LIMIT"
    INSUFFICIENT_CAPITAL = "INSUFFICIENT_CAPITAL"


@dataclass
class RiskAlert:
    """Risk management alert."""
    symbol: str
    trigger: RiskTrigger
    current_price: float
    trigger_price: float
    timestamp: datetime
    message: str
    action_required: bool = True


class RiskManager:
    """Manages risk controls and position sizing."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Risk parameters
        self.stop_loss_pct = config['risk']['stop_loss_pct']
        self.take_profit_pct = config['risk']['take_profit_pct']
        self.position_size_pct = config['risk']['position_size_pct']
        self.max_positions = config['risk']['max_positions']
        
        # Track stop loss and take profit levels
        self.stop_loss_levels = {}  # symbol -> price
        self.take_profit_levels = {}  # symbol -> price
        
        self.logger.info(f"Risk Manager initialized: SL={self.stop_loss_pct:.1%}, "
                        f"TP={self.take_profit_pct:.1%}, Size={self.position_size_pct:.1%}")
    
    def calculate_position_size(self, symbol: str, current_price: float, 
                              account_equity: float) -> int:
        """
        Calculate appropriate position size based on risk parameters.
        
        Args:
            symbol: Stock symbol
            current_price: Current stock price
            account_equity: Total account equity
            
        Returns:
            Position size in shares
        """
        if self.config['capital']['position_size_type'] == 'percentage':
            # Use percentage of equity
            position_value = account_equity * self.position_size_pct
        else:
            # Use fixed dollar amount
            position_value = self.config['capital']['fixed_dollar_amount']
        
        # Calculate shares
        shares = int(position_value / current_price)
        
        # Ensure minimum position size
        if shares < 1 and position_value >= current_price:
            shares = 1
        
        self.logger.debug(f"Calculated position size for {symbol}: {shares} shares "
                         f"(${position_value:.2f} @ ${current_price:.2f})")
        
        return shares
    
    def set_stop_loss_level(self, symbol: str, entry_price: float, side: str):
        """Set stop loss level for a position."""
        if side.upper() == 'BUY':
            # For long positions, stop loss is below entry price
            stop_loss_price = entry_price * (1 - self.stop_loss_pct)
        else:
            # For short positions, stop loss is above entry price
            stop_loss_price = entry_price * (1 + self.stop_loss_pct)
        
        self.stop_loss_levels[symbol] = stop_loss_price
        self.logger.info(f"Set stop loss for {symbol}: ${stop_loss_price:.2f} "
                        f"({self.stop_loss_pct:.1%} from ${entry_price:.2f})")
    
    def set_take_profit_level(self, symbol: str, entry_price: float, side: str):
        """Set take profit level for a position."""
        if side.upper() == 'BUY':
            # For long positions, take profit is above entry price
            take_profit_price = entry_price * (1 + self.take_profit_pct)
        else:
            # For short positions, take profit is below entry price
            take_profit_price = entry_price * (1 - self.take_profit_pct)
        
        self.take_profit_levels[symbol] = take_profit_price
        self.logger.info(f"Set take profit for {symbol}: ${take_profit_price:.2f} "
                        f"({self.take_profit_pct:.1%} from ${entry_price:.2f})")
    
    def check_risk_triggers(self, symbol: str, current_price: float, 
                           position: Optional[Position] = None) -> List[RiskAlert]:
        """
        Check if any risk management triggers are hit.
        
        Args:
            symbol: Stock symbol
            current_price: Current market price
            position: Current position (if any)
            
        Returns:
            List of risk alerts
        """
        alerts = []
        
        if position is None or position.quantity == 0:
            return alerts
        
        # Check stop loss
        if symbol in self.stop_loss_levels:
            stop_loss_price = self.stop_loss_levels[symbol]
            
            # For long positions, stop loss triggers when price goes below stop loss
            if position.quantity > 0 and current_price <= stop_loss_price:
                alert = RiskAlert(
                    symbol=symbol,
                    trigger=RiskTrigger.STOP_LOSS,
                    current_price=current_price,
                    trigger_price=stop_loss_price,
                    timestamp=datetime.now(),
                    message=f"Stop loss triggered for {symbol}: "
                           f"${current_price:.2f} <= ${stop_loss_price:.2f}"
                )
                alerts.append(alert)
            
            # For short positions, stop loss triggers when price goes above stop loss
            elif position.quantity < 0 and current_price >= stop_loss_price:
                alert = RiskAlert(
                    symbol=symbol,
                    trigger=RiskTrigger.STOP_LOSS,
                    current_price=current_price,
                    trigger_price=stop_loss_price,
                    timestamp=datetime.now(),
                    message=f"Stop loss triggered for {symbol}: "
                           f"${current_price:.2f} >= ${stop_loss_price:.2f}"
                )
                alerts.append(alert)
        
        # Check take profit
        if symbol in self.take_profit_levels:
            take_profit_price = self.take_profit_levels[symbol]
            
            # For long positions, take profit triggers when price goes above take profit
            if position.quantity > 0 and current_price >= take_profit_price:
                alert = RiskAlert(
                    symbol=symbol,
                    trigger=RiskTrigger.TAKE_PROFIT,
                    current_price=current_price,
                    trigger_price=take_profit_price,
                    timestamp=datetime.now(),
                    message=f"Take profit triggered for {symbol}: "
                           f"${current_price:.2f} >= ${take_profit_price:.2f}"
                )
                alerts.append(alert)
            
            # For short positions, take profit triggers when price goes below take profit
            elif position.quantity < 0 and current_price <= take_profit_price:
                alert = RiskAlert(
                    symbol=symbol,
                    trigger=RiskTrigger.TAKE_PROFIT,
                    current_price=current_price,
                    trigger_price=take_profit_price,
                    timestamp=datetime.now(),
                    message=f"Take profit triggered for {symbol}: "
                           f"${current_price:.2f} <= ${take_profit_price:.2f}"
                )
                alerts.append(alert)
        
        return alerts
    
    def validate_trade(self, signal: Signal, current_positions: List[Position], 
                      account_info: Dict) -> Tuple[bool, str]:
        """
        Validate if a trade signal should be executed based on risk rules.
        
        Args:
            signal: Trading signal
            current_positions: List of current positions
            account_info: Account information
            
        Returns:
            Tuple of (is_valid, reason)
        """
        symbol = signal.symbol
        
        # Check position limits
        symbol_positions = [p for p in current_positions if p.symbol == symbol]
        
        if signal.signal_type == SignalType.BUY:
            # Check if we already have a position
            if symbol_positions and any(p.quantity > 0 for p in symbol_positions):
                return False, f"Already have long position in {symbol}"
            
            # Check position count limit
            long_positions = [p for p in current_positions if p.quantity > 0]
            if len(long_positions) >= self.max_positions:
                return False, f"Maximum positions limit reached ({self.max_positions})"
            
            # Check sufficient capital
            position_size = self.calculate_position_size(
                symbol, signal.price, account_info.get('equity', 0)
            )
            required_capital = position_size * signal.price
            available_cash = account_info.get('cash', 0)
            
            if required_capital > available_cash:
                return False, f"Insufficient capital: need ${required_capital:.2f}, have ${available_cash:.2f}"
        
        elif signal.signal_type == SignalType.SELL:
            # Check if we have a position to sell
            if not symbol_positions or not any(p.quantity > 0 for p in symbol_positions):
                return False, f"No long position to sell in {symbol}"
        
        return True, "Trade validated"
    
    def update_risk_levels_on_entry(self, symbol: str, entry_price: float, side: str):
        """Update risk levels when entering a position."""
        self.set_stop_loss_level(symbol, entry_price, side)
        self.set_take_profit_level(symbol, entry_price, side)
    
    def clear_risk_levels(self, symbol: str):
        """Clear risk levels when exiting a position."""
        if symbol in self.stop_loss_levels:
            del self.stop_loss_levels[symbol]
        if symbol in self.take_profit_levels:
            del self.take_profit_levels[symbol]
        
        self.logger.info(f"Cleared risk levels for {symbol}")
    
    def get_position_risk_info(self, symbol: str, position: Position, 
                              current_price: float) -> Dict:
        """
        Get comprehensive risk information for a position.
        
        Args:
            symbol: Stock symbol
            position: Current position
            current_price: Current market price
            
        Returns:
            Dictionary with risk information
        """
        info = {
            'symbol': symbol,
            'position_size': position.quantity,
            'entry_price': position.avg_price,
            'current_price': current_price,
            'unrealized_pnl': position.unrealized_pnl,
            'unrealized_pnl_pct': (position.unrealized_pnl / (position.quantity * position.avg_price)) * 100
        }
        
        # Add stop loss info
        if symbol in self.stop_loss_levels:
            stop_loss_price = self.stop_loss_levels[symbol]
            distance_to_stop = ((current_price - stop_loss_price) / current_price) * 100
            info.update({
                'stop_loss_price': stop_loss_price,
                'distance_to_stop_pct': distance_to_stop
            })
        
        # Add take profit info
        if symbol in self.take_profit_levels:
            take_profit_price = self.take_profit_levels[symbol]
            distance_to_target = ((take_profit_price - current_price) / current_price) * 100
            info.update({
                'take_profit_price': take_profit_price,
                'distance_to_target_pct': distance_to_target
            })
        
        return info
    
    def calculate_portfolio_risk(self, positions: List[Position], 
                               account_equity: float) -> Dict:
        """
        Calculate portfolio-level risk metrics.
        
        Args:
            positions: All current positions
            account_equity: Total account equity
            
        Returns:
            Dictionary with portfolio risk metrics
        """
        if not positions or account_equity <= 0:
            return {
                'total_exposure': 0,
                'exposure_pct': 0,
                'position_count': 0,
                'largest_position_pct': 0,
                'total_unrealized_pnl': 0
            }
        
        total_market_value = sum(abs(p.market_value) for p in positions)
        total_unrealized_pnl = sum(p.unrealized_pnl for p in positions)
        
        # Find largest position
        largest_position_value = max(abs(p.market_value) for p in positions) if positions else 0
        
        return {
            'total_exposure': total_market_value,
            'exposure_pct': (total_market_value / account_equity) * 100,
            'position_count': len(positions),
            'largest_position_pct': (largest_position_value / account_equity) * 100,
            'total_unrealized_pnl': total_unrealized_pnl,
            'unrealized_pnl_pct': (total_unrealized_pnl / account_equity) * 100
        }
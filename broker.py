"""
Broker interface for executing trades.
Supports Alpaca Paper Trading API and fallback paper broker simulation.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum
import uuid

try:
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import MarketOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce
    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    logging.warning("Alpaca Trading API not available, using simulation only")


class OrderStatus(Enum):
    """Order status types."""
    PENDING = "PENDING"
    FILLED = "FILLED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class OrderSide(Enum):
    """Order side types."""
    BUY = "BUY"
    SELL = "SELL"


@dataclass
class Order:
    """Order data structure."""
    id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    timestamp: datetime
    status: OrderStatus
    filled_price: Optional[float] = None
    filled_quantity: Optional[float] = None
    commission: float = 0.0
    reason: str = ""


@dataclass
class Position:
    """Position data structure."""
    symbol: str
    quantity: float
    avg_price: float
    market_value: float
    unrealized_pnl: float
    entry_timestamp: datetime
    last_updated: datetime


class PaperBroker:
    """Simulated paper broker for fallback trading."""
    
    def __init__(self, initial_balance: float):
        self.balance = initial_balance
        self.initial_balance = initial_balance
        self.positions = {}
        self.orders = {}
        self.trade_history = []
        self.logger = logging.getLogger(__name__)
        
    def get_account_info(self) -> Dict:
        """Get account information."""
        total_equity = self.balance
        for position in self.positions.values():
            total_equity += position.market_value
            
        return {
            'cash': self.balance,
            'equity': total_equity,
            'buying_power': self.balance,
            'positions_count': len(self.positions),
            'day_trades_remaining': 999  # Unlimited for paper trading
        }
    
    def submit_order(self, symbol: str, side: OrderSide, quantity: float, 
                    current_price: float, reason: str = "") -> Order:
        """Submit a market order."""
        order_id = str(uuid.uuid4())
        
        order = Order(
            id=order_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=current_price,
            timestamp=datetime.now(),
            status=OrderStatus.PENDING,
            reason=reason
        )
        
        # Simulate immediate fill for market orders
        if side == OrderSide.BUY:
            total_cost = quantity * current_price
            if total_cost <= self.balance:
                # Fill the order
                self.balance -= total_cost
                order.status = OrderStatus.FILLED
                order.filled_price = current_price
                order.filled_quantity = quantity
                
                # Update position
                if symbol in self.positions:
                    # Add to existing position
                    pos = self.positions[symbol]
                    total_quantity = pos.quantity + quantity
                    avg_price = ((pos.quantity * pos.avg_price) + total_cost) / total_quantity
                    pos.quantity = total_quantity
                    pos.avg_price = avg_price
                    pos.last_updated = datetime.now()
                else:
                    # Create new position
                    self.positions[symbol] = Position(
                        symbol=symbol,
                        quantity=quantity,
                        avg_price=current_price,
                        market_value=total_cost,
                        unrealized_pnl=0.0,
                        entry_timestamp=datetime.now(),
                        last_updated=datetime.now()
                    )
                
                self.logger.info(f"BUY order filled: {quantity} {symbol} @ ${current_price:.2f}")
            else:
                order.status = OrderStatus.REJECTED
                self.logger.warning(f"Insufficient funds for BUY order: {symbol}")
                
        else:  # SELL
            if symbol in self.positions and self.positions[symbol].quantity >= quantity:
                # Fill the order
                proceeds = quantity * current_price
                self.balance += proceeds
                order.status = OrderStatus.FILLED
                order.filled_price = current_price
                order.filled_quantity = quantity
                
                # Update position
                pos = self.positions[symbol]
                pos.quantity -= quantity
                pos.last_updated = datetime.now()
                
                # Remove position if fully sold
                if pos.quantity <= 0:
                    del self.positions[symbol]
                
                self.logger.info(f"SELL order filled: {quantity} {symbol} @ ${current_price:.2f}")
            else:
                order.status = OrderStatus.REJECTED
                self.logger.warning(f"Insufficient shares for SELL order: {symbol}")
        
        self.orders[order_id] = order
        if order.status == OrderStatus.FILLED:
            self.trade_history.append(order)
            
        return order
    
    def get_positions(self) -> List[Position]:
        """Get all current positions."""
        return list(self.positions.values())
    
    def get_position(self, symbol: str) -> Optional[Position]:
        """Get position for a specific symbol."""
        return self.positions.get(symbol)
    
    def update_positions_market_value(self, current_prices: Dict[str, float]):
        """Update market values of positions with current prices."""
        for symbol, position in self.positions.items():
            if symbol in current_prices:
                current_price = current_prices[symbol]
                position.market_value = position.quantity * current_price
                position.unrealized_pnl = position.market_value - (position.quantity * position.avg_price)
                position.last_updated = datetime.now()


class AlpacaBroker:
    """Alpaca Paper Trading broker."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        if not ALPACA_AVAILABLE:
            raise ImportError("Alpaca API not available")
            
        try:
            self.client = TradingClient(
                api_key=config['api']['alpaca']['api_key'],
                secret_key=config['api']['alpaca']['secret_key'],
                paper=True  # Force paper trading
            )
            self.logger.info("Alpaca paper trading client initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize Alpaca client: {e}")
            raise
    
    def get_account_info(self) -> Dict:
        """Get account information from Alpaca."""
        try:
            account = self.client.get_account()
            return {
                'cash': float(account.cash),
                'equity': float(account.equity),
                'buying_power': float(account.buying_power),
                'positions_count': len(self.client.get_all_positions()),
                'day_trades_remaining': account.daytrade_buying_power
            }
        except Exception as e:
            self.logger.error(f"Failed to get account info: {e}")
            return {}
    
    def submit_order(self, symbol: str, side: OrderSide, quantity: float, 
                    current_price: float, reason: str = "") -> Order:
        """Submit order to Alpaca."""
        try:
            # Convert to Alpaca enums
            alpaca_side = OrderSide.BUY if side == OrderSide.BUY else OrderSide.SELL
            
            market_order_data = MarketOrderRequest(
                symbol=symbol,
                qty=quantity,
                side=alpaca_side,
                time_in_force=TimeInForce.DAY
            )
            
            alpaca_order = self.client.submit_order(order_data=market_order_data)
            
            # Convert to our Order format
            order = Order(
                id=alpaca_order.id,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=current_price,
                timestamp=datetime.now(),
                status=OrderStatus.PENDING,
                reason=reason
            )
            
            self.logger.info(f"Submitted {side.value} order for {quantity} {symbol}")
            return order
            
        except Exception as e:
            self.logger.error(f"Failed to submit order: {e}")
            # Return rejected order
            return Order(
                id=str(uuid.uuid4()),
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=current_price,
                timestamp=datetime.now(),
                status=OrderStatus.REJECTED,
                reason=f"Order failed: {e}"
            )
    
    def get_positions(self) -> List[Position]:
        """Get all positions from Alpaca."""
        try:
            alpaca_positions = self.client.get_all_positions()
            positions = []
            
            for pos in alpaca_positions:
                position = Position(
                    symbol=pos.symbol,
                    quantity=float(pos.qty),
                    avg_price=float(pos.avg_cost),
                    market_value=float(pos.market_value),
                    unrealized_pnl=float(pos.unrealized_pl),
                    entry_timestamp=datetime.now(),  # Alpaca doesn't provide this
                    last_updated=datetime.now()
                )
                positions.append(position)
            
            return positions
            
        except Exception as e:
            self.logger.error(f"Failed to get positions: {e}")
            return []
    
    def get_position(self, symbol: str) -> Optional[Position]:
        """Get position for specific symbol from Alpaca."""
        try:
            alpaca_position = self.client.get_open_position(symbol)
            
            return Position(
                symbol=symbol,
                quantity=float(alpaca_position.qty),
                avg_price=float(alpaca_position.avg_cost),
                market_value=float(alpaca_position.market_value),
                unrealized_pnl=float(alpaca_position.unrealized_pl),
                entry_timestamp=datetime.now(),
                last_updated=datetime.now()
            )
            
        except Exception as e:
            # Position doesn't exist or error occurred
            return None


class BrokerManager:
    """Manages broker operations with fallback support."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.broker = None
        
        # Try to initialize Alpaca first
        if (ALPACA_AVAILABLE and 
            config['api']['alpaca']['api_key'] and 
            config['api']['alpaca']['secret_key']):
            try:
                self.broker = AlpacaBroker(config)
                self.broker_type = "alpaca"
                self.logger.info("Using Alpaca Paper Trading")
            except Exception as e:
                self.logger.warning(f"Alpaca initialization failed: {e}")
        
        # Fallback to paper broker
        if self.broker is None:
            initial_balance = config['capital']['initial_balance']
            self.broker = PaperBroker(initial_balance)
            self.broker_type = "paper"
            self.logger.info("Using Paper Broker simulation")
    
    def get_account_info(self) -> Dict:
        """Get account information."""
        return self.broker.get_account_info()
    
    def submit_order(self, symbol: str, side: OrderSide, quantity: float, 
                    current_price: float, reason: str = "") -> Order:
        """Submit an order."""
        return self.broker.submit_order(symbol, side, quantity, current_price, reason)
    
    def get_positions(self) -> List[Position]:
        """Get all positions."""
        return self.broker.get_positions()
    
    def get_position(self, symbol: str) -> Optional[Position]:
        """Get position for a specific symbol."""
        return self.broker.get_position(symbol)
    
    def has_position(self, symbol: str) -> bool:
        """Check if we have a position in the symbol."""
        position = self.get_position(symbol)
        return position is not None and position.quantity > 0
    
    def calculate_position_size(self, symbol: str, current_price: float) -> float:
        """Calculate position size based on configuration."""
        account_info = self.get_account_info()
        
        if self.config['capital']['position_size_type'] == 'percentage':
            # Use percentage of equity
            equity = account_info.get('equity', account_info.get('cash', 0))
            position_value = equity * self.config['risk']['position_size_pct']
        else:
            # Use fixed dollar amount
            position_value = self.config['capital']['fixed_dollar_amount']
        
        # Calculate quantity
        quantity = position_value / current_price
        
        # Round down to avoid insufficient funds
        return int(quantity)
    
    def update_paper_positions(self, current_prices: Dict[str, float]):
        """Update paper broker positions with current prices."""
        if self.broker_type == "paper":
            self.broker.update_positions_market_value(current_prices)
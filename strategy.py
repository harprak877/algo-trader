"""
Strategy engine for Dual Moving Average Crossover.
Implements SMA calculation and crossover signal detection.
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class SignalType(Enum):
    """Types of trading signals."""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


@dataclass
class Signal:
    """Trading signal data structure."""
    symbol: str
    signal_type: SignalType
    timestamp: pd.Timestamp
    price: float
    short_sma: float
    long_sma: float
    reason: str
    confidence: float = 1.0


class SMAStrategy:
    """Dual Simple Moving Average Crossover Strategy."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Strategy parameters
        self.short_period = config['strategy']['short_sma']
        self.long_period = config['strategy']['long_sma']
        
        # Ensure we have enough data
        self.min_periods = max(self.short_period, self.long_period) + 5
        
        # Track previous signals to detect crossovers
        self.previous_signals = {}
        
        self.logger.info(f"SMA Strategy initialized: {self.short_period}/{self.long_period}")
    
    def calculate_sma(self, data: pd.DataFrame, period: int) -> pd.Series:
        """
        Calculate Simple Moving Average.
        
        Args:
            data: DataFrame with price data
            period: SMA period
            
        Returns:
            Series with SMA values
        """
        return data['close'].rolling(window=period, min_periods=period).mean()
    
    def detect_crossover(self, short_sma: pd.Series, long_sma: pd.Series) -> pd.Series:
        """
        Detect crossover points between short and long SMA.
        
        Args:
            short_sma: Short period SMA series
            long_sma: Long period SMA series
            
        Returns:
            Series with crossover signals (1 for golden cross, -1 for death cross, 0 for no signal)
        """
        # Calculate the difference
        sma_diff = short_sma - long_sma
        
        # Detect crossovers by looking at sign changes
        crossover = np.zeros(len(sma_diff))
        
        for i in range(1, len(sma_diff)):
            if pd.isna(sma_diff.iloc[i-1]) or pd.isna(sma_diff.iloc[i]):
                continue
                
            # Golden Cross: short SMA crosses above long SMA
            if sma_diff.iloc[i-1] <= 0 and sma_diff.iloc[i] > 0:
                crossover[i] = 1
            # Death Cross: short SMA crosses below long SMA
            elif sma_diff.iloc[i-1] >= 0 and sma_diff.iloc[i] < 0:
                crossover[i] = -1
        
        return pd.Series(crossover, index=sma_diff.index)
    
    def generate_signals(self, symbol: str, data: pd.DataFrame) -> List[Signal]:
        """
        Generate trading signals for a symbol.
        
        Args:
            symbol: Stock symbol
            data: Historical price data
            
        Returns:
            List of trading signals
        """
        if data.empty or len(data) < self.min_periods:
            self.logger.warning(f"Insufficient data for {symbol}: {len(data)} periods")
            return []
        
        try:
            # Calculate SMAs
            short_sma = self.calculate_sma(data, self.short_period)
            long_sma = self.calculate_sma(data, self.long_period)
            
            # Detect crossovers
            crossovers = self.detect_crossover(short_sma, long_sma)
            
            signals = []
            
            # Generate signals from crossovers
            for i, (timestamp, crossover_value) in enumerate(crossovers.items()):
                if crossover_value == 0:
                    continue
                
                # Get current price and SMA values
                current_price = data.loc[timestamp, 'close']
                current_short_sma = short_sma.loc[timestamp]
                current_long_sma = long_sma.loc[timestamp]
                
                # Skip if SMA values are NaN
                if pd.isna(current_short_sma) or pd.isna(current_long_sma):
                    continue
                
                if crossover_value == 1:  # Golden Cross
                    signal = Signal(
                        symbol=symbol,
                        signal_type=SignalType.BUY,
                        timestamp=timestamp,
                        price=current_price,
                        short_sma=current_short_sma,
                        long_sma=current_long_sma,
                        reason=f"Golden Cross: {self.short_period}SMA({current_short_sma:.2f}) > {self.long_period}SMA({current_long_sma:.2f})"
                    )
                    signals.append(signal)
                    
                elif crossover_value == -1:  # Death Cross
                    signal = Signal(
                        symbol=symbol,
                        signal_type=SignalType.SELL,
                        timestamp=timestamp,
                        price=current_price,
                        short_sma=current_short_sma,
                        long_sma=current_long_sma,
                        reason=f"Death Cross: {self.short_period}SMA({current_short_sma:.2f}) < {self.long_period}SMA({current_long_sma:.2f})"
                    )
                    signals.append(signal)
            
            self.logger.info(f"Generated {len(signals)} signals for {symbol}")
            return signals
            
        except Exception as e:
            self.logger.error(f"Error generating signals for {symbol}: {e}")
            return []
    
    def get_latest_signal(self, symbol: str, data: pd.DataFrame) -> Optional[Signal]:
        """
        Get the most recent signal for a symbol.
        
        Args:
            symbol: Stock symbol
            data: Historical price data
            
        Returns:
            Latest signal or None
        """
        signals = self.generate_signals(symbol, data)
        if not signals:
            return None
        
        # Return the most recent signal
        return max(signals, key=lambda s: s.timestamp)
    
    def get_current_status(self, symbol: str, data: pd.DataFrame) -> Dict:
        """
        Get current market status and SMA values for a symbol.
        
        Args:
            symbol: Stock symbol
            data: Historical price data
            
        Returns:
            Dictionary with current status information
        """
        if data.empty or len(data) < self.min_periods:
            return {
                'symbol': symbol,
                'status': 'insufficient_data',
                'message': f'Need at least {self.min_periods} periods'
            }
        
        try:
            # Calculate current SMAs
            short_sma = self.calculate_sma(data, self.short_period)
            long_sma = self.calculate_sma(data, self.long_period)
            
            # Get latest values
            latest_price = data['close'].iloc[-1]
            latest_short_sma = short_sma.iloc[-1]
            latest_long_sma = long_sma.iloc[-1]
            latest_timestamp = data.index[-1]
            
            # Determine current trend
            if pd.isna(latest_short_sma) or pd.isna(latest_long_sma):
                trend = 'unknown'
            elif latest_short_sma > latest_long_sma:
                trend = 'bullish'
            else:
                trend = 'bearish'
            
            # Calculate percentage difference
            if not pd.isna(latest_short_sma) and not pd.isna(latest_long_sma):
                sma_diff_pct = ((latest_short_sma - latest_long_sma) / latest_long_sma) * 100
            else:
                sma_diff_pct = 0
            
            return {
                'symbol': symbol,
                'timestamp': latest_timestamp,
                'price': latest_price,
                'short_sma': latest_short_sma,
                'long_sma': latest_long_sma,
                'trend': trend,
                'sma_diff_pct': sma_diff_pct,
                'status': 'ready'
            }
            
        except Exception as e:
            self.logger.error(f"Error getting status for {symbol}: {e}")
            return {
                'symbol': symbol,
                'status': 'error',
                'message': str(e)
            }
    
    def backtest_signals(self, symbol: str, data: pd.DataFrame) -> Tuple[List[Signal], Dict]:
        """
        Run backtest on historical data and return signals with performance stats.
        
        Args:
            symbol: Stock symbol
            data: Historical price data
            
        Returns:
            Tuple of (signals list, performance stats)
        """
        signals = self.generate_signals(symbol, data)
        
        if not signals:
            return signals, {}
        
        # Calculate basic performance metrics
        buy_signals = [s for s in signals if s.signal_type == SignalType.BUY]
        sell_signals = [s for s in signals if s.signal_type == SignalType.SELL]
        
        stats = {
            'total_signals': len(signals),
            'buy_signals': len(buy_signals),
            'sell_signals': len(sell_signals),
            'first_signal': signals[0].timestamp if signals else None,
            'last_signal': signals[-1].timestamp if signals else None,
            'signal_frequency': len(signals) / len(data) if len(data) > 0 else 0
        }
        
        return signals, stats

"""
Data acquisition module for the trading bot.
Handles live and historical data from Alpaca API and yfinance fallback.
"""

import pandas as pd
import yfinance as yf
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time

try:
    from alpaca.data.historical import StockHistoricalDataClient
    from alpaca.data.requests import StockBarsRequest
    from alpaca.data.timeframe import TimeFrame
    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    logging.warning("Alpaca API not available, using yfinance only")


class DataProvider:
    """Handles data acquisition from multiple sources."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize Alpaca client if available
        self.alpaca_client = None
        if ALPACA_AVAILABLE and config['api']['alpaca']['api_key']:
            try:
                self.alpaca_client = StockHistoricalDataClient(
                    api_key=config['api']['alpaca']['api_key'],
                    secret_key=config['api']['alpaca']['secret_key']
                )
                self.logger.info("Alpaca data client initialized")
            except Exception as e:
                self.logger.error(f"Failed to initialize Alpaca client: {e}")
                
        # Cache for recent data
        self.data_cache = {}
        self.cache_expiry = {}
        self.cache_duration = 60  # Cache for 60 seconds
        
    def _get_alpaca_timeframe(self, interval: str) -> Optional[TimeFrame]:
        """Convert string interval to Alpaca TimeFrame."""
        timeframe_map = {
            '1m': TimeFrame.Minute,
            '5m': TimeFrame(5, TimeFrame.Unit.Minute),
            '15m': TimeFrame(15, TimeFrame.Unit.Minute),
            '30m': TimeFrame(30, TimeFrame.Unit.Minute),
            '1h': TimeFrame.Hour,
            '1d': TimeFrame.Day
        }
        return timeframe_map.get(interval)
    
    def _get_yfinance_interval(self, interval: str) -> str:
        """Convert interval to yfinance format."""
        yf_map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h',
            '1d': '1d'
        }
        return yf_map.get(interval, '1d')
    
    def get_historical_data(self, symbol: str, start_date: str, end_date: str, 
                          interval: str = '1d') -> pd.DataFrame:
        """
        Get historical data for a symbol.
        
        Args:
            symbol: Stock symbol
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            interval: Data interval
            
        Returns:
            DataFrame with OHLCV data
        """
        self.logger.info(f"Fetching historical data for {symbol} from {start_date} to {end_date}")
        
        # Try Alpaca first
        if self.alpaca_client:
            try:
                return self._get_alpaca_historical(symbol, start_date, end_date, interval)
            except Exception as e:
                self.logger.warning(f"Alpaca historical data failed: {e}, falling back to yfinance")
        
        # Fallback to yfinance
        return self._get_yfinance_historical(symbol, start_date, end_date, interval)
    
    def _get_alpaca_historical(self, symbol: str, start_date: str, end_date: str, 
                              interval: str) -> pd.DataFrame:
        """Get historical data from Alpaca."""
        timeframe = self._get_alpaca_timeframe(interval)
        if not timeframe:
            raise ValueError(f"Unsupported interval for Alpaca: {interval}")
            
        request_params = StockBarsRequest(
            symbol_or_symbols=[symbol],
            timeframe=timeframe,
            start=pd.to_datetime(start_date),
            end=pd.to_datetime(end_date)
        )
        
        bars = self.alpaca_client.get_stock_bars(request_params)
        
        # Convert to DataFrame
        data = []
        for bar in bars[symbol]:
            data.append({
                'timestamp': bar.timestamp,
                'open': bar.open,
                'high': bar.high,
                'low': bar.low,
                'close': bar.close,
                'volume': bar.volume
            })
        
        df = pd.DataFrame(data)
        df.set_index('timestamp', inplace=True)
        df.index = pd.to_datetime(df.index)
        
        return df
    
    def _get_yfinance_historical(self, symbol: str, start_date: str, end_date: str, 
                                interval: str) -> pd.DataFrame:
        """Get historical data from yfinance."""
        yf_interval = self._get_yfinance_interval(interval)
        
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date, interval=yf_interval)
        
        # Standardize column names
        df.columns = df.columns.str.lower()
        df.index.name = 'timestamp'
        
        return df
    
    def get_live_data(self, symbols: List[str], interval: str = '1m', 
                     lookback_periods: int = 100) -> Dict[str, pd.DataFrame]:
        """
        Get recent live data for symbols.
        
        Args:
            symbols: List of stock symbols
            interval: Data interval
            lookback_periods: Number of periods to fetch
            
        Returns:
            Dictionary mapping symbols to DataFrames
        """
        self.logger.info(f"Fetching live data for {symbols}")
        
        data = {}
        for symbol in symbols:
            # Check cache first
            cache_key = f"{symbol}_{interval}"
            if (cache_key in self.data_cache and 
                cache_key in self.cache_expiry and
                time.time() < self.cache_expiry[cache_key]):
                data[symbol] = self.data_cache[cache_key]
                continue
            
            try:
                # Calculate start date for lookback
                end_date = datetime.now()
                
                # Adjust lookback based on interval
                if interval in ['1m', '5m', '15m', '30m']:
                    start_date = end_date - timedelta(days=7)  # 1 week for intraday
                elif interval == '1h':
                    start_date = end_date - timedelta(days=30)  # 1 month for hourly
                else:
                    start_date = end_date - timedelta(days=365)  # 1 year for daily
                
                df = self.get_historical_data(
                    symbol, 
                    start_date.strftime('%Y-%m-%d'),
                    end_date.strftime('%Y-%m-%d'),
                    interval
                )
                
                # Keep only the last N periods
                if len(df) > lookback_periods:
                    df = df.tail(lookback_periods)
                
                data[symbol] = df
                
                # Cache the data
                self.data_cache[cache_key] = df
                self.cache_expiry[cache_key] = time.time() + self.cache_duration
                
            except Exception as e:
                self.logger.error(f"Failed to get live data for {symbol}: {e}")
                data[symbol] = pd.DataFrame()
        
        return data
    
    def get_latest_price(self, symbol: str) -> Optional[float]:
        """Get the latest price for a symbol."""
        try:
            # Try to get from recent data first
            live_data = self.get_live_data([symbol], lookback_periods=1)
            if symbol in live_data and not live_data[symbol].empty:
                return float(live_data[symbol]['close'].iloc[-1])
            
            # Fallback to yfinance current price
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return info.get('regularMarketPrice') or info.get('previousClose')
            
        except Exception as e:
            self.logger.error(f"Failed to get latest price for {symbol}: {e}")
            return None
    
    def validate_symbol(self, symbol: str) -> bool:
        """Validate if a symbol exists and has data."""
        try:
            data = self.get_live_data([symbol], lookback_periods=1)
            return symbol in data and not data[symbol].empty
        except Exception:
            return False
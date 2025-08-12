# html_report.py
"""
HTML Report Generator for Trading Bot
Generates beautiful HTML reports with charts and analytics
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Dict, List, Optional
import jinja2
import base64
import io

class HTMLReportGenerator:
    """Generates comprehensive HTML reports with charts and analytics."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.report_dir = Path("reports")
        self.report_dir.mkdir(exist_ok=True)
        
        # HTML template
        self.html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trading Bot Report - {{ report_date }}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 20px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .neutral { color: #ffc107; }
        .chart-container { padding: 20px; }
        .chart { margin: 20px 0; border-radius: 8px; overflow: hidden; }
        .trades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .trades-table th, .trades-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .trades-table th { background: #667eea; color: white; }
        .trades-table tr:nth-child(even) { background: #f8f9fa; }
        .section { padding: 20px; border-bottom: 1px solid #eee; }
        .section:last-child { border-bottom: none; }
        .section h2 { color: #333; margin-bottom: 20px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>�� Trading Bot Report</h1>
            <p>Automated Trading with SMA Crossover Strategy</p>
            <p class="timestamp">Generated on {{ report_date }}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Return</h3>
                <div class="metric-value {{ 'positive' if total_return|gt(0) else 'negative' if total_return|lt(0) else 'neutral' }}">
                    {{ "%.2f"|format(total_return * 100) }}%
                </div>
            </div>
            <div class="metric-card">
                <h3>Sharpe Ratio</h3>
                <div class="metric-value {{ 'positive' if sharpe_ratio|gt(1) else 'neutral' if sharpe_ratio|gt(0) else 'negative' }}">
                    {{ "%.3f"|format(sharpe_ratio) }}
                </div>
            </div>
            <div class="metric-card">
                <h3>Win Rate</h3>
                <div class="metric-value {{ 'positive' if win_rate|gt(0.5) else 'neutral' if win_rate|gt(0.3) else 'negative' }}">
                    {{ "%.1f"|format(win_rate * 100) }}%
                </div>
            </div>
            <div class="metric-card">
                <h3>Total P&L</h3>
                <div class="metric-value {{ 'positive' if total_pnl|gt(0) else 'negative' if total_pnl|lt(0) else 'neutral' }}">
                    ${{ "%.2f"|format(total_pnl) }}
                </div>
            </div>
            <div class="metric-card">
                <h3>Max Drawdown</h3>
                <div class="metric-value {{ 'negative' if max_drawdown|gt(0.1) else 'neutral' if max_drawdown|gt(0.05) else 'positive' }}">
                    {{ "%.2f"|format(max_drawdown * 100) }}%
                </div>
            </div>
            <div class="metric-card">
                <h3>Total Trades</h3>
                <div class="metric-value neutral">{{ total_trades }}</div>
            </div>
        </div>
        
        <div class="section">
            <h2>�� Equity Curve</h2>
            <div class="chart">
                {{ equity_chart | safe }}
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Performance Metrics</h2>
            <div class="chart">
                {{ performance_chart | safe }}
            </div>
        </div>
        
        <div class="section">
            <h2>�� Trade Analysis</h2>
            <div class="chart">
                {{ trade_analysis_chart | safe }}
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Recent Trades</h2>
            <table class="trades-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Symbol</th>
                        <th>Action</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>P&L</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {% for trade in recent_trades %}
                    <tr>
                        <td>{{ trade.timestamp }}</td>
                        <td>{{ trade.symbol }}</td>
                        <td style="color: {{ 'green' if trade.action == 'BUY' else 'red' }}">{{ trade.action }}</td>
                        <td>${{ "%.2f"|format(trade.price) }}</td>
                        <td>{{ trade.quantity }}</td>
                        <td style="color: {{ 'green' if trade.pnl and trade.pnl > 0 else 'red' if trade.pnl and trade.pnl < 0 else 'black' }}">
                            {{ "$%.2f"|format(trade.pnl) if trade.pnl else '-' }}
                        </td>
                        <td>{{ trade.reason }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>⚙️ Configuration</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <p><strong>Strategy:</strong> {{ strategy_short_sma }}/{{ strategy_long_sma }} SMA Crossover</p>
                <p><strong>Symbols:</strong> {{ symbols | join(', ') }}</p>
                <p><strong>Risk Management:</strong> {{ stop_loss_pct }}% Stop Loss, {{ take_profit_pct }}% Take Profit</p>
                <p><strong>Position Size:</strong> {{ position_size_pct }}% of capital per trade</p>
                <p><strong>Initial Capital:</strong> ${{ "%.2f"|format(initial_balance) }}</p>
            </div>
        </div>
    </div>
</body>
</html>
        """
    
    def generate_equity_chart(self, trades_df: pd.DataFrame, initial_balance: float) -> str:
        """Generate equity curve chart."""
        if trades_df.empty:
            return "<p>No trades available for equity curve.</p>"
        
        # Convert pnl to numeric and sort by timestamp
        trades_df = trades_df.copy()
        trades_df['pnl'] = pd.to_numeric(trades_df['pnl'], errors='coerce')
        trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
        trades_df = trades_df.sort_values('timestamp')
        
        # Calculate equity curve
        equity_curve = [initial_balance]
        dates = [trades_df['timestamp'].min() - timedelta(days=1)]  # Start one day before first trade
        
        running_balance = initial_balance
        for _, trade in trades_df.iterrows():
            if pd.notna(trade['pnl']):
                running_balance += trade['pnl']
            equity_curve.append(running_balance)
            dates.append(trade['timestamp'])
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=dates,
            y=equity_curve,
            mode='lines+markers',
            name='Portfolio Value',
            line=dict(color='#667eea', width=3),
            marker=dict(size=6)
        ))
        
        fig.update_layout(
            title='Portfolio Equity Curve',
            xaxis_title='Date',
            yaxis_title='Portfolio Value ($)',
            template='plotly_white',
            height=400
        )
        
        return fig.to_html(full_html=False, include_plotlyjs=False)
    
    def generate_performance_chart(self, metrics: Dict) -> str:
        """Generate performance metrics chart."""
        # Convert metrics to numeric values
        metrics_numeric = {
            'sharpe_ratio': float(metrics.get('sharpe_ratio', 0)),
            'win_rate': float(metrics.get('win_rate', 0)),
            'max_drawdown': float(metrics.get('max_drawdown', 0)),
            'total_return': float(metrics.get('total_return', 0))
        }
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Sharpe Ratio', 'Win Rate', 'Max Drawdown', 'Total Return'),
            specs=[[{"type": "indicator"}, {"type": "indicator"}],
                   [{"type": "indicator"}, {"type": "indicator"}]]
        )
        
        # Sharpe Ratio
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=metrics_numeric['sharpe_ratio'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Sharpe Ratio"},
            gauge={'axis': {'range': [None, 2]},
                   'bar': {'color': "#667eea"},
                   'steps': [{'range': [0, 1], 'color': "lightgray"},
                            {'range': [1, 2], 'color': "gray"}]}
        ), row=1, col=1)
        
        # Win Rate
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=metrics_numeric['win_rate'] * 100,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Win Rate (%)"},
            gauge={'axis': {'range': [None, 100]},
                   'bar': {'color': "#28a745"},
                   'steps': [{'range': [0, 50], 'color': "lightgray"},
                            {'range': [50, 100], 'color': "gray"}]}
        ), row=1, col=2)
        
        # Max Drawdown
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=metrics_numeric['max_drawdown'] * 100,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Max Drawdown (%)"},
            gauge={'axis': {'range': [None, 20]},
                   'bar': {'color': "#dc3545"},
                   'steps': [{'range': [0, 10], 'color': "lightgray"},
                            {'range': [10, 20], 'color': "gray"}]}
        ), row=2, col=1)
        
        # Total Return
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=metrics_numeric['total_return'] * 100,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Total Return (%)"},
            gauge={'axis': {'range': [-50, 50]},
                   'bar': {'color': "#ffc107"},
                   'steps': [{'range': [-50, 0], 'color': "lightgray"},
                            {'range': [0, 50], 'color': "gray"}]}
        ), row=2, col=2)
        
        fig.update_layout(height=600, showlegend=False)
        return fig.to_html(full_html=False, include_plotlyjs=False)
    
    def generate_trade_analysis_chart(self, trades_df: pd.DataFrame) -> str:
        """Generate trade analysis chart."""
        if trades_df.empty:
            return "<p>No trades available for analysis.</p>"
        
        # Filter completed trades and convert numeric columns
        completed_trades = trades_df[trades_df['pnl'].notna() & (trades_df['pnl'] != '')].copy()
        if completed_trades.empty:
            return "<p>No completed trades for analysis.</p>"
        
        # Convert numeric columns
        numeric_columns = ['pnl', 'price', 'quantity', 'total_value']
        for col in numeric_columns:
            completed_trades[col] = pd.to_numeric(completed_trades[col], errors='coerce')
        
        # P&L distribution
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('P&L Distribution', 'Trade Size vs P&L'),
            specs=[[{"type": "histogram"}, {"type": "scatter"}]]
        )
        
        # Histogram
        fig.add_trace(go.Histogram(
            x=completed_trades['pnl'],
            nbinsx=20,
            name='P&L Distribution',
            marker_color='#667eea'
        ), row=1, col=1)
        
        # Scatter plot
        fig.add_trace(go.Scatter(
            x=completed_trades['total_value'],
            y=completed_trades['pnl'],
            mode='markers',
            name='Trade Size vs P&L',
            marker=dict(
                color=completed_trades['pnl'],
                colorscale='RdYlGn',
                size=8
            )
        ), row=1, col=2)
        
        fig.update_layout(height=400, showlegend=False)
        return fig.to_html(full_html=False, include_plotlyjs=False)
    
    def generate_report(self, trades_df: pd.DataFrame, metrics: Dict, initial_balance: float) -> str:
        """Generate complete HTML report."""
        # Convert numeric columns and prepare data
        trades_df = trades_df.copy()
        trades_df['pnl'] = pd.to_numeric(trades_df['pnl'], errors='coerce')
        trades_df['price'] = pd.to_numeric(trades_df['price'], errors='coerce')
        trades_df['quantity'] = pd.to_numeric(trades_df['quantity'], errors='coerce')
        trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
        trades_df = trades_df.sort_values('timestamp', ascending=False)
        
        # Get recent trades
        recent_trades = []
        for _, trade in trades_df.head(10).iterrows():
            recent_trades.append({
                'timestamp': trade['timestamp'].strftime("%Y-%m-%d %H:%M:%S"),
                'symbol': trade['symbol'],
                'action': trade['action'],
                'price': float(trade['price']) if pd.notna(trade['price']) else 0,
                'quantity': int(trade['quantity']) if pd.notna(trade['quantity']) else 0,
                'pnl': float(trade['pnl']) if pd.notna(trade['pnl']) else '',
                'reason': trade['reason']
            })
        
        # Generate charts
        equity_chart = self.generate_equity_chart(trades_df, initial_balance)
        performance_chart = self.generate_performance_chart(metrics)
        trade_analysis_chart = self.generate_trade_analysis_chart(trades_df)
        
        # Ensure metrics are numeric
        metrics_with_defaults = {
            'total_return': float(metrics.get('total_return', 0)),
            'sharpe_ratio': float(metrics.get('sharpe_ratio', 0)),
            'win_rate': float(metrics.get('win_rate', 0)),
            'total_pnl': float(metrics.get('total_pnl', 0)),
            'max_drawdown': float(metrics.get('max_drawdown', 0)),
            'total_trades': int(metrics.get('total_trades', 0))
        }
        
        # Create Jinja2 environment with custom filters
        env = jinja2.Environment()
        
        # Add numeric comparison filters
        env.filters['gt'] = lambda x, y: float(x) > float(y)
        env.filters['lt'] = lambda x, y: float(x) < float(y)
        env.filters['ge'] = lambda x, y: float(x) >= float(y)
        env.filters['le'] = lambda x, y: float(x) <= float(y)
        
        # Render template
        template = env.from_string(self.html_template)
        html_content = template.render(
            report_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            total_return=metrics_with_defaults['total_return'],
            sharpe_ratio=metrics_with_defaults['sharpe_ratio'],
            win_rate=metrics_with_defaults['win_rate'],
            total_pnl=metrics_with_defaults['total_pnl'],
            max_drawdown=metrics_with_defaults['max_drawdown'],
            total_trades=metrics_with_defaults['total_trades'],
            equity_chart=equity_chart,
            performance_chart=performance_chart,
            trade_analysis_chart=trade_analysis_chart,
            recent_trades=recent_trades,
            strategy_short_sma=self.config['strategy']['short_sma'],
            strategy_long_sma=self.config['strategy']['long_sma'],
            symbols=self.config['symbols'],
            stop_loss_pct=self.config['risk']['stop_loss_pct'] * 100,
            take_profit_pct=self.config['risk']['take_profit_pct'] * 100,
            position_size_pct=self.config['risk']['position_size_pct'] * 100,
            initial_balance=initial_balance
        )
        
        # Save report
        report_file = self.report_dir / f"trading_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(report_file, 'w') as f:
            f.write(html_content)
        
        return str(report_file)
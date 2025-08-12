from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import uuid
import time
from typing import Dict, List, Optional
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Trading Bot API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class TradingStartRequest(BaseModel):
    symbols: List[str]

class TradingStopRequest(BaseModel):
    sessionId: str

class TradingResponse(BaseModel):
    sessionId: str

class StopResponse(BaseModel):
    ok: bool

# In-memory session storage
sessions: Dict[str, Dict] = {}
active_websockets: Dict[str, WebSocket] = {}

# Simulated market data generator
class MarketDataSimulator:
    def __init__(self):
        self.base_prices = {
            'AAPL': 150.0,
            'TSLA': 250.0,
            'SPY': 400.0,
            'GOOGL': 2800.0,
            'MSFT': 300.0
        }
        self.price_volatility = 0.02  # 2% volatility
    
    def generate_tick(self, symbol: str) -> dict:
        """Generate a simulated market tick"""
        import random
        
        base_price = self.base_prices.get(symbol, 100.0)
        
        # Random walk with mean reversion
        change = random.gauss(0, self.price_volatility)
        new_price = base_price * (1 + change)
        
        # Update base price for next tick
        self.base_prices[symbol] = new_price
        
        return {
            "type": "tick",
            "symbol": symbol,
            "t": int(time.time() * 1000),  # Milliseconds timestamp
            "p": round(new_price, 2)
        }

# Global market data simulator
market_simulator = MarketDataSimulator()

@app.post("/api/trading/start", response_model=TradingResponse)
async def start_trading(request: TradingStartRequest):
    """Start a new trading session"""
    try:
        logger.info(f"Starting trading session with symbols: {request.symbols}")
        
        # Validate symbols
        if not request.symbols:
            raise HTTPException(status_code=400, detail="At least one symbol is required")
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create session
        sessions[session_id] = {
            "id": session_id,
            "symbols": request.symbols,
            "status": "initialized",
            "created_at": time.time(),
            "ticks_sent": 0,
            "logs_sent": 0
        }
        
        logger.info(f"Created trading session {session_id}")
        
        return TradingResponse(sessionId=session_id)
        
    except Exception as e:
        logger.error(f"Failed to start trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trading/stop", response_model=StopResponse)
async def stop_trading(request: TradingStopRequest):
    """Stop a trading session"""
    try:
        session_id = request.sessionId
        logger.info(f"Stopping trading session: {session_id}")
        
        # Close WebSocket if active
        if session_id in active_websockets:
            websocket = active_websockets[session_id]
            await websocket.close()
            del active_websockets[session_id]
        
        # Remove session
        if session_id in sessions:
            del sessions[session_id]
        
        logger.info(f"Stopped trading session {session_id}")
        
        return StopResponse(ok=True)
        
    except Exception as e:
        logger.error(f"Failed to stop trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/trading/stream")
async def trading_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time trading data"""
    await websocket.accept()
    
    try:
        # Get session ID from query parameters
        session_id = websocket.query_params.get("sessionId")
        if not session_id:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Session ID is required"
            }))
            await websocket.close()
            return
        
        # Validate session
        if session_id not in sessions:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid session ID"
            }))
            await websocket.close()
            return
        
        # Store active WebSocket
        active_websockets[session_id] = websocket
        session = sessions[session_id]
        
        logger.info(f"WebSocket connected for session {session_id}")
        
        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "status",
            "value": "running"
        }))
        
        # Send initial log
        await websocket.send_text(json.dumps({
            "type": "log",
            "t": int(time.time() * 1000),
            "level": "info",
            "msg": f"Trading session {session_id} started with symbols: {', '.join(session['symbols'])}"
        }))
        
        # Start market data simulation
        try:
            while True:
                # Send ticks for each symbol
                for symbol in session['symbols']:
                    tick_data = market_simulator.generate_tick(symbol)
                    await websocket.send_text(json.dumps(tick_data))
                    session['ticks_sent'] += 1
                
                # Send periodic log entries
                if session['ticks_sent'] % 10 == 0:  # Every 10 ticks
                    log_entry = {
                        "type": "log",
                        "t": int(time.time() * 1000),
                        "level": "info",
                        "msg": f"Processing signals for {len(session['symbols'])} symbols - {session['ticks_sent']} ticks processed"
                    }
                    await websocket.send_text(json.dumps(log_entry))
                    session['logs_sent'] += 1
                
                # Simulate trading bot activity
                if session['ticks_sent'] % 20 == 0:  # Every 20 ticks
                    # Simulate signal generation
                    for symbol in session['symbols']:
                        import random
                        if random.random() < 0.1:  # 10% chance of signal
                            signal_type = random.choice(['BUY', 'SELL'])
                            log_entry = {
                                "type": "log",
                                "t": int(time.time() * 1000),
                                "level": "info",
                                "msg": f"Signal generated for {symbol}: {signal_type} - Price: ${market_simulator.base_prices.get(symbol, 0):.2f}"
                            }
                            await websocket.send_text(json.dumps(log_entry))
                            session['logs_sent'] += 1
                
                # Wait 1 second before next tick
                await asyncio.sleep(1)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error for session {session_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Internal error: {str(e)}"
            }))
        finally:
            # Cleanup
            if session_id in active_websockets:
                del active_websockets[session_id]
            if session_id in sessions:
                del sessions[session_id]
            logger.info(f"Cleaned up session {session_id}")
    
    except Exception as e:
        logger.error(f"WebSocket setup error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Setup error: {str(e)}"
            }))
        except:
            pass
        await websocket.close()

@app.get("/api/trading/sessions")
async def list_sessions():
    """List all active trading sessions"""
    return {
        "sessions": list(sessions.keys()),
        "active_websockets": len(active_websockets),
        "total_sessions": len(sessions)
    }

@app.get("/api/trading/session/{session_id}")
async def get_session(session_id: str):
    """Get details of a specific trading session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    session['websocket_active'] = session_id in active_websockets
    return session

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

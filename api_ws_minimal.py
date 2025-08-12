# api_ws_minimal.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="WS Minimal")

# CORS is mostly for HTTP. We keep it permissive in dev for convenience.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
async def status():
    return {"ok": True}

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    # Accept immediately. Do not gate on auth in this minimal test.
    await websocket.accept()
    try:
        await websocket.send_text("connected")
        while True:
            msg = await websocket.receive_text()
            await websocket.send_text(f"echo:{msg}")
    except WebSocketDisconnect:
        # Client closed connection
        pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("api_ws_minimal:app", host="0.0.0.0", port=port, reload=False)

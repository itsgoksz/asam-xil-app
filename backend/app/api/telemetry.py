import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.simulation_service import simulation_service

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Broadcast at 4Hz (250ms)
            if simulation_service.adapter:
                status = await simulation_service.adapter.get_status()
                if status == "running":
                    signals = await simulation_service.adapter.read_signals()
                    await websocket.send_json({
                        "type": "telemetry",
                        "timestamp": asyncio.get_event_loop().time(),
                        "data": signals
                    })
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

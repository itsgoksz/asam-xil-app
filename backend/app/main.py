from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
import asyncio

from app.api.telemetry import router as telemetry_router
from app.api.simulation import router as simulation_router
from app.api.robot import router as robot_router
from app.core.database import engine, Base
from app.services.persistence_service import persistence_service
from app.services.simulation_service import simulation_service

# Create DB tables
Base.metadata.create_all(bind=engine)

# Background task to feed the persistence buffer
async def telemetry_sampler():
    while True:
        if simulation_service.adapter:
            status = await simulation_service.adapter.get_status()
            if status == "running":
                signals = await simulation_service.adapter.read_signals()
                await persistence_service.buffer_data(signals)
        await asyncio.sleep(0.25) # Sample at 4Hz

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    persistence_service.start()
    sampler_task = asyncio.create_task(telemetry_sampler())
    yield
    # Shutdown
    sampler_task.cancel()
    persistence_service.stop()

app = FastAPI(
    title="ASAM XIL Engineering Platform API",
    description="Backend services for the deterministic simulation PoC",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry_router)
app.include_router(simulation_router, prefix="/api/simulation", tags=["simulation"])
app.include_router(robot_router, prefix="/api/robot", tags=["robot"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "components": {"database": "connected", "mock_xil": "idle"}}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

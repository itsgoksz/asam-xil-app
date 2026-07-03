import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.telemetry import TelemetryRecord
from app.services.simulation_service import simulation_service

class TelemetryPersistenceService:
    """
    Abstracts the persistence logic. 
    Buffers high-frequency telemetry in memory and persists to PostgreSQL in batches.
    Designed to be easily swappable with Kafka/Redis Streams in a production environment.
    """
    def __init__(self, batch_interval_seconds: int = 5):
        self.batch_interval = batch_interval_seconds
        self.buffer = []
        self._running = False
        self._task = None

    def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._persistence_loop())

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    def _flush_buffer_to_db(self, buffer_data):
        db: Session = SessionLocal()
        try:
            records = [TelemetryRecord(**data) for data in buffer_data]
            db.add_all(records)
            db.commit()
        except Exception as e:
            print(f"Failed to persist telemetry batch: {e}")
            db.rollback()
        finally:
            db.close()

    async def _persistence_loop(self):
        while self._running:
            # Sleep first to build up a batch
            await asyncio.sleep(self.batch_interval)
            
            # If simulation is running, we theoretically gathered data in the buffer.
            # For simplicity in this PoC, we will just sample the current state every 250ms
            # and flush it every 5s.
            if self.buffer:
                # Offload synchronous SQLite write to a thread to prevent event loop deadlock
                buffer_copy = list(self.buffer)
                self.buffer.clear()
                try:
                    await asyncio.to_thread(self._flush_buffer_to_db, buffer_copy)
                except Exception as e:
                    print(f"Failed to run db thread: {e}")

    async def buffer_data(self, data: dict):
        if self._running:
            self.buffer.append(data)

persistence_service = TelemetryPersistenceService()

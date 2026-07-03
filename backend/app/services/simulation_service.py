from app.adapters.mock_adapter import MockXILAdapter
from app.adapters.ixil_adapter import IXILAdapter

class SimulationService:
    """
    Singleton service that manages the active ASAM XIL Adapter.
    This acts as the Simulation and Signal service combined for the PoC.
    """
    _instance = None
    _adapter: IXILAdapter = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationService, cls).__new__(cls)
            cls._instance._adapter = MockXILAdapter()
        return cls._instance

    @property
    def adapter(self) -> IXILAdapter:
        return self._adapter

# Global singleton instance
simulation_service = SimulationService()

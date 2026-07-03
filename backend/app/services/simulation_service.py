from app.adapters.mock_adapter import MockXILAdapter
from app.adapters.mock_aero_adapter import MockAeroAdapter
from app.adapters.ixil_adapter import IXILAdapter
import asyncio

class SimulationService:
    """
    Singleton service that manages the active ASAM XIL Adapter.
    This acts as the Simulation and Signal service combined for the PoC.
    """
    _instance = None
    _adapter: IXILAdapter = None
    _domain: int = 0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationService, cls).__new__(cls)
            cls._instance._adapter = MockXILAdapter()
        return cls._instance

    @property
    def adapter(self) -> IXILAdapter:
        return self._adapter

    async def switch_domain(self, domain_id: int):
        if self._domain == domain_id:
            return
            
        # Stop current simulation if running
        await self._adapter.stop_simulation()
        
        self._domain = domain_id
        if domain_id == 1:
            self._adapter = MockAeroAdapter()
        else:
            self._adapter = MockXILAdapter()

# Global singleton instance
simulation_service = SimulationService()

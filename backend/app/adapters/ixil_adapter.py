from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class IXILAdapter(ABC):
    """
    Abstract interface for all ASAM XIL compliant adapters.
    This ensures that the core application never directly depends
    on a specific hardware/software implementation (e.g., dSPACE, Vector).
    """

    @abstractmethod
    async def start_simulation(self) -> None:
        """Start the simulation execution."""
        pass

    @abstractmethod
    async def stop_simulation(self) -> None:
        """Stop the simulation execution."""
        pass

    @abstractmethod
    async def read_signals(self) -> Dict[str, Any]:
        """Read all current simulation signals."""
        pass

    @abstractmethod
    async def write_signal(self, signal_name: str, value: Any) -> None:
        """Write a specific signal to the simulation."""
        pass

    @abstractmethod
    async def inject_fault(self, fault_id: str, parameters: Optional[Dict[str, Any]] = None) -> None:
        """Inject a fault into the simulation environment."""
        pass

    @abstractmethod
    async def get_status(self) -> str:
        """Get current adapter status."""
        pass

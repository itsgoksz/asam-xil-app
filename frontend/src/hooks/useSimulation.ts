import { useState, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api/simulation';

export function useSimulation(onEvent?: (time: string, severity: 'INFO' | 'WARNING' | 'ERROR' | 'PASS', message: string) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const latestConfig = useRef<{ vehicle: string, road: string, weather: string, initial_soc?: number } | null>(null);

  const triggerEvent = (severity: 'INFO' | 'WARNING' | 'ERROR' | 'PASS', message: string) => {
    if (onEvent) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      onEvent(time, severity, message);
    }
  };

  const startSimulation = async () => {
    setIsLoading(true);
    triggerEvent('INFO', 'Starting simulation...');
    try {
      if (latestConfig.current) {
        await fetch(`${API_BASE}/configure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestConfig.current),
        });
      }
      await fetch(`${API_BASE}/start`, { method: 'POST' });
      triggerEvent('PASS', 'Simulation Started Successfully');
    } catch (e) {
      triggerEvent('ERROR', 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSimulation = async () => {
    setIsLoading(true);
    triggerEvent('INFO', 'Stopping simulation...');
    try {
      await fetch(`${API_BASE}/stop`, { method: 'POST' });
      triggerEvent('INFO', 'Simulation Stopped');
    } catch (e) {
      triggerEvent('ERROR', 'Failed to stop simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const writeSignal = async (signalName: string, value: any) => {
    try {
      await fetch(`${API_BASE}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_name: signalName, value }),
      });
      triggerEvent('INFO', `Signal updated: ${signalName} = ${value}`);
    } catch (e) {
      triggerEvent('ERROR', `Failed to write signal: ${signalName}`);
    }
  };

  const loadScenario = async (scenarioId: string) => {
    try {
      await fetch(`${API_BASE}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      triggerEvent('PASS', `Scenario loaded: ${scenarioId}`);
    } catch (e) {
      triggerEvent('ERROR', `Failed to load scenario: ${scenarioId}`);
    }
  };

  const injectFault = async (faultId: string) => {
    try {
      await fetch(`${API_BASE}/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault_id: faultId }),
      });
      triggerEvent('WARNING', `Fault toggled: ${faultId}`);
    } catch (e) {
      triggerEvent('ERROR', `Failed to inject fault: ${faultId}`);
    }
  };

  const configureEnvironment = async (config: { vehicle: string, road: string, weather: string, initial_soc?: number }) => {
    latestConfig.current = config;
    try {
      await fetch(`${API_BASE}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      triggerEvent('INFO', `Digital Twin configured: ${config.vehicle} on ${config.road} in ${config.weather} (SOC: ${config.initial_soc ?? 100}%)`);
    } catch (e) {
      triggerEvent('ERROR', 'Failed to configure environment');
    }
  };

  const runRobotTest = async (testId: string = 'default') => {
    setIsLoading(true);
    triggerEvent('INFO', `Executing Robot Framework Automation (${testId})...`);
    try {
      const res = await fetch(`${API_BASE}/run-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId })
      });
      const data = await res.json();
      if (data.report.passed) {
        triggerEvent('PASS', `Test Passed: ${data.report.test_name}`);
      } else {
        triggerEvent('ERROR', `Test Failed: ${data.report.test_name}`);
      }
      return data.report;
    } catch (e) {
      triggerEvent('ERROR', 'Failed to execute Robot test');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { startSimulation, stopSimulation, writeSignal, loadScenario, injectFault, runRobotTest, configureEnvironment, isLoading };
}

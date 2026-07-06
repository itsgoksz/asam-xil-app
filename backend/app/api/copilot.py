import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

@router.post("/chat")
async def chat_with_copilot(req: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    client = genai.Client(api_key=api_key)
    
    system_prompt = """You are an ASAM-XIL simulation Copilot for an Automotive Digital Twin.
The user will ask you to create a simulation test script.
You must generate a valid Robot Framework script using ONLY these custom keywords:
- `Start Simulation`
- `Stop Simulation`
- `Configure Vehicle` (Arguments: mass, drag_coef)
- `Configure Weather` (Arguments: temperature, humidity)
- `Configure Road` (Arguments: surface, friction)
- `Set Accelerator` (Arguments: position 0-100)
- `Set Brake` (Arguments: pressure 0-150)
- `Get Telemetry` (Returns a dictionary. e.g., ${telemetry}[vehicle_speed_kmh], ${telemetry}[battery_soc])
- `Wait` (Arguments: time e.g. 5s)

Important Robot Framework Syntax:
- Always include `*** Settings ***` and `Resource    ../custom_keywords.robot` at the top.
- Define `*** Test Cases ***` and the test name.
- Ensure 4 spaces for indentation of keywords.

Respond with ONLY a raw JSON object containing exactly two keys:
1. "summary": A brief natural language explanation (1-2 sentences) of what the script does.
2. "script": The raw Robot Framework script as a multi-line string.
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_prompt + "\n\nUser Request: " + req.prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        data = json.loads(response.text)
        script_content = data.get("script", "")
        summary = data.get("summary", "")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"copilot_{timestamp}.robot"
        filepath = os.path.join(os.path.dirname(__file__), "..", "..", "robot", "test_suites", filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(script_content)
            
        return {
            "summary": summary,
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

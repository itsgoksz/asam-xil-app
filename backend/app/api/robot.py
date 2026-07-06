import os
import sys
import subprocess
import asyncio
from xml.etree import ElementTree
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter()

ROBOT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "robot")
ROBOT_TEST_SUITES_DIR = os.path.join(ROBOT_DIR, "test_suites")
ROBOT_RESULTS_DIR = os.path.join(ROBOT_DIR, "results")

# Ensure directories exist
os.makedirs(ROBOT_TEST_SUITES_DIR, exist_ok=True)
os.makedirs(ROBOT_RESULTS_DIR, exist_ok=True)

class RunScriptRequest(BaseModel):
    script_content: str | None = None

def _parse_robot_output(output_xml_path: str) -> dict:
    """Parse Robot Framework output.xml and extract structured results."""
    tree = ElementTree.parse(output_xml_path)
    root = tree.getroot()

    tests = []
    for test_elem in root.iter("test"):
        test_name = test_elem.get("name", "Unknown")
        status_elem = test_elem.find("status")
        status = status_elem.get("status", "FAIL") if status_elem is not None else "FAIL"
        
        messages = []
        for kw in test_elem.iter("kw"):
            kw_name = kw.get("name", "")
            for msg in kw.iter("msg"):
                text = msg.text or ""
                level = msg.get("level", "INFO")
                messages.append(f"[{level}] {kw_name}: {text}")
                
        for msg in test_elem.findall("msg"):
            text = msg.text or ""
            level = msg.get("level", "INFO")
            messages.append(f"[{level}] {text}")

        tests.append({
            "name": test_name,
            "status": status,
            "messages": messages,
        })

    suite_elem = root.find(".//suite/status") or root.find("status")
    overall_status = "PASS"
    if suite_elem is not None:
        overall_status = suite_elem.get("status", "FAIL")

    # If any test failed, ensure overall status is FAIL
    for test in tests:
        if test["status"] == "FAIL":
            overall_status = "FAIL"
            break

    return {"overall_status": overall_status, "tests": tests}

@router.get("/suites")
async def list_suites():
    """List all available .robot files."""
    files = []
    if os.path.exists(ROBOT_TEST_SUITES_DIR):
        for f in os.listdir(ROBOT_TEST_SUITES_DIR):
            if f.endswith(".robot"):
                files.append(f)
    if os.path.exists(ROBOT_DIR):
        for f in os.listdir(ROBOT_DIR):
            if f.endswith(".robot"):
                files.append(f)
    return {"suites": files}

def _resolve_robot_file(filename: str):
    path = os.path.join(ROBOT_TEST_SUITES_DIR, filename)
    if os.path.exists(path):
        return path
    path2 = os.path.join(ROBOT_DIR, filename)
    if os.path.exists(path2):
        return path2
    return None

@router.get("/suites/{filename}")
async def get_suite_content(filename: str):
    """Get the text content of a specific .robot file."""
    if not filename.endswith(".robot"):
        raise HTTPException(status_code=400, detail="Only .robot files allowed")
    
    filepath = _resolve_robot_file(filename)
    if not filepath:
        raise HTTPException(status_code=404, detail="File not found")
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return {"content": content}

@router.post("/run/{filename}")
async def run_robot_suite(filename: str, req: RunScriptRequest = None):
    """Run a specific test suite, optionally saving new content first."""
    if not filename.endswith(".robot"):
        raise HTTPException(status_code=400, detail="Only .robot files allowed")
        
    if filename == "custom_keywords.robot":
        return {
            "status": "error",
            "return_code": -1,
            "results": {
                "overall_status": "FAIL",
                "tests": [{"name": "Script Execution", "status": "FAIL", "messages": ["Cannot run this robot file. Only test suites can be run."]}]
            }
        }
        
    filepath = _resolve_robot_file(filename)
    if not filepath:
        # If saving a new file that doesn't exist yet, save to suites dir
        filepath = os.path.join(ROBOT_TEST_SUITES_DIR, filename)
    
    # If script_content is provided, update the file on disk before running
    if req and req.script_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(req.script_content)
            
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    output_dir = os.path.join(ROBOT_RESULTS_DIR, filename)
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Use subprocess to invoke Robot Framework to avoid import conflicts
        # with our own robot.py module name
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: subprocess.run(
                [sys.executable, "-m", "robot",
                 "--outputdir", output_dir,
                 "--loglevel", "INFO",
                 "--consolecolors", "off",
                 filepath],
                capture_output=True,
                text=True,
            ),
        )
        rc = result.returncode

        output_xml = os.path.join(output_dir, "output.xml")
        if os.path.exists(output_xml):
            parsed = _parse_robot_output(output_xml)
        else:
            # Include stderr for debugging
            error_detail = result.stderr.strip() if result.stderr else "output.xml was not generated. The script may have syntax errors."
            parsed = {
                "overall_status": "FAIL",
                "tests": [{"name": "Script Execution", "status": "FAIL", "messages": [error_detail]}],
            }

        return {
            "status": "success",
            "return_code": rc,
            "results": parsed,
        }
    except Exception as e:
        return {
            "status": "error",
            "return_code": -1,
            "results": {
                "overall_status": "FAIL",
                "tests": [{"name": "Script Execution", "status": "FAIL", "messages": [f"Execution error: {str(e)}"]}],
            },
        }

@router.get("/results")
async def list_results():
    """Scan results directory and return a summary of all available reports."""
    reports = []
    if os.path.exists(ROBOT_RESULTS_DIR):
        for suite_dir in os.listdir(ROBOT_RESULTS_DIR):
            suite_path = os.path.join(ROBOT_RESULTS_DIR, suite_dir)
            if os.path.isdir(suite_path):
                output_xml = os.path.join(suite_path, "output.xml")
                if os.path.exists(output_xml):
                    try:
                        parsed = _parse_robot_output(output_xml)
                        
                        # Get modified time of output.xml
                        timestamp = os.path.getmtime(output_xml) * 1000 # milliseconds for JS
                        
                        reports.append({
                            "suite_name": suite_dir,
                            "timestamp": timestamp,
                            "passed": parsed.get("overall_status") == "PASS",
                            "tests": [
                                {
                                    "test_name": t.get("name"),
                                    "passed": t.get("status") == "PASS",
                                    "details": " | ".join(t.get("messages", []))
                                } for t in parsed.get("tests", [])
                            ]
                        })
                    except Exception as e:
                        print(f"Failed to parse {output_xml}: {e}")
    
    # Sort by timestamp descending
    reports.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"reports": reports}

@router.get("/results/{filename}/{report_file}")
async def get_report_file(filename: str, report_file: str):
    """Serve the static report files (log.html, report.html)."""
    if report_file not in ["log.html", "report.html", "output.xml"]:
        raise HTTPException(status_code=400, detail="Invalid report file requested")
        
    filepath = os.path.join(ROBOT_RESULTS_DIR, filename, report_file)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
        
    return FileResponse(filepath)

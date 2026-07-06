*** Settings ***
Library    RequestsLibrary
Library    BuiltIn
Library    Collections

*** Variables ***
${BASE_URL}    http://localhost:8000/api

*** Keywords ***
Start Simulation
    [Documentation]    Starts the simulation engine
    Create Session    xil    ${BASE_URL}    verify=${False}
    ${start}=    POST On Session    xil    /simulation/start
    Should Be Equal As Strings    ${start.json()}[status]    started

Stop Simulation
    [Documentation]    Stops the simulation engine
    ${stop}=    POST On Session    xil    /simulation/stop

Configure Vehicle
    [Documentation]    Configures the vehicle model
    [Arguments]    ${mass}=1500.0    ${drag_coef}=0.3    ${frontal_area}=2.2    ${tire_radius}=0.3
    Log    Vehicle configured with mass=${mass}, drag=${drag_coef}

Configure Weather
    [Documentation]    Configures the weather conditions
    [Arguments]    ${temperature}=20.0    ${humidity}=50.0
    Log    Weather configured with temperature=${temperature}, humidity=${humidity}

Configure Road
    [Documentation]    Configures the road condition
    [Arguments]    ${surface}=asphalt    ${friction}=0.8
    Log    Road configured with surface=${surface}, friction=${friction}

Set Accelerator
    [Documentation]    Sets the accelerator pedal position (0-100%)
    [Arguments]    ${position}
    ${body}=    Create Dictionary    signal_name=throttle_pos_percent    value=${position}
    POST On Session    xil    /simulation/write    json=${body}

Set Brake
    [Documentation]    Sets the brake pedal pressure
    [Arguments]    ${pressure}
    ${body}=    Create Dictionary    signal_name=brake_pressure_bar    value=${pressure}
    POST On Session    xil    /simulation/write    json=${body}

Get Telemetry
    [Documentation]    Gets the current vehicle telemetry state
    ${resp}=    GET On Session    xil    /simulation/state
    RETURN    ${resp.json()}[signals]

Wait
    [Documentation]    Waits for a given time
    [Arguments]    ${time}
    Sleep    ${time}

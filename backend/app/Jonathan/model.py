from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, validator

class FaultType(str, Enum):
    media_retries          = "media_retries"
    firmware_bug_random    = "firmware_bug_random"
    gc_pause               = "gc_pause"
    mlc_variability        = "mlc_variability"
    ecc_read_retry         = "ecc_read_retry"
    firmware_bandwidth_drop= "firmware_bandwidth_drop"
    voltage_read_retry     = "voltage_read_retry"
    firmware_throttle      = "firmware_throttle"
    wear_pathology         = "wear_pathology"

class SweepParams(BaseModel):
    fault:    FaultType
    param:    str                              # compile-time symbol to sweep
    start:    int = Field(..., ge=0)
    step:     int = Field(..., gt=0)
    end:      int = Field(..., ge=0)
    extras:   Optional[List[str]] = None       # any KEY=VAL pairs

    @validator("end")
    def end_must_be_ge_start(cls, v, values):
        if "start" in values and v < values["start"]:
            raise ValueError("end must be >= start")
        return v

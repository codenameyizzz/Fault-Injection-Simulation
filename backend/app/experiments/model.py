from pydantic import BaseModel

class ExperimentParams(BaseModel):
    fault_type: str    # e.g. "firmware_tail"
    label: str         # e.g. "INJECT_PCT20"
    start_pct: int     # START value for sweep
    step_pct: int      # STEP value
    end_pct: int       # END value
    disk_id: int       # TARGET_DISK_ID
    slow_io_count: int # FTCX_SLOW_IO_COUNT
    delay_min_us: int  # DELAY_MIN_US
    delay_max_us: int  # DELAY_MAX_US
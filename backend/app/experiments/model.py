from pydantic import BaseModel

class ExperimentParams(BaseModel):
    delay: str        # e.g. "35ms"
    ops: int          # e.g. 120
    label: str        # e.g. "slowleader_mid2end35ms"
    fault_time: int   # e.g. 60

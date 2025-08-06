from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from dotenv import load_dotenv

import os
from fastapi.staticfiles import StaticFiles

from app.auth.router import router as auth_router
from app.experiments.router import router as exp_router
from app.jobs.router import router as jobs_router
from app.ssh.router import router as ssh_router
from app.Jonathan.router import router as jonathan_router

load_dotenv()
security = HTTPBearer()
app = FastAPI(title="Fault Injection API")

# === CORS (untuk akses dari Next.js) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Routers ===
app.include_router(auth_router)
app.include_router(exp_router)
app.include_router(jobs_router)
app.include_router(ssh_router)
app.include_router(jonathan_router)

# === Serve the plots directory at /plots ===
plots_path = os.path.expanduser("~/trace-ACER/trace_replayer/plots")
os.makedirs(plots_path, exist_ok=True)
app.mount("/plots", StaticFiles(directory=plots_path), name="plots")

@app.get("/")
def root():
    return {"message": "Backend FastAPI with Auth is running!"}

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Fault Injection API",
        version="1.0.0",
        description="API with JWT Authentication",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"HTTPBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

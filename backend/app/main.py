from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from dotenv import load_dotenv

from app.auth.router import router as auth_router
from app.experiments.router import router as exp_router
from app.jobs.router import router as jobs_router
from app.ssh.router import router as ssh_router

load_dotenv()
security = HTTPBearer()
app = FastAPI(title="Fault Injection API")

# === CORS (untuk akses dari Next.js) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ganti dengan domain tertentu di production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Router ===
app.include_router(auth_router)
app.include_router(exp_router)
app.include_router(jobs_router)
app.include_router(ssh_router)

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
    # Definisikan BearerAuth dengan benar
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    # Pastikan semua endpoint menggunakan security ini
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"HTTPBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

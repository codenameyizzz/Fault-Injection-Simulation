from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router

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
app.include_router(auth_router.router)

@app.get("/")
def root():
    return {"message": "Backend FastAPI with Auth is running!"}
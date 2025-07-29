# seed_mentors.py

from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth.utils import hash_password

def seed_mentors():
    # 1. Pastikan tabel sudah ter-create
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    mentors = [
        {"username": "RuidanLi", "password": "mentorpass1"},
        {"username": "HaryadiGunawi", "password": "mentorpass2"},
    ]
    for m in mentors:
        exists = db.query(User).filter(User.username == m["username"]).first()
        if not exists:
            user = User(
                username=m["username"],
                hashed_password=hash_password(m["password"]),
                role="mentor",
            )
            db.add(user)
            print(f" Menambahkan mentor: {m['username']}")
        else:
            print(f"Mentor sudah ada: {m['username']}")
    db.commit()
    db.close()
    print("Seeder mentors selesai.")

if __name__ == "__main__":
    seed_mentors()

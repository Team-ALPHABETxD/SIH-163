from app.db import Base, engine, SessionLocal
from app.services.engine import seed_modules
Base.metadata.create_all(bind=engine)
db=SessionLocal(); seed_modules(db); db.close(); print('VulnWeave database initialized.')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import Base, engine, SessionLocal
from .models import Target
from .routers.api import router
from sqlalchemy import inspect, text



def ensure_schema_columns():
    """Small forward-compatible migration for clean and previously created local DB volumes."""
    inspector = inspect(engine)
    migrations = {
        'assessment_runs': {'check_results': 'JSON'},
        'findings': {'run_id': 'VARCHAR', 'confidence': 'VARCHAR'},
        'chains': {'run_id': 'VARCHAR'},
        'reports': {'run_id': 'VARCHAR'},
    }
    with engine.begin() as conn:
        for table, columns in migrations.items():
            if not inspector.has_table(table):
                continue
            existing = {c['name'] for c in inspect(conn).get_columns(table)}
            for column, sql_type in columns.items():
                if column not in existing:
                    conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {sql_type}'))


app=FastAPI(title='VulnWeave Engine',version='1.0.0')
origins=[x.strip() for x in settings.cors_origins.split(',') if x.strip()]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
Base.metadata.create_all(bind=engine)
ensure_schema_columns()
app.include_router(router)

@app.on_event('startup')
def startup():
    db=SessionLocal()
    if not db.query(Target).first():
        db.add(Target(id='tgt-local-01',name=settings.default_target_name,url=settings.default_target_url,environment='Local Sandbox',scope=[settings.default_target_url+'/*'],request_timeout=15,max_request_rate=5,status='Ready',is_authorized=True))
        db.commit()
    db.close()

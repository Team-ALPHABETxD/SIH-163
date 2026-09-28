from fastapi import FastAPI, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app=FastAPI(title='VulnWeave Local Attack Lab')
# Intentionally insecure for LOCAL LAB ONLY. Never expose this service publicly.
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

DB='/tmp/vulnweave-lab.db'
def init():
    con=sqlite3.connect(DB); c=con.cursor(); c.execute('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT, role TEXT DEFAULT "user")')
    c.execute('SELECT COUNT(*) FROM users')
    if c.fetchone()[0]==0: c.executemany('INSERT INTO users(username,email,password,role) VALUES(?,?,?,?)',[('alice','alice@example.test','demo-password','user'),('bob','bob@example.test','demo-password','user')])
    con.commit(); con.close()
init()

@app.get('/', response_class=HTMLResponse)
def home(q: str=''):
    return f'<html><body><h1>VulnWeave Local Attack Lab</h1><p>Search: {q}</p></body></html>'

@app.post('/api/v1/auth/token')
def login(payload: dict):
    return JSONResponse({'error':'invalid credentials'}, status_code=401)

@app.get('/api/v1/users/{user_id}')
def user(user_id: int):
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row; row=con.execute('SELECT id,username,email,password,role FROM users WHERE id=?',(user_id,)).fetchone(); con.close()
    if not row: return JSONResponse({'detail':'not found'},status_code=404)
    return dict(row)

@app.patch('/api/v1/users/{user_id}')
def patch_user(user_id: int, payload: dict):
    # Intentionally vulnerable: blindly persists any field the client sends,
    # including "role" -- a classic mass-assignment / privilege-escalation bug.
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    row=con.execute('SELECT id,username,email,password,role FROM users WHERE id=?',(user_id,)).fetchone()
    if not row:
        con.close(); return JSONResponse({'detail':'not found'},status_code=404)
    merged={**dict(row), **{k:v for k,v in payload.items() if k in ('username','email','password','role')}}
    con.execute('UPDATE users SET username=?,email=?,password=?,role=? WHERE id=?',
                (merged['username'],merged['email'],merged['password'],merged['role'],user_id))
    con.commit(); con.close()
    return merged

@app.get('/api/v1/users')
def users():
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row; rows=con.execute('SELECT id,username,email,password FROM users').fetchall(); con.close(); return [dict(x) for x in rows]

@app.get('/api/v1/search')
def search(q: str=Query('')):
    # Intentionally unsafe SQL construction for the local lab. The scanner only sends a quote marker.
    con=sqlite3.connect(DB)
    try:
        query=f"SELECT id,username,email FROM users WHERE username LIKE '%{q}%'"
        rows=con.execute(query).fetchall(); return [{'id':r[0],'username':r[1],'email':r[2]} for r in rows]
    except Exception as e:
        return JSONResponse({'error':str(e)},status_code=500)
    finally: con.close()

@app.get('/api/v1/incidents')
def incidents(): return {'incidents':[{'id':1,'title':'Test Incident'}]}

@app.get('/docs-demo')
def docs_demo(): return {'openapi':'3.0.0','warning':'local lab'}

@app.get('/redirect')
def open_redirect(next: str = '/'):
    # Intentionally vulnerable: honors an attacker-controlled absolute redirect target.
    return RedirectResponse(url=next, status_code=302)

@app.get('/.env')
def leaked_env():
    # Intentionally vulnerable: simulates a misconfigured server exposing a
    # backup/config file. Lab-only fake values, never real secrets.
    return PlainTextResponse('DB_PASSWORD=lab-only-fake-secret\nJWT_SECRET=lab-only-fake-signing-key\n')

"""Lightweight, passive stack fingerprinting.

Used only to select a more relevant remediation code sample (e.g. FastAPI vs
Express vs Django) from response headers/body signatures already collected
during the normal assessment requests. No extra requests are issued.
"""
import re

SIGNATURES = [
    ("fastapi", [r"uvicorn", r"fastapi", r"starlette"]),
    ("express", [r"express", r"x-powered-by:\s*express"]),
    ("django", [r"django", r"csrftoken", r"wsgiserver"]),
    ("flask", [r"werkzeug", r"flask"]),
    ("nextjs", [r"next\.js", r"__next_data__", r"x-powered-by:\s*next\.js"]),
    ("spring", [r"jsessionid", r"spring"]),
]


def detect(headers: dict, body: str = "") -> str:
    """Returns a stack slug ('fastapi', 'express', ...) or 'generic'."""
    hay = " ".join(f"{k}: {v}" for k, v in (headers or {}).items()).lower()
    hay += " " + (body or "")[:4000].lower()
    for slug, patterns in SIGNATURES:
        for pat in patterns:
            if re.search(pat, hay, re.IGNORECASE):
                return slug
    return "generic"

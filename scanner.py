import requests
from urllib.parse import urlparse


TIMEOUT = 10


def add_finding(findings, title, severity, category, description,
                evidence, recommendation):
    findings.append({
        "title": title,
        "severity": severity,
        "category": category,
        "description": description,
        "evidence": evidence,
        "recommendation": recommendation
    })


def check_https(url, response, findings):
    parsed = urlparse(url)

    if parsed.scheme.lower() != "https":
        add_finding(
            findings,
            "Insecure HTTP Connection",
            "High",
            "A02 - Cryptographic Failures",
            "The target endpoint is accessed over HTTP instead of HTTPS.",
            f"Target URL: {url}",
            "Use HTTPS for all authenticated and sensitive communication."
        )


def check_security_headers(response, findings):
    headers = {k.lower(): v for k, v in response.headers.items()}

    required_headers = {
        "content-security-policy":
            "Helps reduce XSS and content injection risks.",

        "x-content-type-options":
            "Prevents MIME-type sniffing.",

        "x-frame-options":
            "Helps protect against clickjacking.",

        "referrer-policy":
            "Controls referrer information sent by the browser."
    }

    for header, purpose in required_headers.items():

        if header not in headers:
            add_finding(
                findings,
                f"Missing Security Header: {header}",
                "Low",
                "A05 - Security Misconfiguration",
                f"The response does not contain the {header} security header.",
                f"Missing header: {header}",
                f"Configure {header}. {purpose}"
            )


def check_cookie_security(response, findings):
    cookies = response.headers.get("Set-Cookie")

    if not cookies:
        return

    cookie_lower = cookies.lower()

    if "secure" not in cookie_lower:
        add_finding(
            findings,
            "Cookie Missing Secure Attribute",
            "Medium",
            "A05 - Security Misconfiguration",
            "A cookie was observed without the Secure attribute.",
            f"Set-Cookie: {cookies}",
            "Set the Secure attribute for cookies transmitted over HTTPS."
        )

    if "httponly" not in cookie_lower:
        add_finding(
            findings,
            "Cookie Missing HttpOnly Attribute",
            "Medium",
            "A05 - Security Misconfiguration",
            "A cookie was observed without the HttpOnly attribute.",
            f"Set-Cookie: {cookies}",
            "Use HttpOnly for cookies that do not need client-side JavaScript access."
        )

    if "samesite" not in cookie_lower:
        add_finding(
            findings,
            "Cookie Missing SameSite Attribute",
            "Low",
            "A05 - Security Misconfiguration",
            "A cookie was observed without an explicit SameSite attribute.",
            f"Set-Cookie: {cookies}",
            "Configure an appropriate SameSite policy."
        )


def check_cors(response, findings):
    acao = response.headers.get("Access-Control-Allow-Origin")

    if acao == "*":
        add_finding(
            findings,
            "Permissive CORS Configuration",
            "Medium",
            "A05 - Security Misconfiguration",
            "The endpoint allows requests from any origin.",
            "Access-Control-Allow-Origin: *",
            "Restrict allowed origins to trusted origins where appropriate."
        )


def check_server_information(response, findings):
    server = response.headers.get("Server")

    if server:
        add_finding(
            findings,
            "Server Information Disclosure",
            "Low",
            "A05 - Security Misconfiguration",
            "The response exposes server technology information.",
            f"Server: {server}",
            "Avoid unnecessarily exposing detailed server/version information."
        )


def scan_target(url):
    findings = []

    try:
        response = requests.get(
            url,
            timeout=TIMEOUT,
            allow_redirects=True
        )

        check_https(url, response, findings)
        check_security_headers(response, findings)
        check_cookie_security(response, findings)
        check_cors(response, findings)
        check_server_information(response, findings)

        return {
            "target": url,
            "final_url": response.url,
            "status_code": response.status_code,
            "response_time_ms":
                round(response.elapsed.total_seconds() * 1000, 2),
            "findings": findings,
            "error": None
        }

    except requests.RequestException as e:

        return {
            "target": url,
            "final_url": None,
            "status_code": None,
            "response_time_ms": None,
            "findings": [],
            "error": str(e)
        }
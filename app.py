from flask import Flask, request, jsonify, Response
from scanner import scan_target
from datetime import datetime
import html

app = Flask(__name__)


def generate_html_report(result):

    target = html.escape(result["target"])

    findings_html = ""

    for finding in result["findings"]:

        findings_html += f"""
        <div class="finding">
            <h2>{html.escape(finding["title"])}</h2>

            <p>
                <b>Severity:</b>
                {html.escape(finding["severity"])}
            </p>

            <p>
                <b>Category:</b>
                {html.escape(finding["category"])}
            </p>

            <p>
                <b>Description:</b><br>
                {html.escape(finding["description"])}
            </p>

            <p>
                <b>Evidence:</b><br>
                <code>{html.escape(finding["evidence"])}</code>
            </p>

            <p>
                <b>Recommendation:</b><br>
                {html.escape(finding["recommendation"])}
            </p>
        </div>
        """

    if not findings_html:
        findings_html = """
        <div class="success">
            No issues were detected by the configured checks.
        </div>
        """

    return f"""
    <!DOCTYPE html>

    <html>

    <head>

        <title>Security Assessment Report</title>

        <style>

            body {{
                font-family: Arial, sans-serif;
                margin: 40px;
                background: #f5f5f5;
            }}

            .container {{
                max-width: 1000px;
                margin: auto;
                background: white;
                padding: 30px;
            }}

            .finding {{
                border: 1px solid #ddd;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}

            .success {{
                padding: 20px;
                background: #e8f5e9;
                border: 1px solid #81c784;
            }}

            code {{
                display: block;
                background: #f1f1f1;
                padding: 10px;
                white-space: pre-wrap;
            }}

        </style>

    </head>

    <body>

        <div class="container">

            <h1>World Monitor Security Assessment</h1>

            <hr>

            <p>
                <b>Target:</b> {target}
            </p>

            <p>
                <b>Scan Time:</b>
                {datetime.now().isoformat()}
            </p>

            <p>
                <b>HTTP Status:</b>
                {result["status_code"]}
            </p>

            <p>
                <b>Response Time:</b>
                {result["response_time_ms"]} ms
            </p>

            <h2>Findings</h2>

            {findings_html}

        </div>

    </body>

    </html>
    """


@app.route("/scan", methods=["POST"])
def scan():

    data = request.get_json()

    if not data or "url" not in data:
        return jsonify({
            "error": "URL is required"
        }), 400

    url = data["url"]

    # Basic restriction: only HTTP/HTTPS targets
    if not url.startswith(("http://", "https://")):
        return jsonify({
            "error": "Only HTTP/HTTPS URLs are supported"
        }), 400

    result = scan_target(url)

    return jsonify(result)


@app.route("/report", methods=["POST"])
def report():

    data = request.get_json()

    if not data or "url" not in data:
        return jsonify({
            "error": "URL is required"
        }), 400

    url = data["url"]

    if not url.startswith(("http://", "https://")):
        return jsonify({
            "error": "Only HTTP/HTTPS URLs are supported"
        }), 400

    result = scan_target(url)

    report_html = generate_html_report(result)

    return Response(
        report_html,
        mimetype="text/html"
    )


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "running"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
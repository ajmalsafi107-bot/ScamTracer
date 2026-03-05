import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from raw_sql_queries import FraudQueries, load_db_config

HOST = "0.0.0.0"
PORT = 8000


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


def load_backend_env() -> None:
    backend_dir = Path(__file__).resolve().parent
    load_env_file(backend_dir / ".env")
    load_env_file(backend_dir / ".env.database")


load_backend_env()


class Handler(BaseHTTPRequestHandler):
    _queries = None

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return None

        raw_data = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(raw_data)
        except json.JSONDecodeError:
            return None

    def _write_json(self, status: int, payload):
        self._set_headers(status)
        self.wfile.write(json.dumps(payload, default=str).encode("utf-8"))

    @classmethod
    def _get_queries(cls) -> FraudQueries:
        if cls._queries is None:
            cls._queries = FraudQueries(load_db_config())
        return cls._queries

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        if parsed.path == "/health":
            self._write_json(200, {"status": "ok"})
            return

        if parsed.path == "/reports/recent":
            try:
                limit = int(params.get("limit", ["20"])[0])
            except ValueError:
                limit = 20
            queries = self._get_queries()
            rows = queries.get_recent_reports(limit)
            status_code, response_body = (200, {"items": rows})
            self._write_json(status_code, response_body)
            return

        if parsed.path == "/stats/top":
            try:
                limit = int(params.get("limit", ["10"])[0])
            except ValueError:
                limit = 10
            queries = self._get_queries()
            rows = queries.get_top_numbers(limit)
            status_code, response_body = (
                200,
                {
                    "items": [
                        {
                            "number": row["phone_number"],
                            "reports_count": int(row["reports_count"]),
                        }
                        for row in rows
                    ]
                },
            )
            self._write_json(status_code, response_body)
            return

        if parsed.path == "/stats/types":
            queries = self._get_queries()
            rows = queries.get_fraud_type_stats()
            status_code, response_body = (200, {"items": rows})
            self._write_json(status_code, response_body)
            return

        if parsed.path == "/fraud-types":
            try:
                limit = int(params.get("limit", ["20"])[0])
            except ValueError:
                limit = 20
            queries = self._get_queries()
            rows = queries.get_fraud_type_number_counts(limit)
            status_code, response_body = (
                200,
                {
                    "items": [
                        {
                            "fraud_type": row["fraud_type"],
                            "numbers_count": int(row["numbers_count"]),
                        }
                        for row in rows
                    ]
                },
            )
            self._write_json(status_code, response_body)
            return

        if parsed.path == "/fraud-type-numbers":
            fraud_type = params.get("type", [""])[0]
            try:
                limit = int(params.get("limit", ["100"])[0])
            except ValueError:
                limit = 100
            try:
                queries = self._get_queries()
                rows = queries.get_numbers_by_fraud_type(fraud_type, limit)
                status_code, response_body = (
                    200,
                    {
                        "fraud_type": fraud_type,
                        "items": [
                            {
                                "number": row["phone_number"],
                                "reports_count": int(row["reports_count"]),
                                "search_count": int(row.get("search_count", 0)),
                                "last_reported_at": row.get("last_reported_at"),
                            }
                            for row in rows
                        ],
                    },
                )
            except Exception as exc:
                self._write_json(500, {"error": str(exc)})
                return

            self._write_json(status_code, response_body)
            return

        if parsed.path == "/reports":
            phone = params.get("phone", [""])[0]
            queries = self._get_queries()
            rows = queries.get_reports_by_phone(phone)
            status_code, response_body = (
                200,
                {
                    "phone": phone,
                    "count": len(rows),
                    "reports": rows,
                },
            )
            self._write_json(status_code, response_body)
            return

        if parsed.path == "/search":
            number = params.get("number", [""])[0]
            try:
                queries = self._get_queries()
                status_code, response_body = (200, queries.search_number_insights(number))
            except Exception as exc:
                self._write_json(500, {"error": str(exc)})
                return

            self._write_json(status_code, response_body)
            return

        if parsed.path == "/number-stats":
            number = params.get("number", [""])[0]
            try:
                queries = self._get_queries()
                status_code, response_body = (200, queries.get_number_stats(number))
            except Exception as exc:
                self._write_json(500, {"error": str(exc)})
                return

            self._write_json(status_code, response_body)
            return

        if parsed.path == "/homepage-reports":
            params = parse_qs(parsed.query)
            mode = params.get("mode", ["recent"])[0]
            try:
                limit = int(params.get("limit", ["10"])[0])
            except ValueError:
                limit = 10

            try:
                queries = self._get_queries()
                if mode == "top":
                    rows = queries.get_top_numbers(limit)
                    items = [
                        {
                            "id": idx + 1,
                            "number": row["phone_number"],
                            "reports_count": int(row["reports_count"]),
                            "search_count": int(row.get("search_count", 0)),
                        }
                        for idx, row in enumerate(rows)
                    ]
                    status_code, response_body = (200, {"mode": "top", "items": items})
                elif mode == "searched":
                    rows = queries.get_top_searched_unreported_numbers(limit)
                    items = [
                        {
                            "id": idx + 1,
                            "number": row["phone_number"],
                            "reports_count": 0,
                            "search_count": int(row.get("search_count", 0)),
                        }
                        for idx, row in enumerate(rows)
                    ]
                    status_code, response_body = (200, {"mode": "searched", "items": items})
                else:
                    rows = queries.get_recent_reports(limit)
                    # Group recent list by number to avoid duplicates in UI.
                    merged = {}
                    for row in rows:
                        number = str(row["phone_number"])
                        if number not in merged:
                            merged[number] = {
                                "id": int(row["id"]),
                                "number": number,
                                "reports_count": 0,
                                "fraud_types": set(),
                                "description": str(row.get("description", "")),
                                "reported_at": row.get("reported_at"),
                                "search_count": int(row.get("search_count", 0)),
                            }
                        merged[number]["reports_count"] += 1
                        merged[number]["fraud_types"].add(str(row.get("fraud_type", "")))

                    items = []
                    for value in merged.values():
                        items.append(
                            {
                                "id": value["id"],
                                "number": value["number"],
                                "reports_count": value["reports_count"],
                                "fraud_type": ", ".join(sorted(t for t in value["fraud_types"] if t)),
                                "description": value["description"],
                                "reported_at": value["reported_at"],
                                "search_count": value["search_count"],
                            }
                        )
                    items.sort(key=lambda item: str(item.get("reported_at") or ""), reverse=True)
                    status_code, response_body = (200, {"mode": "recent", "items": items[:limit]})
            except Exception as exc:
                self._write_json(500, {"error": str(exc)})
                return

            self._write_json(status_code, response_body)
            return

        self._write_json(404, {"error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/reports":
            self._write_json(404, {"error": "Not found"})
            return

        payload = self._read_json_body()
        if not payload:
            self._write_json(400, {"error": "Invalid JSON body"})
            return

        try:
            queries = self._get_queries()
            queries.submit_fraud_report(
                str(payload.get("number", "")).strip(),
                str(payload.get("category", "") or payload.get("fraud_type", "")).strip(),
                str(payload.get("description", "")).strip(),
            )
            status_code, response_body = (201, {"status": "created", "method": "raw_sql_function"})
        except Exception as exc:
            self._write_json(500, {"error": str(exc)})
            return

        self._write_json(status_code, response_body)


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), Handler)
    print(f"Backend running at http://{HOST}:{PORT}")
    server.serve_forever()

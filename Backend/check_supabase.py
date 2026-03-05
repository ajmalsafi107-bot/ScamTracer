from __future__ import annotations

import sys

from raw_sql_queries import FraudQueries, load_db_config


def main() -> int:
    try:
        queries = FraudQueries(load_db_config())
        rows = queries.get_recent_reports(limit=1)
        print("Connected to database: OK")
        print("Query check: get_recent_reports(limit=1)")
        print(f"Rows returned: {len(rows)}")
        return 0
    except Exception as exc:
        print("Connected to database: FAILED")
        print(f"Reason: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

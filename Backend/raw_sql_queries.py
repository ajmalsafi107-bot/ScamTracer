from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import psycopg
from psycopg.rows import dict_row

from phone_utils import normalize_phone_number


@dataclass(frozen=True)
class DbConfig:
    dsn: str


def load_db_config() -> DbConfig:
    dsn = os.getenv("DATABASE_URL", "").strip()
    if not dsn:
        raise ValueError("Missing DATABASE_URL environment variable")
    return DbConfig(dsn=dsn)


class FraudQueries:

    def __init__(self, config: DbConfig):
        self._config = config

    def _connect(self):
        return psycopg.connect(self._config.dsn, row_factory=dict_row)

    def _resolve_phone_id(self, phone_number: str) -> tuple[int, str]:
        normalized = normalize_phone_number(phone_number)
        if not normalized:
            raise ValueError("Invalid phone number")

        sql = """
            insert into phone_numbers(phone_number)
            values (%s)
            on conflict (phone_number)
            do update set phone_number = excluded.phone_number
            returning id, phone_number;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (normalized,))
            row = cur.fetchone()
            if not row:
                raise RuntimeError("Could not resolve phone id")
            return int(row["id"]), str(row["phone_number"])

    # 1) FUNCTION/PROCEDURE USE: calls SQL function submit_fraud_report(...)
    def submit_fraud_report(self, phone_number: str, fraud_type: str, description: str) -> None:
        # Prefer assignment function/procedure call when available.
        sql = "select submit_fraud_report(%s::varchar, %s::varchar, %s::text);"
        try:
            with self._connect() as conn, conn.cursor() as cur:
                cur.execute(sql, (phone_number, fraud_type, description))
            return
        except psycopg.errors.UndefinedFunction:
            # Fallback so app still works if function is not created yet.
            pass

        phone_id, _ = self._resolve_phone_id(phone_number)
        insert_sql = """
            insert into fraud_reports(phone_id, fraud_type, description)
            values (%s, %s, %s);
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(insert_sql, (phone_id, fraud_type, description))

    # 2) MULTIRELATION + JOIN: reports for a phone number
    def get_reports_by_phone(self, phone_number: str) -> list[dict[str, Any]]:
        normalized = normalize_phone_number(phone_number)
        sql = """
            select
              fr.id,
              pn.phone_number,
              fr.fraud_type,
              fr.description,
              fr.reported_at
            from fraud_reports fr
            join phone_numbers pn on pn.id = fr.phone_id
            where pn.phone_number = %s
            order by fr.reported_at desc;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (normalized,))
            return list(cur.fetchall())

    # 3) MULTIRELATION + JOIN: recent feed
    def get_recent_reports(self, limit: int = 20) -> list[dict[str, Any]]:
        sql = """
            select
              fr.id,
              pn.phone_number,
              fr.fraud_type,
              fr.description,
              fr.reported_at,
              coalesce(ps.search_count, 0) as search_count
            from fraud_reports fr
            join phone_numbers pn on pn.id = fr.phone_id
            left join (
              select phone_id, count(*) as search_count
              from phone_searches
              group by phone_id
            ) ps on ps.phone_id = pn.id
            order by fr.reported_at desc
            limit %s;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return list(cur.fetchall())

    # 4) GROUP BY + JOIN: top reported numbers
    def get_top_numbers(self, limit: int = 10) -> list[dict[str, Any]]:
        sql = """
            select
              pn.phone_number,
              count(fr.id) as reports_count,
              coalesce(ps.search_count, 0) as search_count
            from fraud_reports fr
            join phone_numbers pn on pn.id = fr.phone_id
            left join (
              select phone_id, count(*) as search_count
              from phone_searches
              group by phone_id
            ) ps on ps.phone_id = pn.id
            group by pn.phone_number, ps.search_count
            order by reports_count desc
            limit %s;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return list(cur.fetchall())

    def get_top_searched_unreported_numbers(self, limit: int = 10) -> list[dict[str, Any]]:
        sql = """
            select
              pn.phone_number,
              ps.search_count as search_count
            from phone_numbers pn
            join (
              select phone_id, count(*) as search_count
              from phone_searches
              group by phone_id
            ) ps on ps.phone_id = pn.id
            where not exists (
              select 1
              from fraud_reports fr
              where fr.phone_id = pn.id
            )
            order by ps.search_count desc, pn.phone_number asc
            limit %s;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return list(cur.fetchall())

    # 5) GROUP BY: fraud type statistics
    def get_fraud_type_stats(self) -> list[dict[str, Any]]:
        sql = """
            select
              fr.fraud_type,
              count(*) as total
            from fraud_reports fr
            group by fr.fraud_type
            order by total desc;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql)
            return list(cur.fetchall())

    def get_fraud_type_number_counts(self, limit: int = 20) -> list[dict[str, Any]]:
        sql = """
            select
              fr.fraud_type,
              count(distinct pn.phone_number) as numbers_count
            from fraud_reports fr
            join phone_numbers pn on pn.id = fr.phone_id
            where fr.fraud_type is not null and fr.fraud_type <> ''
            group by fr.fraud_type
            order by numbers_count desc, fr.fraud_type asc
            limit %s;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return list(cur.fetchall())

    def get_numbers_by_fraud_type(self, fraud_type: str, limit: int = 100) -> list[dict[str, Any]]:
        cleaned_type = (fraud_type or "").strip()
        if not cleaned_type:
            raise ValueError("Invalid fraud type")

        sql = """
            select
              pn.phone_number,
              count(fr.id) as reports_count,
              coalesce(ps.search_count, 0) as search_count,
              max(fr.reported_at) as last_reported_at
            from fraud_reports fr
            join phone_numbers pn on pn.id = fr.phone_id
            left join (
              select phone_id, count(*) as search_count
              from phone_searches
              group by phone_id
            ) ps on ps.phone_id = pn.id
            where fr.fraud_type = %s
            group by pn.phone_number, ps.search_count
            order by reports_count desc, search_count desc, pn.phone_number asc
            limit %s;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (cleaned_type, limit))
            return list(cur.fetchall())

    def get_number_stats(self, phone_number: str) -> dict[str, Any]:
        normalized = normalize_phone_number(phone_number)
        if not normalized:
            raise ValueError("Invalid phone number")

        sql = """
            select
              pn.phone_number,
              coalesce(ps.search_count, 0) as search_count,
              coalesce(fr.reports_count, 0) as reports_count
            from phone_numbers pn
            left join (
              select phone_id, count(*) as search_count
              from phone_searches
              group by phone_id
            ) ps on ps.phone_id = pn.id
            left join (
              select phone_id, count(*) as reports_count
              from fraud_reports
              group by phone_id
            ) fr on fr.phone_id = pn.id
            where pn.phone_number = %s
            limit 1;
        """
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(sql, (normalized,))
            row = cur.fetchone()

        if not row:
            return {
                "number": normalized,
                "search_count": 0,
                "reports_count": 0,
            }

        return {
            "number": str(row["phone_number"]),
            "search_count": int(row["search_count"]),
            "reports_count": int(row["reports_count"]),
        }

    def search_number_insights(self, phone_number: str) -> dict[str, Any]:
        phone_id, normalized = self._resolve_phone_id(phone_number)

        with self._connect() as conn, conn.cursor() as cur:
            # Track search count
            cur.execute("insert into phone_searches(phone_id) values (%s);", (phone_id,))

            cur.execute("select count(*) as total from phone_searches where phone_id = %s;", (phone_id,))
            search_count = int(cur.fetchone()["total"])

            cur.execute(
                """
                select
                  fr.id,
                  fr.fraud_type,
                  fr.description,
                  fr.reported_at
                from fraud_reports fr
                where fr.phone_id = %s
                order by fr.reported_at desc;
                """,
                (phone_id,),
            )
            reports = list(cur.fetchall())

        return {
            "number": normalized,
            "search_count": search_count,
            "reports_count": len(reports),
            "reports": reports,
        }

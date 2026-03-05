from __future__ import annotations


def normalize_phone_number(raw_number: str) -> str:
    """
    Normalize phone numbers to reduce duplicate variants.
    Examples:
    - '072-123 45 67' -> '0721234567'
    - '+46721234567'  -> '0721234567'
    """
    digits = "".join(ch for ch in raw_number if ch.isdigit())
    if digits.startswith("46"):
        return f"0{digits[2:]}"
    return digits

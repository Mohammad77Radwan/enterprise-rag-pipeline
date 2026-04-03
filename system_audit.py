import json
import traceback
from pathlib import Path

import requests


def main() -> int:
    print("=== QDRANT PROBE ===")
    try:
        response = requests.get("http://localhost:6333/collections", timeout=5)
        print(f"status_code={response.status_code}")
        print(response.text)
    except Exception as exc:
        print(f"QDRANT_ERROR: {exc}")
        traceback.print_exc()

    print("=== UPLOAD PROBE ===")
    test_file_path = Path("/tmp/system_audit_dummy.txt")
    test_file_path.write_text("system audit test payload\n", encoding="utf-8")

    try:
        with test_file_path.open("rb") as handle:
            response = requests.post(
                "http://localhost:8000/api/v1/upload",
                files={"file": ("system_audit_dummy.txt", handle, "text/plain")},
                timeout=20,
            )
        print(f"status_code={response.status_code}")
        print(response.text)
        try:
            parsed = response.json()
            print(json.dumps(parsed, indent=2))
        except Exception:
            pass
    except Exception as exc:
        print(f"UPLOAD_ERROR: {exc}")
        traceback.print_exc()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

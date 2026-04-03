import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def _wait_for_database() -> None:
	attempts = int(os.getenv("DB_CONNECT_MAX_ATTEMPTS", "30"))
	delay_seconds = float(os.getenv("DB_CONNECT_DELAY_SECONDS", "2"))

	last_error = None
	for _ in range(attempts):
		try:
			with engine.connect() as conn:
				conn.execute(text("SELECT 1"))
			return
		except Exception as exc:
			last_error = exc
			time.sleep(delay_seconds)

	raise RuntimeError(
		f"Database connection failed after {attempts} attempts"
	) from last_error


_wait_for_database()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

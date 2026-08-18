"""Pytest configuration — sets the environment before any app module imports.

app.config validates env vars at import time, so these must be set here first.
load_dotenv() never overrides variables that are already set, so the real .env
cannot leak into tests. MongoDB is never contacted: TestClient is used without
the lifespan context (startup events don't run) and tests replace collections
with fakes.
"""

import os

os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["MONGODB_DB_NAME"] = "test_db"
os.environ["CLERK_SECRET_KEY"] = "sk_test_fake_key_for_tests"
os.environ["AUTH_DISABLED"] = "false"

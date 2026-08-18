from pymongo import MongoClient

from backend.config import MONGODB_DB_NAME, MONGODB_URI

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
    appname="advocate-contracts-api",
)
db = client[MONGODB_DB_NAME]

# Collections
contracts_collection = db["contracts"]
analysis_collection = db["analysis"]

def init_db():
    # Documents are identified by MongoDB's `_id`, which is uniquely indexed
    # automatically. Drop the legacy unique indexes on the unused `contract_id`
    # / `analysis_id` fields: a missing field is indexed as `null`, so a unique
    # index rejects every insert after the first one (E11000 dup key: null).
    for collection, index_name in (
        (contracts_collection, "contract_id_1"),
        (analysis_collection, "analysis_id_1"),
    ):
        if index_name in collection.index_information():
            collection.drop_index(index_name)

    # Contracts are scoped to their owner's Clerk user id on every query.
    contracts_collection.create_index("owner_id")

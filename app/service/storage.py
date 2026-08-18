from __future__ import annotations

from functools import lru_cache

from app.config import (
    R2_ACCESS_KEY_ID,
    R2_BUCKET_NAME,
    R2_ENDPOINT_URL,
    R2_SECRET_ACCESS_KEY,
    STORAGE_BACKEND,
    UPLOADS_DIR,
)


class StorageError(RuntimeError):
    """Raised when an uploaded object cannot be stored."""


@lru_cache(maxsize=1)
def _r2_client():
    try:
        import boto3
    except ImportError as exc:
        raise StorageError(
            "R2 storage requires boto3. Install project dependencies with "
            "python -m pip install -r requirements.txt."
        ) from exc

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def save_upload(*, object_key: str, content: bytes, content_type: str | None) -> str:
    """Store an upload and return the key/path used by the storage backend."""
    if STORAGE_BACKEND == "local":
        import os

        os.makedirs(UPLOADS_DIR, exist_ok=True)
        file_path = os.path.join(UPLOADS_DIR, object_key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as output_file:
            output_file.write(content)
        return file_path

    try:
        _r2_client().put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=content,
            ContentType=content_type or "application/octet-stream",
        )
    except Exception as exc:
        raise StorageError(f"Could not upload the file to R2: {exc}") from exc

    return object_key


def delete_upload(*, object_key: str) -> None:
    """Delete an uploaded object from the configured storage backend."""
    if not object_key:
        return

    if STORAGE_BACKEND == "local":
        import os
        from pathlib import Path

        upload_root = Path(UPLOADS_DIR).resolve()
        file_path = (upload_root / object_key).resolve()
        if upload_root not in file_path.parents:
            raise StorageError("Invalid local upload path.")
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass
        return

    try:
        _r2_client().delete_object(Bucket=R2_BUCKET_NAME, Key=object_key)
    except Exception as exc:
        raise StorageError(f"Could not delete the file from R2: {exc}") from exc

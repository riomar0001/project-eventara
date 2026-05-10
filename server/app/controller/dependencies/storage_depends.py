from app.infrastructure.storage.storage_service import StorageService

_storage_service = StorageService()


def get_storage_service() -> StorageService:
    return _storage_service

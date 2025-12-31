"""
Image Curator Package
AI-powered image curation for Portuguese vocabulary learning.
"""

from .gpu_manager import GPUManager, get_gpu_manager
from .vision_client import VisionClient, create_vision_client, ImageScore
from .curator import ImageCurator, CurationResult
from .api_client import (
    ImageAPIClient,
    ImageResult,
    PexelsClient,
    PixabayClient,
    create_api_client
)
from .image_search import (
    ImageSearchOrchestrator,
    ImageCache,
    create_orchestrator,
    search_for_word
)
from .image_library import (
    ImageLibrary,
    ImageRecord,
    get_library
)
from .storage import (
    MetadataSidecar,
    LocalImageStorage
)
from .batch_curator import (
    BatchCurator,
    BatchConfig,
    BatchProgress
)
from .batch_operations import BatchOperations

__all__ = [
    'GPUManager',
    'get_gpu_manager',
    'VisionClient', 
    'create_vision_client',
    'ImageScore',
    'ImageCurator',
    'CurationResult',
    'ImageAPIClient',
    'ImageResult',
    'PexelsClient',
    'PixabayClient',
    'create_api_client',
    'ImageSearchOrchestrator',
    'ImageCache',
    'create_orchestrator',
    'search_for_word',
    'ImageLibrary',
    'ImageRecord',
    'get_library',
    'MetadataSidecar',
    'LocalImageStorage',
    'BatchCurator',
    'BatchConfig',
    'BatchProgress',
    'BatchOperations'
]

__version__ = '0.1.0'

"""
Image Curator Package
AI-powered image curation for Portuguese vocabulary learning.
"""

from .gpu_manager import GPUManager, get_gpu_manager
from .vision_client import VisionClient, create_vision_client, ImageScore
from .curator import ImageCurator, CurationResult

__all__ = [
    'GPUManager',
    'get_gpu_manager',
    'VisionClient', 
    'create_vision_client',
    'ImageScore',
    'ImageCurator',
    'CurationResult'
]

__version__ = '0.1.0'

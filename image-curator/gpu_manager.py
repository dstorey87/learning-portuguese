"""
GPU Manager for Image Curator
Monitors GPU utilization and manages throttling for vision model processing.
Falls back gracefully if nvidia-smi is not available.
"""

import subprocess
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class GPUManager:
    """Manages GPU utilization monitoring and throttling."""
    
    def __init__(self, throttle_threshold: int = 75, fallback_cpu: bool = True):
        """
        Initialize GPU manager.
        
        Args:
            throttle_threshold: Pause processing if GPU utilization exceeds this %
            fallback_cpu: If True, allow CPU fallback when GPU unavailable
        """
        self.throttle_threshold = throttle_threshold
        self.fallback_cpu = fallback_cpu
        self._nvidia_available = self._check_nvidia_smi()
        
    def _check_nvidia_smi(self) -> bool:
        """Check if nvidia-smi is available."""
        try:
            result = subprocess.run(
                ['nvidia-smi', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            available = result.returncode == 0
            if available:
                logger.info("NVIDIA GPU monitoring enabled")
            else:
                logger.warning("nvidia-smi found but returned error")
            return available
        except FileNotFoundError:
            logger.warning("nvidia-smi not found - GPU monitoring disabled")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("nvidia-smi timed out - GPU monitoring disabled")
            return False
        except Exception as e:
            logger.warning(f"GPU check failed: {e}")
            return False
    
    def get_gpu_info(self) -> List[Dict]:
        """
        Get utilization info for all available GPUs.
        
        Returns:
            List of dicts with GPU index, utilization %, memory used/total MB
        """
        if not self._nvidia_available:
            return []
        
        try:
            result = subprocess.run(
                [
                    'nvidia-smi',
                    '--query-gpu=index,name,utilization.gpu,memory.used,memory.total',
                    '--format=csv,noheader,nounits'
                ],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"nvidia-smi error: {result.stderr}")
                return []
            
            gpus = []
            for line in result.stdout.strip().split('\n'):
                if not line.strip():
                    continue
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 5:
                    gpus.append({
                        'index': int(parts[0]),
                        'name': parts[1],
                        'utilization': int(parts[2]),
                        'memory_used': int(parts[3]),
                        'memory_total': int(parts[4])
                    })
            
            return gpus
            
        except subprocess.TimeoutExpired:
            logger.error("nvidia-smi timed out")
            return []
        except Exception as e:
            logger.error(f"Failed to get GPU info: {e}")
            return []
    
    def select_best_gpu(self) -> Optional[int]:
        """
        Select GPU with lowest utilization.
        
        Returns:
            GPU index, or None if no GPUs available
        """
        gpus = self.get_gpu_info()
        if not gpus:
            return None
        
        # Prefer GPU with lowest utilization
        best = min(gpus, key=lambda g: g['utilization'])
        logger.debug(f"Selected GPU {best['index']} ({best['name']}) at {best['utilization']}% utilization")
        return best['index']
    
    def should_throttle(self) -> bool:
        """
        Check if processing should be paused due to high GPU load.
        
        Returns:
            True if GPU utilization exceeds threshold
        """
        if not self._nvidia_available:
            # No GPU monitoring = no throttling
            return False
        
        gpus = self.get_gpu_info()
        if not gpus:
            return False
        
        # Check the GPU we'd use
        best_gpu_idx = self.select_best_gpu()
        if best_gpu_idx is None:
            return False
        
        current_gpu = next((g for g in gpus if g['index'] == best_gpu_idx), None)
        if not current_gpu:
            return False
        
        should_throttle = current_gpu['utilization'] > self.throttle_threshold
        if should_throttle:
            logger.info(f"Throttling: GPU {best_gpu_idx} at {current_gpu['utilization']}% (threshold: {self.throttle_threshold}%)")
        
        return should_throttle
    
    def get_status(self) -> Dict:
        """
        Get overall GPU status summary.
        
        Returns:
            Status dict with availability, GPUs, and throttle state
        """
        gpus = self.get_gpu_info()
        best_idx = self.select_best_gpu()
        
        return {
            'nvidia_available': self._nvidia_available,
            'gpu_count': len(gpus),
            'gpus': gpus,
            'selected_gpu': best_idx,
            'should_throttle': self.should_throttle(),
            'throttle_threshold': self.throttle_threshold,
            'fallback_cpu': self.fallback_cpu
        }


# Singleton instance for easy import
_gpu_manager: Optional[GPUManager] = None


def get_gpu_manager(throttle_threshold: int = 75) -> GPUManager:
    """Get or create the GPU manager singleton."""
    global _gpu_manager
    if _gpu_manager is None:
        _gpu_manager = GPUManager(throttle_threshold=throttle_threshold)
    return _gpu_manager


if __name__ == '__main__':
    # Quick test
    import json
    logging.basicConfig(level=logging.DEBUG)
    
    manager = get_gpu_manager()
    status = manager.get_status()
    print(json.dumps(status, indent=2))

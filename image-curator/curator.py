"""
Image Curator - Main Entry Point
Coordinates GPU management and vision model evaluation for vocabulary images.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

from gpu_manager import get_gpu_manager, GPUManager
from vision_client import create_vision_client, VisionClient, ImageScore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('curator.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class CurationResult:
    """Result of curating an image for a word."""
    word: str
    translation: str
    image_url: str
    score: ImageScore
    status: str  # 'approved', 'rejected', 'error'
    
    def to_dict(self) -> Dict:
        return {
            'word': self.word,
            'translation': self.translation,
            'image_url': self.image_url,
            'score': self.score.to_dict(),
            'status': self.status
        }


class ImageCurator:
    """Main curator class that coordinates image evaluation."""
    
    def __init__(
        self,
        approval_threshold: float = 7.0,
        throttle_wait: float = 5.0,
        model: Optional[str] = None
    ):
        """
        Initialize the image curator.
        
        Args:
            approval_threshold: Minimum average score (0-10) for approval
            throttle_wait: Seconds to wait when GPU is throttled
            model: Specific vision model to use
        """
        self.approval_threshold = approval_threshold
        self.throttle_wait = throttle_wait
        
        self.gpu_manager = get_gpu_manager()
        self.vision_client = create_vision_client(model=model)
        
        logger.info(f"ImageCurator initialized (threshold: {approval_threshold})")
    
    async def _wait_for_gpu(self) -> None:
        """Wait if GPU is throttled."""
        while self.gpu_manager.should_throttle():
            logger.info(f"GPU throttled, waiting {self.throttle_wait}s...")
            await asyncio.sleep(self.throttle_wait)
    
    def evaluate_single(
        self,
        word: str,
        translation: str,
        image_url: str,
        context: str = ""
    ) -> CurationResult:
        """
        Evaluate a single image for a word.
        
        Args:
            word: Portuguese word
            translation: English translation
            image_url: URL of image to evaluate
            context: Additional context
        
        Returns:
            CurationResult with evaluation
        """
        logger.info(f"Evaluating image for '{word}' ({translation})")
        
        try:
            score = self.vision_client.evaluate_url(
                image_url=image_url,
                target_word=word,
                translation=translation,
                context=context
            )
            
            # Determine status based on threshold
            if score.average_score >= self.approval_threshold and score.recommended:
                status = 'approved'
            elif score.relevance >= 7 and score.average_score >= 6.0:
                status = 'approved'  # Accept if highly relevant even with slightly lower scores
            else:
                status = 'rejected'
            
            result = CurationResult(
                word=word,
                translation=translation,
                image_url=image_url,
                score=score,
                status=status
            )
            
            logger.info(f"'{word}': {status} (avg: {score.average_score:.1f}, relevance: {score.relevance})")
            return result
            
        except Exception as e:
            logger.error(f"Evaluation failed for '{word}': {e}")
            return CurationResult(
                word=word,
                translation=translation,
                image_url=image_url,
                score=ImageScore(0, 0, 0, 0, str(e), False),
                status='error'
            )
    
    async def evaluate_batch(
        self,
        items: List[Dict],
        delay_between: float = 1.0
    ) -> List[CurationResult]:
        """
        Evaluate a batch of images.
        
        Args:
            items: List of dicts with 'word', 'translation', 'image_url', 'context'
            delay_between: Seconds between evaluations
        
        Returns:
            List of CurationResult
        """
        results = []
        
        for i, item in enumerate(items):
            # Check GPU throttling
            await self._wait_for_gpu()
            
            result = self.evaluate_single(
                word=item['word'],
                translation=item['translation'],
                image_url=item['image_url'],
                context=item.get('context', '')
            )
            results.append(result)
            
            # Brief delay between evaluations
            if i < len(items) - 1:
                await asyncio.sleep(delay_between)
        
        # Summary
        approved = sum(1 for r in results if r.status == 'approved')
        rejected = sum(1 for r in results if r.status == 'rejected')
        errors = sum(1 for r in results if r.status == 'error')
        
        logger.info(f"Batch complete: {approved} approved, {rejected} rejected, {errors} errors")
        
        return results
    
    def get_status(self) -> Dict:
        """Get curator system status."""
        return {
            'gpu': self.gpu_manager.get_status(),
            'vision': self.vision_client.get_status(),
            'settings': {
                'approval_threshold': self.approval_threshold,
                'throttle_wait': self.throttle_wait
            }
        }


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Image Curator for Vocabulary Learning')
    parser.add_argument('--status', action='store_true', help='Show system status')
    parser.add_argument('--evaluate', type=str, help='Evaluate single image URL')
    parser.add_argument('--word', type=str, help='Portuguese word')
    parser.add_argument('--translation', type=str, help='English translation')
    parser.add_argument('--context', type=str, default='', help='Additional context')
    parser.add_argument('--threshold', type=float, default=7.0, help='Approval threshold (0-10)')
    parser.add_argument('--model', type=str, help='Specific vision model to use')
    
    args = parser.parse_args()
    
    try:
        curator = ImageCurator(
            approval_threshold=args.threshold,
            model=args.model
        )
        
        if args.status:
            print(json.dumps(curator.get_status(), indent=2))
            return
        
        if args.evaluate and args.word and args.translation:
            result = curator.evaluate_single(
                word=args.word,
                translation=args.translation,
                image_url=args.evaluate,
                context=args.context
            )
            print(json.dumps(result.to_dict(), indent=2))
            return
        
        # Default: show status
        print(json.dumps(curator.get_status(), indent=2))
        
    except Exception as e:
        logger.error(f"Curator error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

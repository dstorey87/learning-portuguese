"""
Batch Operations Utility
Provides CLI tools for common batch operations on the image library.
"""

import asyncio
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Handle relative imports
try:
    from .image_library import ImageLibrary, ImageRecord, get_library
    from .storage import LocalImageStorage
    from .vision_client import VisionClient
except ImportError:
    from image_library import ImageLibrary, ImageRecord, get_library
    from storage import LocalImageStorage
    from vision_client import VisionClient

logger = logging.getLogger(__name__)


class BatchOperations:
    """
    Utility class for batch operations on the image library.
    
    Operations:
    - Export image mappings to JSON
    - Import image mappings from JSON
    - Re-validate images with new model
    - Bulk status updates
    - Generate reports
    """
    
    def __init__(self):
        self.library = get_library()
        self.storage = LocalImageStorage()
    
    # =========================================================================
    # Export/Import Operations
    # =========================================================================
    
    def export_mappings(self, output_path: str, status_filter: Optional[str] = None) -> int:
        """
        Export image mappings to JSON file.
        
        Args:
            output_path: Path to output JSON file
            status_filter: Only export images with this status
        
        Returns:
            Number of records exported
        """
        images, total = self.library.search_images(status=status_filter, limit=10000)
        
        export_data = {
            'exported_at': datetime.now().isoformat(),
            'total_records': len(images),
            'status_filter': status_filter,
            'mappings': []
        }
        
        for img in images:
            export_data['mappings'].append({
                'word': img.word,
                'lesson_id': img.lesson_id,
                'category': img.category,
                'url': img.url,
                'local_path': img.local_path,
                'source': img.source,
                'photographer': img.photographer,
                'status': img.status,
                'ai_scores': {
                    'relevance': img.ai_score_relevance,
                    'clarity': img.ai_score_clarity,
                    'appropriateness': img.ai_score_appropriateness,
                    'quality': img.ai_score_quality,
                    'total': img.ai_score_total
                },
                'ai_model': img.ai_model,
                'ai_reason': img.ai_reason,
                'manually_verified': img.manually_verified,
                'verified_by': img.verified_by
            })
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Exported {len(images)} records to {output_path}")
        return len(images)
    
    def import_mappings(self, input_path: str, overwrite: bool = False) -> Dict:
        """
        Import image mappings from JSON file.
        
        Args:
            input_path: Path to input JSON file
            overwrite: Whether to overwrite existing records
        
        Returns:
            Summary of import results
        """
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = {
            'imported': 0,
            'skipped': 0,
            'errors': 0
        }
        
        for mapping in data.get('mappings', []):
            try:
                # Check if already exists
                existing = self.library.get_images_for_word(mapping['word'])
                existing_urls = [img.url for img in existing]
                
                if mapping['url'] in existing_urls and not overwrite:
                    results['skipped'] += 1
                    continue
                
                # Create record
                scores = mapping.get('ai_scores', {})
                record = ImageRecord(
                    word=mapping['word'],
                    url=mapping['url'],
                    source=mapping.get('source', 'import'),
                    lesson_id=mapping.get('lesson_id'),
                    category=mapping.get('category'),
                    local_path=mapping.get('local_path'),
                    photographer=mapping.get('photographer'),
                    status=mapping.get('status', 'candidate'),
                    ai_score_relevance=scores.get('relevance'),
                    ai_score_clarity=scores.get('clarity'),
                    ai_score_appropriateness=scores.get('appropriateness'),
                    ai_score_quality=scores.get('quality'),
                    ai_score_total=scores.get('total'),
                    ai_model=mapping.get('ai_model'),
                    ai_reason=mapping.get('ai_reason'),
                    manually_verified=mapping.get('manually_verified', False),
                    verified_by=mapping.get('verified_by')
                )
                
                self.library.add_image(record, actor='import')
                results['imported'] += 1
                
            except Exception as e:
                logger.error(f"Error importing {mapping.get('word')}: {e}")
                results['errors'] += 1
        
        logger.info(f"Import complete: {results}")
        return results
    
    # =========================================================================
    # Re-validation Operations
    # =========================================================================
    
    async def revalidate_images(
        self,
        model: str = 'llama3.2-vision:11b',
        status_filter: Optional[str] = None,
        min_existing_score: Optional[int] = None,
        limit: int = 100
    ) -> Dict:
        """
        Re-validate images with a new or updated model.
        
        Args:
            model: Vision model to use
            status_filter: Only process images with this status
            min_existing_score: Only process images with scores below this
            limit: Maximum images to process
        
        Returns:
            Summary of re-validation results
        """
        results = {
            'processed': 0,
            'improved': 0,
            'unchanged': 0,
            'degraded': 0,
            'errors': 0
        }
        
        # Get images to revalidate
        images, total = self.library.search_images(
            status=status_filter,
            limit=limit
        )
        
        # Filter by min score if specified
        if min_existing_score is not None:
            images = [img for img in images 
                     if img.ai_score_total is None or img.ai_score_total < min_existing_score]
        
        if not images:
            logger.info("No images to revalidate")
            return results
        
        # Initialize vision client
        vision = VisionClient(model=model)
        if not await vision.check_model():
            logger.error(f"Model {model} not available")
            return {'error': f'Model {model} not available'}
        
        for img in images:
            try:
                old_score = img.ai_score_total
                
                # Evaluate image
                score = await vision.evaluate_image(img.url, img.word)
                
                if score:
                    # Update scores in database
                    self.library.update_image(img.id, {
                        'ai_score_relevance': score.relevance,
                        'ai_score_clarity': score.clarity,
                        'ai_score_appropriateness': score.appropriateness,
                        'ai_score_quality': score.quality,
                        'ai_score_total': score.total,
                        'ai_model': model,
                        'ai_reason': score.reason,
                        'ai_validated_at': datetime.now().isoformat()
                    }, actor=f'revalidate:{model}')
                    
                    results['processed'] += 1
                    
                    if old_score is None:
                        results['unchanged'] += 1
                    elif score.total > old_score:
                        results['improved'] += 1
                        logger.info(f"'{img.word}': {old_score} -> {score.total} (improved)")
                    elif score.total < old_score:
                        results['degraded'] += 1
                        logger.info(f"'{img.word}': {old_score} -> {score.total} (degraded)")
                    else:
                        results['unchanged'] += 1
                        
            except Exception as e:
                logger.error(f"Error revalidating '{img.word}': {e}")
                results['errors'] += 1
        
        logger.info(f"Revalidation complete: {results}")
        return results
    
    # =========================================================================
    # Bulk Status Operations
    # =========================================================================
    
    def bulk_update_status(
        self,
        new_status: str,
        status_filter: Optional[str] = None,
        min_score: Optional[int] = None,
        max_score: Optional[int] = None,
        word_list: Optional[List[str]] = None
    ) -> int:
        """
        Bulk update status of images.
        
        Args:
            new_status: New status to set
            status_filter: Only update images with this current status
            min_score: Only update images with score >= this
            max_score: Only update images with score <= this
            word_list: Only update images for these words
        
        Returns:
            Number of images updated
        """
        images, _ = self.library.search_images(
            status=status_filter,
            min_score=min_score,
            limit=10000
        )
        
        # Apply filters
        if max_score is not None:
            images = [img for img in images 
                     if img.ai_score_total is None or img.ai_score_total <= max_score]
        
        if word_list:
            images = [img for img in images if img.word in word_list]
        
        updated = 0
        for img in images:
            self.library.update_image(img.id, {'status': new_status}, actor='bulk_update')
            updated += 1
        
        logger.info(f"Updated {updated} images to status '{new_status}'")
        return updated
    
    def verify_all_selected(self, verified_by: str) -> int:
        """Mark all selected images as manually verified."""
        images, _ = self.library.search_images(status='selected', limit=10000)
        
        verified = 0
        for img in images:
            if not img.manually_verified:
                self.library.verify_image(img.id, verified_by)
                verified += 1
        
        logger.info(f"Verified {verified} images by '{verified_by}'")
        return verified
    
    # =========================================================================
    # Reporting
    # =========================================================================
    
    def generate_report(self) -> Dict:
        """Generate comprehensive library report."""
        stats = self.library.get_statistics()
        storage_stats = self.storage.get_storage_stats()
        queue_stats = self.library.get_queue_stats()
        
        # Get images by score range
        images, _ = self.library.search_images(limit=10000)
        
        score_ranges = {
            'excellent (36-40)': 0,
            'good (28-35)': 0,
            'fair (20-27)': 0,
            'poor (< 20)': 0,
            'unscored': 0
        }
        
        for img in images:
            if img.ai_score_total is None:
                score_ranges['unscored'] += 1
            elif img.ai_score_total >= 36:
                score_ranges['excellent (36-40)'] += 1
            elif img.ai_score_total >= 28:
                score_ranges['good (28-35)'] += 1
            elif img.ai_score_total >= 20:
                score_ranges['fair (20-27)'] += 1
            else:
                score_ranges['poor (< 20)'] += 1
        
        # Calculate coverage
        # Load vocabulary count from CSV files
        csv_dir = Path(__file__).parent.parent / 'src' / 'data' / 'csv'
        total_words = 0
        if csv_dir.exists():
            for csv_file in csv_dir.glob('*.csv'):
                with open(csv_file, 'r', encoding='utf-8') as f:
                    total_words += len(f.readlines()) - 1  # minus header
        
        coverage = round(stats['words_with_images'] / max(total_words, 1) * 100, 1)
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_images': stats['total'],
                'words_with_images': stats['words_with_images'],
                'total_vocabulary': total_words,
                'coverage_percent': coverage,
                'verified_count': stats['verified'],
                'average_ai_score': stats['avg_ai_score']
            },
            'by_status': stats['by_status'],
            'by_source': stats['by_source'],
            'by_category': stats['by_category'],
            'by_score_range': score_ranges,
            'storage': {
                'total_images': storage_stats['total_images'],
                'total_size_mb': storage_stats['total_size_mb'],
                'by_category': storage_stats['by_category'],
                'by_format': storage_stats['by_format']
            },
            'queue': queue_stats
        }
        
        return report
    
    def print_report(self):
        """Print formatted library report."""
        report = self.generate_report()
        
        print("\n" + "=" * 60)
        print("IMAGE LIBRARY REPORT")
        print("=" * 60)
        print(f"Generated: {report['generated_at']}")
        
        print("\n📊 SUMMARY")
        print("-" * 40)
        s = report['summary']
        print(f"Total Images:       {s['total_images']}")
        print(f"Words with Images:  {s['words_with_images']}")
        print(f"Total Vocabulary:   {s['total_vocabulary']}")
        print(f"Coverage:           {s['coverage_percent']}%")
        print(f"Verified:           {s['verified_count']}")
        print(f"Avg AI Score:       {s['average_ai_score']}")
        
        print("\n📁 BY STATUS")
        print("-" * 40)
        for status, count in report['by_status'].items():
            print(f"  {status}: {count}")
        
        print("\n🌐 BY SOURCE")
        print("-" * 40)
        for source, count in report['by_source'].items():
            print(f"  {source}: {count}")
        
        print("\n📂 BY CATEGORY")
        print("-" * 40)
        for cat, count in report['by_category'].items():
            print(f"  {cat}: {count}")
        
        print("\n⭐ BY SCORE RANGE")
        print("-" * 40)
        for range_name, count in report['by_score_range'].items():
            print(f"  {range_name}: {count}")
        
        print("\n💾 STORAGE")
        print("-" * 40)
        st = report['storage']
        print(f"Local Images: {st['total_images']}")
        print(f"Total Size:   {st['total_size_mb']} MB")
        
        print("\n" + "=" * 60 + "\n")


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description='Image Library Batch Operations')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Export command
    export_p = subparsers.add_parser('export', help='Export image mappings')
    export_p.add_argument('output', help='Output JSON file path')
    export_p.add_argument('--status', help='Filter by status')
    
    # Import command
    import_p = subparsers.add_parser('import', help='Import image mappings')
    import_p.add_argument('input', help='Input JSON file path')
    import_p.add_argument('--overwrite', action='store_true', help='Overwrite existing')
    
    # Revalidate command
    reval_p = subparsers.add_parser('revalidate', help='Re-validate images with model')
    reval_p.add_argument('--model', default='llama3.2-vision:11b', help='Vision model')
    reval_p.add_argument('--status', help='Filter by status')
    reval_p.add_argument('--min-score', type=int, help='Only below this score')
    reval_p.add_argument('--limit', type=int, default=100, help='Max images')
    
    # Bulk status command
    status_p = subparsers.add_parser('bulk-status', help='Bulk update status')
    status_p.add_argument('new_status', help='New status to set')
    status_p.add_argument('--current-status', help='Filter by current status')
    status_p.add_argument('--min-score', type=int, help='Filter by min score')
    status_p.add_argument('--max-score', type=int, help='Filter by max score')
    
    # Report command
    subparsers.add_parser('report', help='Generate library report')
    
    # Stats command
    subparsers.add_parser('stats', help='Show quick statistics')
    
    parser.add_argument('-v', '--verbose', action='store_true')
    
    args = parser.parse_args()
    
    # Configure logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s [%(levelname)s] %(message)s'
    )
    
    ops = BatchOperations()
    
    if args.command == 'export':
        ops.export_mappings(args.output, args.status)
        
    elif args.command == 'import':
        results = ops.import_mappings(args.input, args.overwrite)
        print(json.dumps(results, indent=2))
        
    elif args.command == 'revalidate':
        results = asyncio.run(ops.revalidate_images(
            model=args.model,
            status_filter=args.status,
            min_existing_score=args.min_score,
            limit=args.limit
        ))
        print(json.dumps(results, indent=2))
        
    elif args.command == 'bulk-status':
        count = ops.bulk_update_status(
            new_status=args.new_status,
            status_filter=args.current_status,
            min_score=args.min_score,
            max_score=args.max_score
        )
        print(f"Updated {count} images")
        
    elif args.command == 'report':
        ops.print_report()
        
    elif args.command == 'stats':
        stats = ops.library.get_statistics()
        print(json.dumps(stats, indent=2))
        
    else:
        parser.print_help()


if __name__ == '__main__':
    main()

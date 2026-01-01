"""
Image Library Database
SQLite-based image storage with cloud-ready schema for AWS migration.
"""

import sqlite3
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass, field, asdict
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Database schema
SCHEMA = """
-- Core images table
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    word_id TEXT,
    lesson_id TEXT,
    url TEXT NOT NULL,
    local_path TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    photographer TEXT,
    alt_text TEXT,
    description TEXT,
    category TEXT,
    tags TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    format TEXT,
    
    -- AI validation scores
    ai_score_relevance INTEGER,
    ai_score_clarity INTEGER,
    ai_score_appropriateness INTEGER,
    ai_score_quality INTEGER,
    ai_score_total INTEGER,
    ai_model TEXT,
    ai_reason TEXT,
    ai_validated_at DATETIME,
    
    -- Status tracking
    status TEXT DEFAULT 'candidate',
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(word, url)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_images_word ON images(word);
CREATE INDEX IF NOT EXISTS idx_images_word_id ON images(word_id);
CREATE INDEX IF NOT EXISTS idx_images_lesson ON images(lesson_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);

-- History/audit table
CREATE TABLE IF NOT EXISTS image_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER,
    action TEXT NOT NULL,
    actor TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(id)
);

CREATE INDEX IF NOT EXISTS idx_history_image ON image_history(image_id);

-- Curation queue
CREATE TABLE IF NOT EXISTS curation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    lesson_id TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON curation_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON curation_queue(priority DESC);
"""


@dataclass
class ImageRecord:
    """Image database record."""

    word: str
    url: str
    source: str
    id: Optional[int] = None
    word_id: Optional[str] = None  # e.g., "001_01" - used for filename
    lesson_id: Optional[str] = None
    local_path: Optional[str] = None
    source_url: Optional[str] = None
    photographer: Optional[str] = None
    alt_text: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    format: Optional[str] = None
    ai_score_relevance: Optional[int] = None
    ai_score_clarity: Optional[int] = None
    ai_score_appropriateness: Optional[int] = None
    ai_score_quality: Optional[int] = None
    ai_score_total: Optional[int] = None
    ai_model: Optional[str] = None
    ai_reason: Optional[str] = None
    ai_validated_at: Optional[str] = None
    status: str = "candidate"
    manually_verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        d = asdict(self)
        # Convert tags list to JSON string for storage
        if isinstance(d.get("tags"), list):
            d["tags"] = json.dumps(d["tags"])
        return d

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "ImageRecord":
        """Create from database row."""
        d = dict(row)
        # Parse tags JSON
        if d.get("tags"):
            try:
                d["tags"] = json.loads(d["tags"])
            except:
                d["tags"] = []
        else:
            d["tags"] = []
        return cls(**d)


class ImageLibrary:
    """
    SQLite-based image library for vocabulary images.
    Designed for easy migration to cloud databases.
    """

    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize the image library.

        Args:
            db_path: Path to SQLite database. Defaults to image-curator/images.db
        """
        self.db_path = db_path or str(Path(__file__).parent / "images.db")
        self._init_database()

    def _init_database(self) -> None:
        """Initialize database schema."""
        with self._get_connection() as conn:
            conn.executescript(SCHEMA)
            # Migration: add word_id column if it doesn't exist (for existing DBs)
            try:
                conn.execute("SELECT word_id FROM images LIMIT 1")
            except sqlite3.OperationalError:
                logger.info("Migrating database: adding word_id column")
                conn.execute("ALTER TABLE images ADD COLUMN word_id TEXT")
            logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def _get_connection(self):
        """Get database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()

    # =========================================================================
    # CRUD Operations
    # =========================================================================

    def add_image(self, image: ImageRecord, actor: str = "system") -> int:
        """
        Add an image to the library.

        Args:
            image: ImageRecord to add
            actor: Who is adding (for audit trail)

        Returns:
            ID of inserted image
        """
        with self._get_connection() as conn:
            data = image.to_dict()
            data.pop("id", None)  # Remove id for insert
            data["created_at"] = datetime.now().isoformat()
            data["updated_at"] = data["created_at"]

            columns = ", ".join(data.keys())
            placeholders = ", ".join(["?" for _ in data])

            cursor = conn.execute(
                f"INSERT OR REPLACE INTO images ({columns}) VALUES ({placeholders})",
                list(data.values()),
            )
            image_id = cursor.lastrowid

            # Log history
            self._log_history(
                conn, image_id, "created", actor, f"Added image from {image.source}"
            )

            logger.info(f"Added image {image_id} for word '{image.word}'")
            return image_id

    def get_image(self, image_id: int) -> Optional[ImageRecord]:
        """Get image by ID."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM images WHERE id = ?", (image_id,)
            ).fetchone()
            return ImageRecord.from_row(row) if row else None

    def get_images_for_word(self, word: str) -> List[ImageRecord]:
        """Get all images for a word."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM images WHERE word = ? ORDER BY ai_score_total DESC",
                (word,),
            ).fetchall()
            return [ImageRecord.from_row(row) for row in rows]

    def get_selected_image(self, word: str) -> Optional[ImageRecord]:
        """Get the selected image for a word."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM images WHERE word = ? AND status = 'selected' LIMIT 1",
                (word,),
            ).fetchone()
            return ImageRecord.from_row(row) if row else None

    def update_image(self, image_id: int, updates: Dict, actor: str = "system") -> bool:
        """
        Update image fields.

        Args:
            image_id: Image ID
            updates: Dictionary of fields to update
            actor: Who is updating

        Returns:
            True if updated
        """
        if not updates:
            return False

        updates["updated_at"] = datetime.now().isoformat()

        with self._get_connection() as conn:
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            conn.execute(
                f"UPDATE images SET {set_clause} WHERE id = ?",
                list(updates.values()) + [image_id],
            )

            self._log_history(
                conn, image_id, "updated", actor, f"Updated: {list(updates.keys())}"
            )
            return True

    def select_image(self, image_id: int, actor: str = "ai") -> bool:
        """
        Mark an image as selected for its word.
        Deselects any previously selected image for the same word.
        """
        with self._get_connection() as conn:
            # Get the word for this image
            row = conn.execute(
                "SELECT word FROM images WHERE id = ?", (image_id,)
            ).fetchone()

            if not row:
                return False

            word = row["word"]

            # Deselect any existing selection
            conn.execute(
                "UPDATE images SET status = 'candidate' WHERE word = ? AND status = 'selected'",
                (word,),
            )

            # Select this image
            conn.execute(
                "UPDATE images SET status = 'selected', updated_at = ? WHERE id = ?",
                (datetime.now().isoformat(), image_id),
            )

            self._log_history(
                conn, image_id, "selected", actor, f"Selected as image for '{word}'"
            )

            logger.info(f"Selected image {image_id} for word '{word}'")
            return True

    def reject_image(self, image_id: int, reason: str, actor: str = "ai") -> bool:
        """Mark an image as rejected."""
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE images SET status = 'rejected', updated_at = ? WHERE id = ?",
                (datetime.now().isoformat(), image_id),
            )

            self._log_history(conn, image_id, "rejected", actor, reason)
            return True

    def verify_image(self, image_id: int, verified_by: str) -> bool:
        """Manually verify an image."""
        with self._get_connection() as conn:
            conn.execute(
                """UPDATE images SET 
                   manually_verified = TRUE, 
                   verified_by = ?, 
                   verified_at = ?,
                   updated_at = ?
                   WHERE id = ?""",
                (
                    verified_by,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    image_id,
                ),
            )

            self._log_history(
                conn, image_id, "verified", f"admin:{verified_by}", "Manually verified"
            )
            return True

    def delete_image(self, image_id: int, actor: str = "system") -> bool:
        """Delete an image from the library."""
        with self._get_connection() as conn:
            # Log before delete
            self._log_history(conn, image_id, "deleted", actor, "Image removed")

            conn.execute("DELETE FROM images WHERE id = ?", (image_id,))
            return True

    # =========================================================================
    # Query Operations
    # =========================================================================

    def search_images(
        self,
        word: Optional[str] = None,
        lesson_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        min_score: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[ImageRecord], int]:
        """
        Search images with filters.

        Returns:
            Tuple of (results, total_count)
        """
        conditions = []
        params = []

        if word:
            conditions.append("word LIKE ?")
            params.append(f"%{word}%")
        if lesson_id:
            conditions.append("lesson_id = ?")
            params.append(lesson_id)
        if category:
            conditions.append("category = ?")
            params.append(category)
        if status:
            conditions.append("status = ?")
            params.append(status)
        if source:
            conditions.append("source = ?")
            params.append(source)
        if min_score is not None:
            conditions.append("ai_score_total >= ?")
            params.append(min_score)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        with self._get_connection() as conn:
            # Get total count
            count = conn.execute(
                f"SELECT COUNT(*) FROM images WHERE {where_clause}", params
            ).fetchone()[0]

            # Get results
            rows = conn.execute(
                f"""SELECT * FROM images 
                    WHERE {where_clause} 
                    ORDER BY ai_score_total DESC, created_at DESC
                    LIMIT ? OFFSET ?""",
                params + [limit, offset],
            ).fetchall()

            return [ImageRecord.from_row(row) for row in rows], count

    def get_words_without_images(self, lesson_id: Optional[str] = None) -> List[str]:
        """Get words that don't have a selected image."""
        # This would need to be joined with vocabulary data
        # For now, returns words with only rejected/candidate images
        with self._get_connection() as conn:
            query = """
                SELECT DISTINCT word FROM images 
                WHERE word NOT IN (
                    SELECT word FROM images WHERE status = 'selected'
                )
            """
            if lesson_id:
                query += " AND lesson_id = ?"
                rows = conn.execute(query, (lesson_id,)).fetchall()
            else:
                rows = conn.execute(query).fetchall()

            return [row["word"] for row in rows]

    def get_statistics(self) -> Dict:
        """Get library statistics."""
        with self._get_connection() as conn:
            stats = {}

            # Total images
            stats["total"] = conn.execute("SELECT COUNT(*) FROM images").fetchone()[0]

            # By status
            rows = conn.execute(
                "SELECT status, COUNT(*) as cnt FROM images GROUP BY status"
            ).fetchall()
            stats["by_status"] = {row["status"]: row["cnt"] for row in rows}

            # By source
            rows = conn.execute(
                "SELECT source, COUNT(*) as cnt FROM images GROUP BY source"
            ).fetchall()
            stats["by_source"] = {row["source"]: row["cnt"] for row in rows}

            # By category
            rows = conn.execute(
                "SELECT category, COUNT(*) as cnt FROM images WHERE category IS NOT NULL GROUP BY category"
            ).fetchall()
            stats["by_category"] = {row["category"]: row["cnt"] for row in rows}

            # Words with selected images
            stats["words_with_images"] = conn.execute(
                "SELECT COUNT(DISTINCT word) FROM images WHERE status = 'selected'"
            ).fetchone()[0]

            # Average AI score
            row = conn.execute(
                "SELECT AVG(ai_score_total) FROM images WHERE ai_score_total IS NOT NULL"
            ).fetchone()
            stats["avg_ai_score"] = round(row[0], 2) if row[0] else None

            # Verified images
            stats["verified"] = conn.execute(
                "SELECT COUNT(*) FROM images WHERE manually_verified = TRUE"
            ).fetchone()[0]

            return stats

    # =========================================================================
    # Queue Operations
    # =========================================================================

    def add_to_queue(self, word: str, lesson_id: str, priority: int = 0) -> bool:
        """Add a word to the curation queue."""
        with self._get_connection() as conn:
            try:
                conn.execute(
                    """INSERT OR IGNORE INTO curation_queue 
                       (word, lesson_id, priority) VALUES (?, ?, ?)""",
                    (word, lesson_id, priority),
                )
                return True
            except:
                return False

    def get_next_queue_item(self) -> Optional[Dict]:
        """Get next item from curation queue."""
        with self._get_connection() as conn:
            row = conn.execute(
                """SELECT * FROM curation_queue 
                   WHERE status = 'pending' 
                   ORDER BY priority DESC, created_at ASC 
                   LIMIT 1"""
            ).fetchone()

            if row:
                conn.execute(
                    "UPDATE curation_queue SET status = 'processing', last_attempt_at = ? WHERE id = ?",
                    (datetime.now().isoformat(), row["id"]),
                )
                return dict(row)
            return None

    def complete_queue_item(
        self, queue_id: int, success: bool, error: str = None
    ) -> None:
        """Mark queue item as complete or failed."""
        with self._get_connection() as conn:
            if success:
                conn.execute(
                    "UPDATE curation_queue SET status = 'completed' WHERE id = ?",
                    (queue_id,),
                )
            else:
                conn.execute(
                    """UPDATE curation_queue SET 
                       status = 'pending', 
                       attempts = attempts + 1,
                       error_message = ?
                       WHERE id = ?""",
                    (error, queue_id),
                )

    def get_queue_stats(self) -> Dict:
        """Get queue statistics."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT status, COUNT(*) as cnt FROM curation_queue GROUP BY status"
            ).fetchall()
            return {row["status"]: row["cnt"] for row in rows}

    # =========================================================================
    # History/Audit
    # =========================================================================

    def _log_history(
        self, conn, image_id: int, action: str, actor: str, details: str
    ) -> None:
        """Log an action to history."""
        conn.execute(
            "INSERT INTO image_history (image_id, action, actor, details) VALUES (?, ?, ?, ?)",
            (image_id, action, actor, details),
        )

    def get_history(self, image_id: int) -> List[Dict]:
        """Get history for an image."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM image_history WHERE image_id = ? ORDER BY created_at DESC",
                (image_id,),
            ).fetchall()
            return [dict(row) for row in rows]

    def get_recent_activity(self, limit: int = 50) -> List[Dict]:
        """Get recent activity across all images."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT h.*, i.word, i.url 
                   FROM image_history h 
                   LEFT JOIN images i ON h.image_id = i.id
                   ORDER BY h.created_at DESC 
                   LIMIT ?""",
                (limit,),
            ).fetchall()
            return [dict(row) for row in rows]


# Convenience functions
def get_library(db_path: Optional[str] = None) -> ImageLibrary:
    """Get or create image library instance."""
    return ImageLibrary(db_path)


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)

    library = get_library()
    stats = library.get_statistics()
    print("Image Library Statistics:")
    print(json.dumps(stats, indent=2))

/**
 * Lesson Loader Service
 * 
 * IMPORTANT: This module now loads ALL lesson data from CSV files only.
 * No more hardcoded JavaScript lesson data.
 * 
 * To add a new lesson:
 * 1. Create a CSV file in /src/data/csv/
 * 2. Add an entry to /src/data/lesson_metadata.json
 * 
 * CSV Schema:
 * word_id,portuguese,english,pronunciation,type,grammar_notes,cultural_note,tip,example1_pt,example1_en,example2_pt,example2_en,image
 * 
 * @module data/LessonLoader
 */

// Re-export everything from the CSV-only loader
export * from './CSVOnlyLessonLoader.js';
export { default } from './CSVOnlyLessonLoader.js';

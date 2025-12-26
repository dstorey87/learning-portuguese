#!/usr/bin/env node
/**
 * Requirements Audit Script
 * 
 * Scans /docs/*.md and root *.md files to identify requirements,
 * compares with IMPLEMENTATION_PLAN.md, and updates it with findings.
 * 
 * RULES (enforced by design):
 * 1. Never invents progress - only reports explicit markers
 * 2. Never removes or rewrites requirement text
 * 3. All updates are evidence-based and reproducible
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const IMPLEMENTATION_PLAN = path.join(ROOT_DIR, 'IMPLEMENTATION_PLAN.md');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Patterns to identify requirements
const PATTERNS = {
    checkbox_done: /^[-*]\s*\[x\]/gim,
    checkbox_todo: /^[-*]\s*\[\s*\]/gim,
    heading_h2: /^##\s+(.+)$/gm,
    heading_h3: /^###\s+(.+)$/gm,
    task_id: /\b([A-Z]+-\d+)\b/g,
    status_marker: /\|\s*(✅|❌|⚠️|🔄|⏳|\[x\]|\[ \])/g
};

/**
 * Scan a markdown file for requirements
 */
function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(ROOT_DIR, filePath);
    
    const results = {
        file: relativePath,
        checkboxes_done: (content.match(PATTERNS.checkbox_done) || []).length,
        checkboxes_todo: (content.match(PATTERNS.checkbox_todo) || []).length,
        headings_h2: (content.match(PATTERNS.heading_h2) || []).map(h => h.replace(/^##\s+/, '')),
        headings_h3: (content.match(PATTERNS.heading_h3) || []).map(h => h.replace(/^###\s+/, '')),
        task_ids: [...new Set(content.match(PATTERNS.task_id) || [])],
        has_status_markers: PATTERNS.status_marker.test(content)
    };
    
    return results;
}

/**
 * Get all markdown files to scan
 */
function getMarkdownFiles() {
    const files = [];
    
    // Root *.md files
    const rootFiles = fs.readdirSync(ROOT_DIR)
        .filter(f => f.endsWith('.md') && f !== 'IMPLEMENTATION_PLAN.md')
        .map(f => path.join(ROOT_DIR, f));
    files.push(...rootFiles);
    
    // docs/*.md files
    if (fs.existsSync(DOCS_DIR)) {
        const docsFiles = fs.readdirSync(DOCS_DIR)
            .filter(f => f.endsWith('.md'))
            .map(f => path.join(DOCS_DIR, f));
        files.push(...docsFiles);
    }
    
    return files;
}

/**
 * Run npm checks and record results
 */
function runNpmChecks() {
    const checks = {
        lint: { status: 'Unknown', error: null },
        test: { status: 'Unknown', error: null },
        build: { status: 'Not configured', error: null }
    };
    
    // Check if package.json exists
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        return checks;
    }
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts || {};
    
    // Run lint if available
    if (scripts.lint) {
        try {
            execSync('npm run lint', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 60000 });
            checks.lint.status = 'Pass';
        } catch (e) {
            checks.lint.status = 'Fail';
            checks.lint.error = e.message?.substring(0, 200) || 'Unknown error';
        }
    } else {
        checks.lint.status = 'Not configured';
    }
    
    // Note: test is skipped in CI to avoid Playwright complexity
    // Just check if the script exists
    if (scripts.test) {
        checks.test.status = 'Configured (not run in audit)';
    } else {
        checks.test.status = 'Not configured';
    }
    
    // Check build
    if (scripts.build) {
        try {
            execSync('npm run build', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 120000 });
            checks.build.status = 'Pass';
        } catch (e) {
            checks.build.status = 'Fail';
            checks.build.error = e.message?.substring(0, 200) || 'Unknown error';
        }
    }
    
    return checks;
}

/**
 * Compare scanned requirements with IMPLEMENTATION_PLAN.md
 */
function compareWithPlan(scanResults, planContent) {
    const issues = [];
    const planTaskIds = [...new Set(planContent.match(PATTERNS.task_id) || [])];
    
    // Collect all task IDs from scanned files
    const allScannedTaskIds = new Set();
    for (const result of scanResults) {
        result.task_ids.forEach(id => allScannedTaskIds.add(id));
    }
    
    // Find task IDs in requirement docs that aren't in the plan
    const untrackedIds = [...allScannedTaskIds].filter(id => !planTaskIds.includes(id));
    
    // Find task IDs in plan that aren't in requirement docs (potentially removed)
    const orphanedIds = planTaskIds.filter(id => !allScannedTaskIds.has(id) && id.length < 20);
    
    if (untrackedIds.length > 0) {
        issues.push({
            type: 'untracked',
            message: `Task IDs found in requirement docs but not tracked in IMPLEMENTATION_PLAN.md`,
            ids: untrackedIds.slice(0, 20) // Limit to first 20
        });
    }
    
    // Check for files with many unchecked items
    for (const result of scanResults) {
        if (result.checkboxes_todo > 10) {
            issues.push({
                type: 'many_todos',
                message: `File has ${result.checkboxes_todo} unchecked items`,
                file: result.file
            });
        }
    }
    
    return { issues, untrackedIds, orphanedIds };
}

/**
 * Generate Quick Reference summary
 */
function generateQuickReference(scanResults, comparison, npmChecks) {
    const totalDone = scanResults.reduce((sum, r) => sum + r.checkboxes_done, 0);
    const totalTodo = scanResults.reduce((sum, r) => sum + r.checkboxes_todo, 0);
    const totalItems = totalDone + totalTodo;
    
    // Note: We don't invent percentages - only count explicit markers
    const lines = [
        '## 🤖 AUTOMATED AUDIT SUMMARY',
        '',
        `> **Last Audit:** ${new Date().toISOString()}`,
        '> **Method:** Automated scan of checkbox markers and task IDs',
        '',
        '### Checkbox Counts (from all requirement docs)',
        '',
        '| Metric | Value |',
        '|--------|-------|',
        `| Total [x] (done) | ${totalDone} |`,
        `| Total [ ] (todo) | ${totalTodo} |`,
        `| Total items | ${totalItems} |`,
        '',
        '### Files Scanned',
        '',
        '| File | Done | Todo | Has Status Markers |',
        '|------|------|------|-------------------|'
    ];
    
    for (const r of scanResults) {
        lines.push(`| ${r.file} | ${r.checkboxes_done} | ${r.checkboxes_todo} | ${r.has_status_markers ? 'Yes' : 'No'} |`);
    }
    
    lines.push('');
    lines.push('### NPM Check Results');
    lines.push('');
    lines.push('| Check | Status |');
    lines.push('|-------|--------|');
    for (const [name, result] of Object.entries(npmChecks)) {
        lines.push(`| ${name} | ${result.status} |`);
    }
    
    if (comparison.issues.length > 0) {
        lines.push('');
        lines.push('### ⚠️ Issues Detected');
        lines.push('');
        for (const issue of comparison.issues.slice(0, 10)) {
            lines.push(`- **${issue.type}:** ${issue.message}`);
            if (issue.ids) {
                lines.push(`  - IDs: ${issue.ids.slice(0, 5).join(', ')}${issue.ids.length > 5 ? '...' : ''}`);
            }
            if (issue.file) {
                lines.push(`  - File: ${issue.file}`);
            }
        }
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
    
    return lines.join('\n');
}

/**
 * Generate audit log entry
 */
function generateAuditLogEntry(scanResults, comparison, npmChecks) {
    const timestamp = new Date().toISOString();
    const totalDone = scanResults.reduce((sum, r) => sum + r.checkboxes_done, 0);
    const totalTodo = scanResults.reduce((sum, r) => sum + r.checkboxes_todo, 0);
    const issueCount = comparison.issues.length;
    
    return `| ${timestamp} | GitHub Actions | Scanned ${scanResults.length} files, ${totalDone} done, ${totalTodo} todo, ${issueCount} issues |`;
}

/**
 * Update IMPLEMENTATION_PLAN.md with audit results
 */
function updateImplementationPlan(quickRef, auditLogEntry) {
    let content = fs.readFileSync(IMPLEMENTATION_PLAN, 'utf8');
    const originalContent = content;
    
    // Remove existing automated audit summary if present
    const auditSectionRegex = /## 🤖 AUTOMATED AUDIT SUMMARY[\s\S]*?(?=\n## [^🤖]|\n# |$)/;
    content = content.replace(auditSectionRegex, '');
    
    // Find the first heading after the metadata
    const firstHeadingMatch = content.match(/^(#[^#][\s\S]*?\n)(## )/m);
    if (firstHeadingMatch) {
        const insertPos = content.indexOf(firstHeadingMatch[2]);
        content = content.slice(0, insertPos) + quickRef + content.slice(insertPos);
    } else {
        // If no heading found, append at the end
        content = content + '\n' + quickRef;
    }
    
    // Update audit log - find the last row of the table and add after it
    const auditLogSection = content.match(/## 🔍 AUDIT LOG[\s\S]*?(?=\n---|\n## [^🔍]|\n# |$)/);
    if (auditLogSection) {
        // Find all table rows in the audit log section
        const sectionStart = content.indexOf(auditLogSection[0]);
        const sectionContent = auditLogSection[0];
        
        // Find the last table row (line starting with |)
        const tableRowRegex = /\|[^\n]+\|\n/g;
        let lastMatch;
        let match;
        while ((match = tableRowRegex.exec(sectionContent)) !== null) {
            lastMatch = match;
        }
        
        if (lastMatch) {
            const insertPos = sectionStart + lastMatch.index + lastMatch[0].length;
            content = content.slice(0, insertPos) + auditLogEntry + '\n' + content.slice(insertPos);
        }
    }
    
    // Only write if content changed
    if (content !== originalContent) {
        fs.writeFileSync(IMPLEMENTATION_PLAN, content, 'utf8');
        return true;
    }
    
    return false;
}

/**
 * Main audit function
 */
function main() {
    console.log('🔍 Starting requirements audit...\n');
    
    // Get all markdown files
    const files = getMarkdownFiles();
    console.log(`📁 Found ${files.length} markdown files to scan\n`);
    
    // Scan each file
    const scanResults = files.map(f => scanFile(f));
    
    for (const r of scanResults) {
        console.log(`  ${r.file}: ${r.checkboxes_done} done, ${r.checkboxes_todo} todo, ${r.task_ids.length} task IDs`);
    }
    
    // Read implementation plan
    if (!fs.existsSync(IMPLEMENTATION_PLAN)) {
        console.error('❌ IMPLEMENTATION_PLAN.md not found!');
        process.exit(1);
    }
    const planContent = fs.readFileSync(IMPLEMENTATION_PLAN, 'utf8');
    
    // Compare
    console.log('\n📊 Comparing with IMPLEMENTATION_PLAN.md...');
    const comparison = compareWithPlan(scanResults, planContent);
    
    if (comparison.issues.length > 0) {
        console.log(`\n⚠️  Found ${comparison.issues.length} issues:`);
        for (const issue of comparison.issues) {
            console.log(`   - ${issue.type}: ${issue.message}`);
        }
    } else {
        console.log('✅ No major issues found');
    }
    
    // Run npm checks
    console.log('\n🔧 Running npm checks...');
    const npmChecks = runNpmChecks();
    for (const [name, result] of Object.entries(npmChecks)) {
        console.log(`   ${name}: ${result.status}`);
    }
    
    // Generate updates
    const quickRef = generateQuickReference(scanResults, comparison, npmChecks);
    const auditLogEntry = generateAuditLogEntry(scanResults, comparison, npmChecks);
    
    // Update plan
    console.log('\n📝 Updating IMPLEMENTATION_PLAN.md...');
    const changed = updateImplementationPlan(quickRef, auditLogEntry);
    
    if (changed) {
        console.log('✅ IMPLEMENTATION_PLAN.md updated');
        // Signal to workflow that changes were made
        process.exit(0);
    } else {
        console.log('ℹ️  No changes needed');
        // Exit with code 42 to signal "no changes" to the workflow
        process.exit(42);
    }
}

main();

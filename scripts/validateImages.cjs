#!/usr/bin/env node
/* eslint-env node */
/**
 * Image Validation Script
 * 
 * PURPOSE: Verify all image URLs in the registry are working and correct
 * 
 * USAGE:
 *   node scripts/validateImages.js           # Full validation
 *   node scripts/validateImages.js --quick   # Quick URL check only
 *   node scripts/validateImages.js --report  # Generate detailed report
 * 
 * OUTPUT: Console report + optional JSON file
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import registry (we'll use require since this is Node)
const registryPath = path.join(__dirname, '../src/config/imageRegistry.js');

// Parse IMAGE_REGISTRY from file (since we can't use ES modules directly)
function loadRegistry() {
    const content = fs.readFileSync(registryPath, 'utf-8');
    
    // Extract the IMAGE_REGISTRY object
    const match = content.match(/const IMAGE_REGISTRY = \{([\s\S]*?)\n\};/);
    if (!match) {
        throw new Error('Could not parse IMAGE_REGISTRY from file');
    }
    
    // Use a safer approach - just extract URLs and metadata
    const entries = {};
    const regex = /(\w+):\s*\{[\s\S]*?url:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?status:\s*'([^']+)'/g;
    
    let entryMatch;
    while ((entryMatch = regex.exec(content)) !== null) {
        entries[entryMatch[1]] = {
            url: entryMatch[2],
            description: entryMatch[3],
            category: entryMatch[4],
            status: entryMatch[5]
        };
    }
    
    return entries;
}

/**
 * Check if a URL is reachable and returns an image
 */
function checkImageUrl(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, { timeout: 10000 }, (res) => {
            const contentType = res.headers['content-type'] || '';
            const isImage = contentType.startsWith('image/');
            const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
            
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                contentType,
                isImage,
                isRedirect,
                redirectUrl: isRedirect ? res.headers.location : null
            });
        });
        
        req.on('error', (err) => {
            resolve({
                ok: false,
                status: 0,
                error: err.message,
                isImage: false
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                ok: false,
                status: 0,
                error: 'Timeout',
                isImage: false
            });
        });
    });
}

/**
 * Main validation function
 */
async function validateImages(options = {}) {
    console.log('\n🖼️  IMAGE REGISTRY VALIDATION');
    console.log('═'.repeat(50));
    console.log(`Started: ${new Date().toISOString()}\n`);
    
    const registry = loadRegistry();
    const keys = Object.keys(registry);
    
    console.log(`Found ${keys.length} images to validate\n`);
    
    const results = {
        timestamp: new Date().toISOString(),
        total: keys.length,
        valid: [],
        broken: [],
        warnings: [],
        byCategory: {}
    };
    
    let checked = 0;
    
    for (const key of keys) {
        const entry = registry[key];
        checked++;
        
        process.stdout.write(`[${checked}/${keys.length}] Checking "${key}"... `);
        
        const check = await checkImageUrl(entry.url);
        
        // Track by category
        if (!results.byCategory[entry.category]) {
            results.byCategory[entry.category] = { valid: 0, broken: 0 };
        }
        
        if (check.ok && check.isImage) {
            console.log('✅ Valid');
            results.valid.push({
                key,
                url: entry.url,
                category: entry.category,
                description: entry.description
            });
            results.byCategory[entry.category].valid++;
        } else if (check.isRedirect) {
            console.log(`⚠️  Redirect (${check.status}) → ${check.redirectUrl}`);
            results.warnings.push({
                key,
                url: entry.url,
                issue: 'redirect',
                redirectUrl: check.redirectUrl,
                category: entry.category
            });
            // Still count as valid since redirects usually work
            results.byCategory[entry.category].valid++;
        } else {
            console.log(`❌ Broken (${check.status || check.error})`);
            results.broken.push({
                key,
                url: entry.url,
                status: check.status,
                error: check.error,
                contentType: check.contentType,
                category: entry.category,
                description: entry.description
            });
            results.byCategory[entry.category].broken++;
        }
        
        // Small delay to avoid rate limiting
        if (!options.quick) {
            await new Promise(r => setTimeout(r, 100));
        }
    }
    
    // Print summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Total images:    ${results.total}`);
    console.log(`✅ Valid:        ${results.valid.length}`);
    console.log(`⚠️  Warnings:     ${results.warnings.length}`);
    console.log(`❌ Broken:       ${results.broken.length}`);
    console.log(`Success rate:    ${((results.valid.length / results.total) * 100).toFixed(1)}%\n`);
    
    // Category breakdown
    console.log('📂 BY CATEGORY:');
    for (const [cat, stats] of Object.entries(results.byCategory)) {
        const total = stats.valid + stats.broken;
        const pct = ((stats.valid / total) * 100).toFixed(0);
        console.log(`   ${cat.padEnd(15)} ${stats.valid}/${total} (${pct}%)`);
    }
    
    // List broken images
    if (results.broken.length > 0) {
        console.log('\n❌ BROKEN IMAGES:');
        for (const item of results.broken) {
            console.log(`   - ${item.key}: ${item.error || `HTTP ${item.status}`}`);
            console.log(`     URL: ${item.url}`);
            console.log(`     Expected: ${item.description}`);
        }
    }
    
    // List warnings
    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS (redirects):');
        for (const item of results.warnings) {
            console.log(`   - ${item.key}: redirects to ${item.redirectUrl}`);
        }
    }
    
    // Save report if requested
    if (options.report) {
        const reportPath = path.join(__dirname, '../test-results/image-validation-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log(`Completed: ${new Date().toISOString()}`);
    
    // Exit with error code if broken images found
    if (results.broken.length > 0) {
        console.log('\n⚠️  Some images need attention!');
        process.exit(1);
    } else {
        console.log('\n✅ All images validated successfully!');
        process.exit(0);
    }
}

// Parse CLI args
const args = process.argv.slice(2);
const options = {
    quick: args.includes('--quick'),
    report: args.includes('--report')
};

// Run validation
validateImages(options).catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});

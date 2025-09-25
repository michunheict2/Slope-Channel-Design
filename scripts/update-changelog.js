#!/usr/bin/env node

/**
 * Changelog Update Script
 * 
 * This script helps maintain the CHANGELOG.md file by providing
 * a structured way to add new entries.
 * 
 * Usage:
 *   node scripts/update-changelog.js --version 1.3.0 --type minor
 *   node scripts/update-changelog.js --add "New feature description"
 */

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    return '1.0.0';
  }
}

function updateChangelog(version, type, description = '') {
  try {
    let content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const date = getCurrentDate();
    
    // Create new version entry
    const newEntry = `## [${version}] - ${date}

### ${type === 'major' ? 'Changed' : type === 'minor' ? 'Added' : 'Fixed'}
${description ? `- ${description}` : '- Bug fixes and improvements'}

`;
    
    // Insert after [Unreleased] section
    const unreleasedIndex = content.indexOf('## [Unreleased]');
    const nextSectionIndex = content.indexOf('## [', unreleasedIndex + 15);
    
    if (nextSectionIndex !== -1) {
      content = content.slice(0, nextSectionIndex) + newEntry + content.slice(nextSectionIndex);
    } else {
      content += '\n' + newEntry;
    }
    
    fs.writeFileSync(CHANGELOG_PATH, content);
    console.log(`✅ Updated CHANGELOG.md with version ${version}`);
    
  } catch (error) {
    console.error('Error updating changelog:', error.message);
  }
}

function addToUnreleased(description, category = 'Added') {
  try {
    let content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const date = getCurrentDate();
    
    // Find [Unreleased] section
    const unreleasedIndex = content.indexOf('## [Unreleased]');
    if (unreleasedIndex === -1) {
      console.error('Could not find [Unreleased] section in CHANGELOG.md');
      return;
    }
    
    // Find the end of [Unreleased] section
    const nextSectionIndex = content.indexOf('## [', unreleasedIndex + 15);
    
    if (nextSectionIndex !== -1) {
      const unreleasedContent = content.slice(unreleasedIndex, nextSectionIndex);
      
      // Check if category already exists
      const categoryIndex = unreleasedContent.indexOf(`### ${category}`);
      
      if (categoryIndex !== -1) {
        // Add to existing category
        const insertIndex = unreleasedIndex + categoryIndex + unreleasedContent.slice(categoryIndex).indexOf('\n') + 1;
        content = content.slice(0, insertIndex) + `- ${description}\n` + content.slice(insertIndex);
      } else {
        // Add new category
        const insertIndex = nextSectionIndex;
        const newCategory = `\n### ${category}\n- ${description}\n\n`;
        content = content.slice(0, insertIndex) + newCategory + content.slice(insertIndex);
      }
    }
    
    fs.writeFileSync(CHANGELOG_PATH, content);
    console.log(`✅ Added "${description}" to CHANGELOG.md under ${category}`);
    
  } catch (error) {
    console.error('Error updating changelog:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--version') && args.includes('--type')) {
  const versionIndex = args.indexOf('--version');
  const typeIndex = args.indexOf('--type');
  const version = args[versionIndex + 1];
  const type = args[typeIndex + 1];
  
  updateChangelog(version, type);
} else if (args.includes('--add')) {
  const addIndex = args.indexOf('--add');
  const description = args[addIndex + 1];
  const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : 'Added';
  
  addToUnreleased(description, category);
} else {
  console.log(`
Changelog Update Script

Usage:
  node scripts/update-changelog.js --version 1.3.0 --type minor
  node scripts/update-changelog.js --add "New feature description"
  node scripts/update-changelog.js --add "Bug fix" --category "Fixed"

Options:
  --version    Version number (e.g., 1.3.0)
  --type       Version type: major, minor, patch
  --add        Add entry to [Unreleased] section
  --category   Category for new entry: Added, Changed, Fixed, Removed
  `);
}

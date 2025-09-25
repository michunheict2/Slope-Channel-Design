# Development Workflow

This document outlines the development workflow for the Slope Channel Design Tool to ensure consistent version tracking and change management.

## Version Management

### Semantic Versioning
We follow [Semantic Versioning](https://semver.org/) (SemVer):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Version Update Process

#### For New Features (Minor Version)
```bash
# 1. Update CHANGELOG.md with new features
npm run changelog:update

# 2. Update version and create git tag
npm run version:minor

# 3. Commit changelog updates
git add CHANGELOG.md package.json
git commit -m "docs: update changelog for v1.3.0"

# 4. Push to GitHub
git push origin main --tags
```

#### For Bug Fixes (Patch Version)
```bash
npm run version:patch
git add CHANGELOG.md package.json
git commit -m "docs: update changelog for v1.2.1"
git push origin main --tags
```

#### For Breaking Changes (Major Version)
```bash
npm run version:major
git add CHANGELOG.md package.json
git commit -m "docs: update changelog for v2.0.0"
git push origin main --tags
```

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <subject>

<body>

<footer>
```

### Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `changelog`: Changelog updates

### Examples:
```bash
git commit -m "feat: add Hong Kong IDF curves support

- Implement GEO TGN 30 (2023) IDF curves
- Add climate change adjustment (+28.1%)
- Support 9 return periods (2-1000 years)
- Add comprehensive test coverage

Closes #123"

git commit -m "fix: correct trapezoid area calculation

- Change formula from y × (b + z×y) to ½ × (T + b) × y
- Update UI displays with correct formulas
- Add test cases for different scenarios

Fixes #456"
```

## Development Checklist

Before pushing to GitHub:

- [ ] Run tests: `npm test`
- [ ] Check linting: `npm run lint`
- [ ] Type check: `npm run typecheck`
- [ ] Update CHANGELOG.md if needed
- [ ] Update version in package.json if needed
- [ ] Write descriptive commit message
- [ ] Push with tags if version changed

## Changelog Maintenance

### Adding New Entries
```bash
# Add to [Unreleased] section
node scripts/update-changelog.js --add "New feature description"

# Add with specific category
node scripts/update-changelog.js --add "Bug fix" --category "Fixed"
```

### Creating New Version Entry
```bash
# Create new version entry
node scripts/update-changelog.js --version 1.3.0 --type minor
```

## File Structure for Version Tracking

```
slope-drainage/
├── CHANGELOG.md          # Version history and changes
├── package.json          # Version number and scripts
├── scripts/
│   └── update-changelog.js  # Changelog maintenance script
├── .gitmessage          # Git commit template
└── DEVELOPMENT.md       # This file
```

## Release Process

1. **Development**: Make changes, add tests, update documentation
2. **Testing**: Run full test suite and manual testing
3. **Versioning**: Update version and changelog
4. **Commit**: Commit with proper message format
5. **Tag**: Create git tag for version
6. **Push**: Push to GitHub with tags
7. **Document**: Update any external documentation

## Quick Commands

```bash
# Full quality check
npm run check

# Update to next minor version
npm run version:minor

# Add feature to changelog
node scripts/update-changelog.js --add "Feature description"

# View current version
npm version --json

# View git tags
git tag -l
```

## GitHub Integration

- All pushes should include descriptive commit messages
- Major features should include issue references
- Breaking changes should be clearly documented
- Tags are automatically created for releases
- CHANGELOG.md serves as the primary release notes

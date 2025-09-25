# Changelog

All notable changes to the Slope Channel Design Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-25

### Added
- Hong Kong IDF curves implementation (GEO TGN 30, 2023)
  - Support for 9 return periods: 2, 5, 10, 20, 50, 100, 200, 500, 1000 years
  - Climate change adjustment (+28.1%) for permanent designs
  - Temporary design option to exclude climate adjustment
  - Real-time calculation with detailed formula display
- Channel depth input for trapezoidal channels
  - Auto-calculation of top width using formula: T = b + 2zy
  - Real-time updates when parameters change
- "Undrain" surface type with runoff coefficient 1.0
- Comprehensive IDF calculation details in results panel
- Detailed test coverage for IDF curves (22 test cases)

### Changed
- Fixed trapezoid area calculation formula from `A = y × (b + z×y)` to `A = ½ × (T + b) × y`
- Updated UI displays to show correct mathematical formulas
- Enhanced Manning calculations to use user-specified channel depth
- Improved detailed calculations panel with step-by-step formulas

### Technical
- Added new hook: `useIDF.ts` for IDF curve calculations
- Updated Manning interface with `channelDepth` and `topWidth` parameters
- Enhanced geometry utilities with corrected trapezoid calculations
- Added comprehensive test suite for IDF functionality

## [1.1.0] - 2025-01-23

### Added
- Detailed calculations panel showing step-by-step formulas
- Enhanced results display with calculation breakdowns
- Comprehensive test coverage for hydrology calculations

### Changed
- Improved UI layout and user experience
- Enhanced calculation accuracy and validation

## [1.0.0] - 2025-01-22

### Added
- Initial release of Slope Channel Design Tool
- Support for trapezoidal and U-shaped channels
- Rational Method for peak flow calculation
- Manning's equation for channel capacity
- Multiple surface types and runoff coefficients
- SI unit conversions throughout
- Basic test coverage

---

## Version History Summary

| Version | Date | Major Features |
|---------|------|----------------|
| 1.2.0 | 2025-01-25 | Hong Kong IDF curves, Channel depth input, Mathematical corrections |
| 1.1.0 | 2025-01-23 | Detailed calculations panel, Enhanced UI |
| 1.0.0 | 2025-01-22 | Initial release, Core functionality |

## Git Commit History

### Recent Commits
- `7462a80` - Implement Hong Kong IDF curves and enhance trapezoidal channel design
- `f3304db` - Update slope channel design components and add detailed calculations

---

*For detailed commit history, see: [GitHub Commits](https://github.com/michunheict2/Slope-Channel-Design/commits/main)*

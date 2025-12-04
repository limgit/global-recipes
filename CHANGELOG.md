# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-05

### Added

- Initial release
- `globalRecipe` function for applying global styles based on recipe variants
- Type-safe variant names and values (inferred from recipe)
- Type-safe selector keys (constrained to defined `selectorGenerators`)
- Support for `base` styles applied to all elements
- Support for `compoundVariants` with variant-specific styles
- Support for `selectors` within styles for state-based styling
- Full support for vanilla-extract at-rules (`@media`, `@layer`, `@supports`, `@container`)

# Changelog

All notable changes to the Clip Coba extension will be documented in this file.

## [1.1.0] - 2026-01-25

### Added
- **YouTube Shorts Support**: Extension now works seamlessly with YouTube Shorts, allowing users to clip and save moments from short-form videos
  - Added detection for `/shorts/` URL pattern
  - Implemented Shorts-specific DOM scraping for video metadata
  - Added subscriber count parsing for Shorts pages
  
- **Refresh Token Authentication**: Improved authentication reliability with automatic token refresh
  - Added `attemptExtensionRefresh()` function to handle token expiration
  - Implemented `fetchWithAuth()` wrapper for automatic retry on 401 errors
  - Extension now stores and uses refresh tokens alongside access tokens
  - Automatic token refresh on API 401 responses

- **Move to Spaces**: Users can now organize clips into different spaces
  - Added space selection functionality
  - Integrated space management with clip saving workflow

### Fixed
- Authentication flow improvements for better session management
- Removed duplicate code for cleaner codebase
- Enhanced error handling with better error messages from API responses

### Changed
- Updated API authentication to use refresh token flow
- Improved video metadata scraping to support both regular videos and Shorts
- Enhanced subscriber count parsing for better accuracy

---

## [1.0.0] - Initial Release

### Added
- Initial extension release
- YouTube video timestamp bookmarking
- Tag management
- Integration with Clip Coba web application

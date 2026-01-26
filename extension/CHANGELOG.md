# Changelog

All notable changes to the Clip Coba extension will be documented in this file.

## [1.3.0] - 2026-01-25

### Added
- **Image Gallery Popup**: New tab-based popup interface for saving images
  - Click extension icon to see all images from current page in a grid layout
  - Multi-select images with checkboxes for batch operations
  - Select space and moodboard directly in popup
  - Create new moodboards without leaving the popup
  - Visual feedback for selected images
  - Progress indicators during batch save
  - Filters out small images (< 100x100px) automatically

### Changed
- **Improved UX**: Replaced hover-based image saving with popup gallery
  - More intuitive - see all page images at once
  - Better for Chrome Web Store compliance
  - No content script injection needed for image saving
- **Tab Navigation**: Popup now has YouTube and Images tabs
  - YouTube tab shows extension status (unchanged functionality)
  - Images tab displays gallery of page images

### Removed
- Hover-over-image save button (replaced by popup gallery)
- Programmatic script injection for image-saver.js
- `scripting` permission (no longer needed)

---

## [1.2.0] - 2026-01-25

### Changed
- **Chrome Web Store Compliance Improvements**:
  - Removed overly broad `<all_urls>` permission for better security and privacy
  - Image saver now uses programmatic injection via extension icon click
  - Added `notifications` permission for user feedback
  - Added `scripting` permission for programmatic content script injection
  - Improved extension description with specific feature details

### Added
- User notification when image saver is activated on a page
- Click extension icon on any page to enable image saving functionality

---

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

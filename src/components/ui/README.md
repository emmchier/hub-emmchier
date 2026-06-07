# UI Components

This directory contains all reusable UI components for the portfolio application.

## Components

### Navigation

- **[Breadcrumb](./breadcrumb/README.md)** - Breadcrumb navigation with back button and current page

### Interactive

- **[Button](./button/README.md)** - Primary button component with multiple variants
- **[ButtonGroup](./button-group/README.md)** - Group of related buttons
- **[CardButton](./card-button/README.md)** - Reusable card button with icons and color variants
- **[ContactButton](./contact-button/README.md)** - Specialized contact action button
- **[Badge](./chip/README.md)** - Small tag-like component for labels
- **[Tab](./tab/README.md)** - Tab navigation component
- **[Pagination](./pagination/README.md)** - Page navigation component

### Layout

- **[Drawer](./drawer/README.md)** - Slide-out panel component
- **[Modal](./modal/README.md)** - Overlay dialog component
- **[Sidebar](./sidebar/README.md)** - Side navigation panel
- **[Overlay](./overlay/README.md)** - Background overlay component

### Content

- **[Text](./text/README.md)** - Typography component with consistent styling
- **[ImageGallery](./image-gallery/README.md)** - Image display and navigation
- **[Empty](./empty/README.md)** - Empty state component

### Navigation

- **[Navbar](./navbar/README.md)** - Top navigation bar
- **[Header](./header/README.md)** - Page header component
- **[InteractiveHeader](./interactive-header/README.md)** - Interactive header with hover animations
- **[Footer](./footer/README.md)** - Page footer component

### Utilities

- **[Icon](./icon/icons.tsx)** - Icon components and utilities
- **[Tooltip](./tooltip/README.md)** - Hover information component
- **[ModeSwitchs](./mode-switchs/README.md)** - Theme mode switcher

## Usage

All components are exported from the main index file and can be imported like:

```tsx
import { Button, Breadcrumb, Text } from '@/components';
```

## Design System

All components follow the established design system with:

- Consistent color palette
- Typography scale
- Spacing system
- Responsive design patterns
- Accessibility standards

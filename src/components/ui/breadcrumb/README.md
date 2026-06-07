# Breadcrumb Component

A reusable breadcrumb navigation component that displays a back button and current page path.

## Description

The Breadcrumb component provides a consistent navigation pattern with a back button (arrow left icon + "Back" text) and the current page name, separated by a "/" character.

## Examples

### Basic Usage

```tsx
import { Breadcrumb } from '@/components/ui/breadcrumb/Breadcrumb';

// In your component
<Breadcrumb currentPath="/contact" />
// Renders: [← Back] / Contact

<Breadcrumb currentPath="/work/project-name" />
// Renders: [← Back] / Project Name

<Breadcrumb currentPath="/about-me" />
// Renders: [← Back] / About Me
```

## Props

| Prop          | Type     | Required | Description                                              |
| ------------- | -------- | -------- | -------------------------------------------------------- |
| `currentPath` | `string` | Yes      | The current URL path (e.g., "/contact", "/work/project") |
| `className`   | `string` | No       | Additional CSS classes to apply to the container         |

## Features

- **Automatic path formatting**: Converts URL slugs to readable text (kebab-case to Title Case)
- **Responsive design**: Adapts to different screen sizes
- **Consistent styling**: Matches the design system colors and typography
- **Accessible**: Proper link semantics and hover states
- **Reusable**: Can be used across different pages

## Styling

- Back button: Light blue color with underline on hover
- Separator: Light blue "/" character
- Current page: White text
- Icon: Chevron left with 8px gap from "Back" text

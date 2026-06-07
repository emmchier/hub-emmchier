# CardButton Component

A reusable card button component with responsive design and multiple color variants.

## Description

The CardButton component provides a consistent interface for interactive cards with icons and text. It supports different types of actions (link, download, copy) and color schemes. For download type, it includes a toggleable chip to switch between PDF and ATS formats.

## Props

| Prop        | Type                                                    | Required | Description                                   |
| ----------- | ------------------------------------------------------- | -------- | --------------------------------------------- |
| `children`  | `React.ReactNode`                                       | Yes      | Content to display in the card                |
| `type`      | `'link' \| 'download' \| 'copy'`                        | Yes      | Type of action, determines the icon displayed |
| `color`     | `'green' \| 'blue' \| 'white' \| 'nightblue' \| 'skin'` | Yes      | Background color variant                      |
| `onClick`   | `() => void`                                            | No       | Click handler function                        |
| `copyText`  | `string`                                                | No       | Text to copy when type is 'copy'              |
| `className` | `string`                                                | No       | Additional CSS classes                        |

## Color Variants

- **green**: `#67CFCB` background, `#112F40` text
- **blue**: `#74BDE8` background, `#112F40` text
- **white**: `#E5E5E5` background, `#112F40` text
- **nightblue**: `#1C4C67` background, `#E5E5E5` text
- **skin**: `#F6D4C2` background, `#112F40` text

## Responsive Design

- **Mobile**: 16px border radius, 72px min-height, no hover effects
- **Desktop**: 24px border radius, 96px min-height, hover scale and shadow effects

## Special Features

### Copy Type

- Automatically copies text to clipboard when clicked
- Shows "Copiado!" message for 2 seconds after copying
- Requires `copyText` prop to specify what to copy

### Download Type

- Includes a toggleable chip showing file format (PDF/ATS)
- Chip is positioned 8px to the right of the main text
- Clicking the chip toggles between PDF and ATS
- Clicking outside the chip logs the download action to console
- Chip has subtle background and hover effects

## Examples

```tsx
// Email with copy action
<CardButton type="copy" color="green" copyText="emmchierchie@gmail.com">
  emmchierchie@gmail.com
</CardButton>

// External link
<CardButton type="link" color="blue" onClick={handleLinkedIn}>
  Linked In
</CardButton>

// Download action with toggleable format
<CardButton type="download" color="white">
  Download Resumé
</CardButton>
```

## Usage

```tsx
import CardButton from '@/components/ui/card-button/CardButton';
```

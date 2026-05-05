# SAGP UI Component Library

A comprehensive, dark-themed React UI component library for the Security Awareness Gamification Platform (SAGP). Built with React 19, TypeScript, Tailwind CSS, and class-variance-authority for a professional security training interface.

## Design System

- **Theme**: Dark mode with deep navy/slate backgrounds
- **Primary Accent**: Teal (#0D9488)
- **Background**: Slate-800/900 (no white backgrounds)
- **Typography**: Clear hierarchy with teal accents for interactive elements
- **Risk Indicators**: Color-coded severity levels (green/yellow/orange/red)

## Components

### Button (`button.tsx`)

Flexible button component with multiple variants and sizes.

**Variants:**
- `primary` - Teal background, primary action
- `secondary` - Slate background, secondary action
- `destructive` - Red background, dangerous actions
- `ghost` - Transparent, minimal style
- `outline` - Bordered style with subtle fill

**Sizes:** `sm` (8px), `md` (10px), `lg` (12px)

**Props:**
- `variant?: ButtonProps['variant']`
- `size?: 'sm' | 'md' | 'lg'`
- `loading?: boolean` - Shows spinner, disables button
- `disabled?: boolean`

```tsx
import { Button } from "@/components/ui";

<Button variant="primary">Submit</Button>
<Button variant="secondary" size="lg">Cancel</Button>
<Button variant="destructive" loading>Deleting...</Button>
```

### Input (`input.tsx`)

Text input component with dark styling, labels, and error states.

**Props:**
- `label?: string` - Optional label above input
- `error?: string` - Error message display
- `helperText?: string` - Helper text below input
- Standard HTML input attributes

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  error="Invalid email format"
/>
```

### Card (`card.tsx`)

Container component with multiple sub-components for structured layouts.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Large title text
- `CardDescription` - Subtitle/description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

<Card>
  <CardHeader>
    <CardTitle>Training Progress</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### Badge UI (`badge-ui.tsx`)

Display component for badges with risk tier variants.

**Risk Tier Variants:**
- `low` - Green background
- `medium` - Yellow background
- `high` - Orange background
- `critical` - Red background

**General Variants:**
- `default`, `primary`, `secondary`, `destructive`, `success`, `warning`, `info`

```tsx
import { Badge } from "@/components/ui";

<Badge variant="critical">Critical</Badge>
<Badge variant="high">High Risk</Badge>
<Badge variant="low">Low Risk</Badge>
```

### Select (`select.tsx`)

Dropdown select component with dark styling.

**Props:**
- `label?: string` - Optional label
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `options?: Array<{ value: string; label: string; disabled?: boolean }>`

```tsx
import { Select } from "@/components/ui";

<Select
  label="Risk Level"
  options={[
    { value: "low", label: "Low" },
    { value: "high", label: "High" },
  ]}
/>
```

### Dialog (`dialog.tsx`)

Modal dialog component with multiple sub-components.

**Components:**
- `Dialog` - Container
- `DialogTrigger` - Opens dialog
- `DialogContent` - Modal content
- `DialogHeader`, `DialogTitle`, `DialogDescription`
- `DialogFooter` - Footer for actions

**Props:**
- `open?: boolean` - Controlled state
- `onOpenChange?: (open: boolean) => void` - State change callback

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui";

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogTitle>Confirm Action</DialogTitle>
    <p>Are you sure?</p>
  </DialogContent>
</Dialog>
```

### Toast (`toast.tsx`)

Toast notification system with context provider.

**Types:** `success`, `error`, `warning`, `info`

**Setup:**
Wrap your app with `ToastProvider`:

```tsx
import { ToastProvider } from "@/components/ui";

<ToastProvider>
  <App />
</ToastProvider>
```

**Usage:**
```tsx
import { useToast } from "@/components/ui";

const MyComponent = () => {
  const { addToast } = useToast();

  return (
    <button onClick={() => addToast({
      type: "success",
      message: "Action completed!"
    })}>
      Notify
    </button>
  );
};
```

**Props:**
- `type: 'success' | 'error' | 'warning' | 'info'`
- `message: string`
- `duration?: number` - Auto-dismiss duration (ms), default 3000, 0 = manual

### Skeleton (`skeleton.tsx`)

Loading placeholder component.

```tsx
import { Skeleton } from "@/components/ui";

<Skeleton className="h-12 w-full rounded-lg" />
<Skeleton className="h-4 w-3/4 mt-2" />
```

### Progress Bar (`progress-bar.tsx`)

Progress indicator with animation.

**Props:**
- `value?: number` - Current value (0-100)
- `max?: number` - Maximum value, default 100
- `animated?: boolean` - Enable animation
- `label?: string` - Optional label
- `showValue?: boolean` - Show percentage text

```tsx
import { ProgressBar } from "@/components/ui";

<ProgressBar value={65} max={100} label="Completion" showValue />
```

### Avatar (`avatar.tsx`)

User avatar with image or initials fallback.

**Sizes:** `sm`, `md`, `lg`, `xl`

**Props:**
- `src?: string` - Image URL
- `alt?: string` - Image alt text
- `name?: string` - Name for initials fallback
- `size?: 'sm' | 'md' | 'lg' | 'xl'`

```tsx
import { Avatar } from "@/components/ui";

<Avatar name="John Doe" />
<Avatar src="/avatar.jpg" alt="User" size="lg" />
```

### Table (`table.tsx`)

Semantic table component with dark styling.

**Components:**
- `Table` - Wrapper
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableFooter` - Footer section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Score</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>95</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs (`tabs.tsx`)

Tab switcher component.

**Props:**
- `defaultValue: string` - Initial active tab
- `value?: string` - Controlled value
- `onValueChange?: (value: string) => void` - Change handler

**Components:**
- `Tabs` - Container
- `TabsList` - Tab button list
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content panel

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="details">Details content</TabsContent>
</Tabs>
```

### Dropdown Menu (`dropdown-menu.tsx`)

Dropdown menu component with trigger and items.

**Components:**
- `DropdownMenu` - Container
- `DropdownMenuTrigger` - Opens menu
- `DropdownMenuContent` - Menu content
- `DropdownMenuItem` - Menu item
- `DropdownMenuSeparator` - Divider
- `DropdownMenuLabel` - Section label

**Props:**
- `open?: boolean` - Controlled state
- `onOpenChange?: (open: boolean) => void`
- `danger?: boolean` - Red styling for destructive items

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";

<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem danger>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Utilities

### cn() (`lib/utils.ts`)

Class name merging utility using clsx + tailwind-merge for conflict resolution.

```tsx
import { cn } from "@/lib/utils";

const className = cn(
  "px-4 py-2",
  isActive && "bg-teal-600",
  "text-white"
);
```

## Installation

All components are pre-installed in the SAGP project. Dependencies:

```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.577.0",
  "tailwind-merge": "^2.x.x"
}
```

## Usage

Import components from the main index:

```tsx
import {
  Button,
  Card,
  Input,
  Badge,
  useToast,
  ToastProvider,
} from "@/components/ui";
```

## Accessibility

All components follow WCAG guidelines:

- Semantic HTML elements
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Color contrast compliant
- Reduced motion support via Tailwind

## Customization

Components use Tailwind CSS with `cn()` utility for merging classes:

```tsx
<Button className="custom-class">Custom Button</Button>
```

All components expose `forwardRef` for direct DOM access when needed.

## Dark Theme Palette

- **Background**: `slate-800`, `slate-900`
- **Borders**: `slate-700`, `slate-600`
- **Text**: `slate-100`, `slate-300`, `slate-400`
- **Primary**: `teal-600`, `teal-700`
- **Risk**: `red-600`, `orange-600`, `yellow-600`, `green-600`

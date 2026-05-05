# SAGP UI Component Library - Quick Reference

## Imports

```tsx
// All components from one import
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Select,
  Dialog,
  DialogTrigger,
  DialogContent,
  ToastProvider,
  useToast,
  Skeleton,
  ProgressBar,
  Avatar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";

// Utility
import { cn } from "@/lib/utils";
```

## Component Cheat Sheet

### Button
```tsx
<Button>Default</Button>
<Button variant="primary" size="lg">Primary Large</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
```

### Input
```tsx
<Input placeholder="Text" />
<Input label="Email" type="email" />
<Input label="Password" error="Must be 8+ chars" />
<Input helperText="Help text" />
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Badge
```tsx
<Badge variant="low">Low</Badge>
<Badge variant="medium">Medium</Badge>
<Badge variant="high">High</Badge>
<Badge variant="critical">Critical</Badge>
<Badge variant="success">Success</Badge>
```

### Select
```tsx
<Select>
  <option>Option 1</option>
</Select>

<Select label="Choose" options={[
  { value: "1", label: "One" },
  { value: "2", label: "Two" }
]} />
```

### Dialog
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    Content here
  </DialogContent>
</Dialog>
```

### Toast
```tsx
// In root layout
<ToastProvider>
  {children}
</ToastProvider>

// In component
const { addToast } = useToast();

addToast({
  type: "success",
  message: "Done!",
  duration: 3000
});

// Types: "success", "error", "warning", "info"
```

### Skeleton
```tsx
<Skeleton className="h-12 w-full" />
```

### Progress Bar
```tsx
<ProgressBar value={50} max={100} />
<ProgressBar value={3} max={5} label="Progress" showValue />
```

### Avatar
```tsx
<Avatar name="John Doe" />
<Avatar name="JD" size="lg" />
<Avatar src="/image.jpg" />
```

### Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Dropdown Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem danger>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Common Patterns

### Form with Validation
```tsx
const [email, setEmail] = useState("");
const [error, setError] = useState("");
const { addToast } = useToast();

const handleSubmit = () => {
  if (!email.includes("@")) {
    setError("Invalid email");
    return;
  }
  addToast({ type: "success", message: "Submitted!" });
};

<Card>
  <CardContent className="space-y-4">
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={error}
    />
    <Button onClick={handleSubmit}>Submit</Button>
  </CardContent>
</Card>
```

### Modal Dialog
```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Confirm</DialogTitle>
    <p>Are you sure?</p>
    <DialogFooter>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data Display
```tsx
<Card>
  <CardHeader>
    <CardTitle>Users</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

## Styling Tips

### Custom Classes
```tsx
<Button className="custom-class">Button</Button>
<Card className="w-full max-w-md">Content</Card>
```

### Spacing
```tsx
<div className="space-y-4">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</div>
```

### Responsive
```tsx
<Card className="w-full md:w-1/2 lg:w-1/3">
  Responsive card
</Card>
```

## Color Variants

### Buttons
- `primary`: Teal
- `secondary`: Slate
- `destructive`: Red
- `ghost`: Transparent
- `outline`: Bordered

### Badges
- `low`: Green
- `medium`: Yellow
- `high`: Orange
- `critical`: Red
- `success`: Green
- `warning`: Yellow
- `info`: Blue

### Sizes
Buttons: `sm`, `md`, `lg`
Avatars: `sm`, `md`, `lg`, `xl`

## File Locations

- Components: `/src/components/ui/`
- Utils: `/src/lib/utils.ts`
- Documentation: `/src/components/ui/README.md`
- Examples: `/src/components/ui/EXAMPLES.md`

## Key Features

- Dark theme (no white backgrounds)
- Teal primary accent (#0D9488)
- Risk tier colors (low/medium/high/critical)
- Full TypeScript support
- Accessible (WCAG compliant)
- Responsive design
- Loading states
- Error handling
- Icon support (lucide-react)

## Accessibility

All components include:
- ARIA attributes
- Keyboard navigation
- Focus management
- Semantic HTML
- Color contrast compliance
- Reduced motion support

## Performance

- Client components marked with "use client"
- Optimized re-renders
- Context-based state management
- No unnecessary bundle overhead
- Tree-shakeable exports

# UI Component Examples

Complete usage examples for all SAGP UI components.

## Button Examples

```tsx
import { Button } from "@/components/ui";

// Primary button (default)
<Button>Submit</Button>

// Different variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Close</Button>
<Button variant="outline">Learn More</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button loading>Processing...</Button>

// Disabled state
<Button disabled>Disabled</Button>

// Combined
<Button variant="destructive" size="lg" disabled>Delete Forever</Button>
```

## Input Examples

```tsx
import { Input } from "@/components/ui";

// Basic input
<Input />

// With label
<Input
  label="Email Address"
  type="email"
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With helper text
<Input
  label="Security Question"
  helperText="This will be used to verify your account"
/>

// Disabled
<Input disabled value="Read-only content" />
```

## Card Examples

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui";

// Simple card
<Card>
  <CardHeader>
    <CardTitle>Training Module</CardTitle>
    <CardDescription>Learn about phishing detection</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here...</p>
  </CardContent>
</Card>

// Card with footer
<Card>
  <CardHeader>
    <CardTitle>Module Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <p>You have completed 3 of 5 sections</p>
  </CardContent>
  <CardFooter>
    <Button>Continue</Button>
  </CardFooter>
</Card>
```

## Badge Examples

```tsx
import { Badge } from "@/components/ui";

// Risk tiers
<Badge variant="low">Low Risk</Badge>
<Badge variant="medium">Medium Risk</Badge>
<Badge variant="high">High Risk</Badge>
<Badge variant="critical">Critical Risk</Badge>

// General purpose
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
```

## Select Examples

```tsx
import { Select } from "@/components/ui";

// Basic select
<Select>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>

// With label and options array
<Select
  label="Risk Level"
  options={[
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical", disabled: true },
  ]}
/>

// With error
<Select
  label="Department"
  error="Please select a department"
  options={[{ value: "it", label: "IT" }]}
/>
```

## Dialog Examples

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";

// Basic dialog
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>Are you sure you want to continue?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="secondary">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled dialog
const [open, setOpen] = useState(false);
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Delete Module?</DialogTitle>
    <p>This action cannot be undone.</p>
    <DialogFooter>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Toast Examples

```tsx
import { ToastProvider, useToast } from "@/components/ui";

// Setup in root layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

// Usage in component
function MyComponent() {
  const { addToast } = useToast();

  return (
    <>
      <Button onClick={() => addToast({
        type: "success",
        message: "Operation completed successfully!"
      })}>
        Success
      </Button>

      <Button onClick={() => addToast({
        type: "error",
        message: "Something went wrong!"
      })}>
        Error
      </Button>

      <Button onClick={() => addToast({
        type: "warning",
        message: "Warning: This action requires confirmation"
      })}>
        Warning
      </Button>

      <Button onClick={() => addToast({
        type: "info",
        message: "FYI: This is an informational message",
        duration: 5000  // 5 seconds
      })}>
        Info
      </Button>

      <Button onClick={() => addToast({
        type: "success",
        message: "Persistent notification",
        duration: 0  // Manual dismiss only
      })}>
        Persistent
      </Button>
    </>
  );
}
```

## Skeleton Examples

```tsx
import { Skeleton } from "@/components/ui";

// Loading skeleton for card
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2 mt-2" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>

// Loading avatar
<Avatar>
  <Skeleton className="h-12 w-12 rounded-full" />
</Avatar>
```

## Progress Bar Examples

```tsx
import { ProgressBar } from "@/components/ui";

// Simple progress
<ProgressBar value={65} max={100} />

// With label
<ProgressBar value={3} max={5} label="Module Progress" />

// With percentage display
<ProgressBar value={75} showValue label="Download Progress" />

// Without animation
<ProgressBar value={50} animated={false} />

// Completion indicator
<ProgressBar value={100} label="Quiz Complete" showValue />
```

## Avatar Examples

```tsx
import { Avatar } from "@/components/ui";

// With name (initials fallback)
<Avatar name="John Doe" />
<Avatar name="Jane Smith" size="lg" />

// With image
<Avatar src="/avatars/user.jpg" alt="User Avatar" />

// Different sizes
<Avatar name="User" size="sm" />
<Avatar name="User" size="md" />
<Avatar name="User" size="lg" />
<Avatar name="User" size="xl" />

// Custom content
<Avatar>JD</Avatar>
```

## Table Examples

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Score</TableHead>
      <TableHead>Risk Level</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>95</TableCell>
      <TableCell>
        <Badge variant="low">Low</Badge>
      </TableCell>
    </TableRow>
    <TableRow>
      <TableCell>Jane Smith</TableCell>
      <TableCell>78</TableCell>
      <TableCell>
        <Badge variant="medium">Medium</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Tabs Examples

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

// Basic tabs
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <p>Overview content goes here</p>
  </TabsContent>
  <TabsContent value="details">
    <p>Details content goes here</p>
  </TabsContent>
  <TabsContent value="analytics">
    <p>Analytics content goes here</p>
  </TabsContent>
</Tabs>

// Controlled tabs
const [activeTab, setActiveTab] = useState("overview");
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
</Tabs>
```

## Dropdown Menu Examples

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui";

<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => console.log("Edit")}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => console.log("View")}>
      View Details
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Danger Zone</DropdownMenuLabel>
    <DropdownMenuItem danger onClick={() => console.log("Delete")}>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With icons
import { Edit, Trash2 } from "lucide-react";

<DropdownMenu>
  <DropdownMenuTrigger>Options</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem danger>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Complex Layout Example

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  ProgressBar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
} from "@/components/ui";

export function UserTrainingModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Training Progress</CardTitle>
        <CardDescription>Q1 2024 Phishing Awareness Program</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar
          value={7}
          max={10}
          label="Modules Completed"
          showValue
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Phishing Basics</TableCell>
              <TableCell>
                <Badge variant="success">Completed</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="low">Low</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Advanced Tactics</TableCell>
              <TableCell>
                <Badge variant="default">In Progress</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="medium">Medium</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Avatar name="John Doe" size="sm" />
        <Button>Continue Learning</Button>
      </CardFooter>
    </Card>
  );
}
```

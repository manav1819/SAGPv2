"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
}

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function DropdownMenuTrigger({ children, className, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu();

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-slate-700 text-slate-100 hover:bg-slate-600 active:bg-slate-800",
        className
      )}
      aria-haspopup="menu"
      aria-expanded={open}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function DropdownMenuContent({ className, children, ...props }: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenu();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute top-full right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-800 shadow-lg z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        className
      )}
      role="menu"
      {...props}
    >
      {children}
    </div>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

function DropdownMenuItem({
  className,
  onClick,
  danger = false,
  children,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setOpen(false);
  };

  return (
    <button
      role="menuitem"
      onClick={handleClick}
      className={cn(
        "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-slate-700 active:bg-slate-600 flex items-center gap-2",
        danger ? "text-red-400 hover:bg-red-900/20" : "text-slate-300 hover:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-slate-700", className)} {...props} />;
}

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <div className={cn("px-4 py-2 text-xs font-semibold text-slate-400", className)} {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};

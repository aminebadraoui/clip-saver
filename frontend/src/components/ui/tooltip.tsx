import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

// Context to share state between Trigger and Content
const TooltipContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (v: boolean) => void
    triggerRect: DOMRect | null
    setTriggerRect: (r: DOMRect | null) => void
} | null>(null)

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)

    return (
        <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRect, setTriggerRect }}>
            <div
                className="relative flex items-center"
                onMouseEnter={(e) => {
                    setIsOpen(true)
                    setTriggerRect(e.currentTarget.getBoundingClientRect())
                }}
                onMouseLeave={() => setIsOpen(false)}
            >
                {children}
            </div>
        </TooltipContext.Provider>
    )
}

const TooltipTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={cn("cursor-help", className)}>
            {children}
        </div>
    )
}

const TooltipContent = ({ children, className, sideOffset = 4 }: { children: React.ReactNode, className?: string, sideOffset?: number }) => {
    const context = React.useContext(TooltipContext)
    if (!context?.isOpen || !context.triggerRect) return null

    // Calculate position based on trigger rect
    // Defaulting to "top" position logic for simplicity as per previous implementation
    // adjusting for document scroll
    const top = context.triggerRect.top + window.scrollY - sideOffset - 5; // -5 arbitrary nav adjustment
    const left = context.triggerRect.left + window.scrollX + (context.triggerRect.width / 2);

    return createPortal(
        <div
            className={cn(
                "absolute z-[9999] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                "w-max max-w-[200px] text-center pointer-events-none",
                className
            )}
            style={{
                top: `${top}px`,
                left: `${left}px`,
                transform: "translate(-50%, -100%)" // Anchored bottom-center to the calculated top point
            }}
        >
            {children}
        </div>,
        document.body
    )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

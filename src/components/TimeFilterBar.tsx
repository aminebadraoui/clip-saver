import type { TimeFilter } from "@/types/youtube";
import { Button } from "@/components/ui/button";

interface TimeFilterBarProps {
    selectedFilter: TimeFilter;
    onFilterChange: (filter: TimeFilter) => void;
}

const FILTERS: { value: TimeFilter; label: string }[] = [
    { value: "hour", label: "Last Hour" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
];

export function TimeFilterBar({ selectedFilter, onFilterChange }: TimeFilterBarProps) {
    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {FILTERS.map((filter) => (
                <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "outline"}
                    onClick={() => onFilterChange(filter.value)}
                    className="transition-all duration-200"
                >
                    {filter.label}
                </Button>
            ))}
        </div>
    );
}

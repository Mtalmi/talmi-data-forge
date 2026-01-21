import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Generate time slots in 5-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Format time input with auto-colon
const formatTimeInput = (value: string): string => {
  const cleaned = value.replace(/[^\d:]/g, '');
  if (cleaned.length >= 2 && !cleaned.includes(':')) {
    return cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
  }
  return cleaned.slice(0, 5);
};

// Validate time (5-min intervals)
const validateTime = (value: string): boolean => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 55 && minutes % 5 === 0;
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({ value, onChange, placeholder = "HH:MM", className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Sync input value with prop
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Scroll to selected time when opening
  React.useEffect(() => {
    if (open && value && scrollRef.current) {
      const index = TIME_SLOTS.indexOf(value);
      if (index !== -1) {
        setTimeout(() => {
          const element = scrollRef.current?.querySelector(`[data-time="${value}"]`);
          element?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }, 50);
      }
    }
  }, [open, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setInputValue(formatted);
    if (validateTime(formatted)) {
      onChange(formatted);
    }
  };

  const handleInputBlur = () => {
    if (validateTime(inputValue)) {
      onChange(inputValue);
    } else if (value) {
      setInputValue(value);
    }
  };

  const handleSelectTime = (time: string) => {
    onChange(time);
    setInputValue(time);
    setOpen(false);
  };

  const isValid = !inputValue || validateTime(inputValue);

  // Filter times based on input
  const filteredTimes = inputValue 
    ? TIME_SLOTS.filter(t => t.startsWith(inputValue.split(':')[0] || ''))
    : TIME_SLOTS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            !isValid && "border-destructive",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{value || placeholder}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Saisir l'heure..."
            className={cn(
              "h-9",
              !isValid && "border-destructive focus-visible:ring-destructive"
            )}
            maxLength={5}
            autoFocus
          />
          {!isValid && inputValue && (
            <p className="text-xs text-destructive mt-1">
              Intervalles de 5 min
            </p>
          )}
        </div>
        <ScrollArea className="h-[200px]" ref={scrollRef}>
          <div className="p-1">
            {filteredTimes.map((time) => (
              <button
                key={time}
                data-time={time}
                onClick={() => handleSelectTime(time)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  value === time && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

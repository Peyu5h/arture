"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isValid, isBefore, isAfter } from "date-fns";
import { Calendar, Clock, Check, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import type { DatePickerProps } from "./types";

// simple calendar grid
function CalendarGrid({
  selectedDate,
  currentMonth,
  onSelectDate,
  minDate,
  maxDate,
}: {
  selectedDate: Date | null;
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // pad start
    for (let i = 0; i < startDay; i++) {
      week.push(null);
    }

    // days
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // pad end
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    return weeks;
  }, [currentMonth]);

  const isDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 gap-1">
          {week.map((date, dayIdx) => (
            <div key={dayIdx} className="aspect-square">
              {date ? (
                <button
                  type="button"
                  disabled={isDisabled(date)}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    "w-full h-full rounded-md text-sm flex items-center justify-center transition-colors",
                    isSelected(date)
                      ? "bg-primary text-primary-foreground"
                      : isToday(date)
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                    isDisabled(date) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {date.getDate()}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AgentDatePicker({
  id,
  title,
  description,
  required,
  defaultValue,
  minDate: minDateStr,
  maxDate: maxDateStr,
  showTime,
  placeholder,
  onSubmit,
  onCancel,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (defaultValue) {
      const parsed = parseISO(defaultValue);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return selectedDate || new Date();
  });

  const [time, setTime] = useState<string>(() => {
    if (selectedDate) {
      return format(selectedDate, "HH:mm");
    }
    return "12:00";
  });

  const [isOpen, setIsOpen] = useState(false);

  const minDate = minDateStr ? parseISO(minDateStr) : undefined;
  const maxDate = maxDateStr ? parseISO(maxDateStr) : undefined;

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleSelectDate = (date: Date) => {
    if (showTime) {
      const [hours, minutes] = time.split(":").map(Number);
      date.setHours(hours, minutes);
    }
    setSelectedDate(date);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes);
      setSelectedDate(newDate);
    }
  };

  const handleSubmit = () => {
    if (selectedDate) {
      const formattedDate = showTime
        ? selectedDate.toISOString()
        : format(selectedDate, "yyyy-MM-dd");
      onSubmit(formattedDate);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const displayValue = selectedDate
    ? showTime
      ? format(selectedDate, "PPP 'at' p")
      : format(selectedDate, "PPP")
    : placeholder || "Select a date";

  return (
    <div className="w-full space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* month navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrevMonth}
              >
                <span className="sr-only">Previous month</span>
                ←
              </Button>
              <div className="text-sm font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNextMonth}
              >
                <span className="sr-only">Next month</span>
                →
              </Button>
            </div>

            {/* calendar grid */}
            <CalendarGrid
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              onSelectDate={handleSelectDate}
              minDate={minDate}
              maxDate={maxDate}
            />

            {/* time picker */}
            {showTime && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={required && !selectedDate}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Confirm
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default AgentDatePicker;

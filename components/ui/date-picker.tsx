// components/ui/date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  minDate?: Date;
}

export function DatePicker({
  date,
  setDate,
  label = "Sélectionner une date",
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setOpen(false);
  };

  const TriggerButton = (
    <Button
      type="button"
      variant={"outline"}
      className={cn(
        "w-full justify-start text-left font-normal",
        !date && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP", { locale: fr }) : <span>{label}</span>}
    </Button>
  );

  const calendarProps = {
    mode: "single" as const,
    selected: date,
    onSelect: handleSelect,
    locale: fr,
    disabled: minDate ? { before: minDate } : undefined,
  };

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>{TriggerButton}</div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar {...calendarProps} initialFocus />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div>{TriggerButton}</div>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t pt-4 pb-8 flex justify-center">
          <Calendar {...calendarProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

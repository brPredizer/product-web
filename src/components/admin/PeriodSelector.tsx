import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

type Preset = { label: string; days?: number; value?: string };

const presets: Preset[] = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'YTD', value: 'ytd' }
];

type Period = { start: Date; end: Date; label?: string };

type Props = {
  period?: Period | null;
  onPeriodChange: (p: Period) => void;
};

export default function PeriodSelector({ period, onPeriodChange }: Props) {
  const [customOpen, setCustomOpen] = React.useState<boolean>(false);

  const handlePreset = (preset: Preset) => {
    const end = new Date();
    const start = preset.value === 'ytd'
      ? startOfYear(new Date())
      : subDays(end, preset.days ?? 0);

    onPeriodChange({ start, end, label: preset.label });
  };

  return (
    <div className="flex items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant={period?.label === preset.label ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset(preset)}
          className={cn(
            period?.label === preset.label && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Personalizado
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            // Calendar typings vary across projects; pass values conservatively
            selected={{ from: period?.start, to: period?.end } as any}
            onSelect={(range: any) => {
              if (range?.from && range?.to) {
                onPeriodChange({
                  start: range.from,
                  end: range.to,
                  label: 'Personalizado'
                });
                setCustomOpen(false);
              }
            }}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

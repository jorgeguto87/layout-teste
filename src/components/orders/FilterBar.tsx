import { cn } from "@/lib/utils";
import { CHANNEL_FILTER_LABEL, STATUS_FILTER_LABEL } from "@/lib/orders/format";
import type { ChannelFilter, StatusFilter } from "@/lib/orders/types";

function Segmented<T extends string>({
  value,
  options,
  labels,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-0.5 rounded-lg bg-surface ring-1 ring-hairline p-1 overflow-x-auto scroll-thin"
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-8 px-3 rounded-md text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-foreground text-ink font-semibold"
                : "text-secondary-foreground font-medium hover:text-foreground hover:bg-surface-hover",
            )}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

const CHANNELS: ChannelFilter[] = ["todos", "delivery", "mesa", "balcao"];
const CHANNEL_SHORT: Record<ChannelFilter, string> = { ...CHANNEL_FILTER_LABEL, todos: "Todos" };

export function ChannelFilterBar({
  value,
  onChange,
}: {
  value: ChannelFilter;
  onChange: (v: ChannelFilter) => void;
}) {
  return (
    <Segmented value={value} options={CHANNELS} labels={CHANNEL_SHORT} onChange={onChange} ariaLabel="Canal" />
  );
}

export function StatusFilterBar({
  value,
  onChange,
  options,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  options: StatusFilter[];
}) {
  return (
    <Segmented value={value} options={options} labels={STATUS_FILTER_LABEL} onChange={onChange} ariaLabel="Status" />
  );
}

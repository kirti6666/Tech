"use client";

import { useEffect, useState } from "react";
import { Check, Tag, TicketPercent } from "lucide-react";
import { useCurrency } from "@/lib/useCurrency";

interface AvailableCoupon {
  _id: string;
  code: string;
  discountType: "percent" | "flat";
  value: number;
  minOrderValue: number;
  expiresAt: string;
}

export function AvailableCoupons({ subtotal, appliedCode, onApply, busy }: {
  subtotal?: number;
  appliedCode?: string | null;
  onApply?: (code: string) => void;
  busy?: boolean;
}) {
  const { symbol: currency } = useCurrency();
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/coupons/available")
      .then((response) => response.json())
      .then((data) => { if (active) setCoupons(data.coupons ?? []); })
      .catch(() => {})
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  if (!loaded || coupons.length === 0) return null;
  const describe = (coupon: AvailableCoupon) => coupon.discountType === "percent" ? `${coupon.value}% off` : `${currency}${coupon.value} off`;

  return (
    <div className="mt-3 border-t border-rule-soft pt-3 sm:mt-4 sm:pt-4">
      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-ink"><Tag size={14} className="text-accent-deep" /> Available offers — tap to apply</p>
      <div className="space-y-2">
        {coupons.map((coupon) => {
          const eligible = subtotal === undefined || subtotal >= coupon.minOrderValue;
          const applied = appliedCode === coupon.code;
          const shortfall = coupon.minOrderValue - (subtotal ?? 0);
          return (
            <button key={coupon._id} type="button" disabled={!eligible || busy || applied} onClick={() => onApply?.(coupon.code)} className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition sm:gap-3 sm:p-3 sm:text-sm ${applied ? "border-save/30 bg-save/5 ring-1 ring-save/10" : eligible ? "border-dashed border-accent/40 bg-accent-mist/40 hover:border-accent hover:bg-accent-mist" : "cursor-not-allowed border-rule bg-paper-alt opacity-55"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 ${applied ? "bg-save/10 text-save" : "bg-white text-accent-deep"}`}><TicketPercent size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="font-mono font-bold text-ink">{coupon.code}</span><span className="text-ink-soft"> · {describe(coupon)}</span>
                {coupon.minOrderValue > 0 && <span className="mt-0.5 block text-xs text-ink-faint">{eligible ? `On orders over ${currency}${coupon.minOrderValue}` : `Add ${currency}${shortfall} more to use`}</span>}
              </span>
              {applied ? <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-save"><Check size={14} /> Applied</span> : <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-accent-deep shadow-sm">Apply</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { MonthOption } from "@/components/CustomMonthDropdown";

/**
 * Generate dynamic month options list with past and future ranges.
 * e.g., pastMonths = 6, futureMonths = 3, includeAllTime = true
 */
export function generateMonthOptions(
  pastMonths: number = 6,
  futureMonths: number = 3,
  includeAllTime: boolean = true
): MonthOption[] {
  const options: MonthOption[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();
  const currentMonthStr = `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}`;

  if (includeAllTime) {
    options.push({
      value: "All",
      label: "All Time (Cumulative)",
      sublabel: "Complete Historical Summary",
      badge: "all"
    });
  }

  // Generate future months (from futureMonths down to 1)
  for (let i = futureMonths; i >= 1; i--) {
    const d = new Date(currentYear, currentMonthNum + i, 15);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    
    options.push({
      value: mStr,
      label,
      sublabel: i === 1 ? "Next Month" : `${i} Months Ahead`,
      badge: "future"
    });
  }

  // Current month
  const currentD = new Date(currentYear, currentMonthNum, 15);
  const currentLabel = currentD.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  options.push({
    value: currentMonthStr,
    label: currentLabel,
    sublabel: "Active Billing Period",
    badge: "current"
  });

  // Generate past months (from 1 up to pastMonths)
  for (let i = 1; i <= pastMonths; i++) {
    const d = new Date(currentYear, currentMonthNum - i, 15);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    options.push({
      value: mStr,
      label,
      sublabel: i === 1 ? "Previous Month" : `${i} Months Ago`,
      badge: "past"
    });
  }

  return options;
}

/**
 * Format YYYY-MM to readable label e.g., "July 2026"
 */
export function formatMonthLabel(monthStr: string): string {
  if (!monthStr || monthStr === "All") return "All Time";
  try {
    const [yr, mo] = monthStr.split("-").map(Number);
    const d = new Date(yr, mo - 1, 15);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return monthStr;
  }
}

export interface ParsedTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income_online" | "income_cash" | "expense";
  notes: string;
}

export function parseNaturalLanguageTransactions(text: string): ParsedTransaction[] {
  if (!text || !text.trim()) return [];

  // Split by newline or semicolon or comma-delimited lines that don't split single amounts
  const lines = text.split(/[\n;]+/).map(line => line.trim()).filter(Boolean);
  const parsedItems: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Regex to match a currency/number: optionally preceded by $, ₹, or Rs.
    // e.g. "electricity bill 1000", "Rent $1500", "₹500 for coffee"
    const numberRegex = /(?:[₹$€]|Rs\.?\s*)?(\d+(?:\.\d{1,2})?)/g;
    
    let match;
    const numbers: { value: number; index: number; text: string }[] = [];
    
    while ((match = numberRegex.exec(line)) !== null) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        numbers.push({
          value: val,
          index: match.index,
          text: match[0]
        });
      }
    }

    if (numbers.length === 0) {
      continue; // Skip lines with no amount detected
    }

    // Usually, the amount is the number in the line. If there are multiple, let's take the first one or combine.
    // We'll take the primary number (usually the largest or last one, let's assume the last one is the value)
    const primaryNum = numbers[numbers.length - 1];
    const amount = primaryNum.value;

    // The text title is whatever is left after stripping out the number and currency symbol
    let title = line.replace(primaryNum.text, "").trim();
    
    // Clean up title: remove trailing/leading dashes, spaces, "for", "of", "to"
    title = title
      .replace(/^[\s\-_,:=]+|[\s\-_,:=]+$/g, "")
      .replace(/^(for|to|of|on|at|buy|pay)\s+/i, "");

    if (!title) {
      title = `Transaction #${i + 1}`;
    }

    // Determine type (Income vs Expense)
    let type: "income_online" | "income_cash" | "expense" = "expense";
    const lowerTitle = title.toLowerCase();
    
    const isIncome = 
      lowerTitle.includes("sale") || 
      lowerTitle.includes("sold") || 
      lowerTitle.includes("income") || 
      lowerTitle.includes("revenue") || 
      lowerTitle.includes("received") || 
      lowerTitle.includes("consulting") || 
      lowerTitle.includes("earned");

    if (isIncome) {
      // Determine if online or cash income
      const isOnline = 
        lowerTitle.includes("gpay") || 
        lowerTitle.includes("online") || 
        lowerTitle.includes("stripe") || 
        lowerTitle.includes("bank") || 
        lowerTitle.includes("transfer") || 
        lowerTitle.includes("card") || 
        lowerTitle.includes("upi");
      
      type = isOnline ? "income_online" : "income_cash";
    }

    // Smart Category parsing
    let category = "Miscellaneous";
    if (type === "expense") {
      if (lowerTitle.includes("electricity") || lowerTitle.includes("water") || lowerTitle.includes("utility") || lowerTitle.includes("power") || lowerTitle.includes("gas") || lowerTitle.includes("internet") || lowerTitle.includes("wifi")) {
        category = "Utilities";
      } else if (lowerTitle.includes("rent") || lowerTitle.includes("office") || lowerTitle.includes("lease")) {
        category = "Rent";
      } else if (lowerTitle.includes("stock") || lowerTitle.includes("purchase") || lowerTitle.includes("inventory") || lowerTitle.includes("supplies") || lowerTitle.includes("goods")) {
        category = "Inventory";
      } else if (lowerTitle.includes("salary") || lowerTitle.includes("wage") || lowerTitle.includes("payroll") || lowerTitle.includes("employee")) {
        category = "Salary";
      } else if (lowerTitle.includes("coffee") || lowerTitle.includes("lunch") || lowerTitle.includes("dinner") || lowerTitle.includes("meal") || lowerTitle.includes("food") || lowerTitle.includes("restaurant") || lowerTitle.includes("cafe")) {
        category = "Meals & Entertainment";
      } else if (lowerTitle.includes("travel") || lowerTitle.includes("uber") || lowerTitle.includes("taxi") || lowerTitle.includes("flight") || lowerTitle.includes("fuel") || lowerTitle.includes("cab")) {
        category = "Travel";
      } else if (lowerTitle.includes("ad") || lowerTitle.includes("marketing") || lowerTitle.includes("facebook") || lowerTitle.includes("google ad") || lowerTitle.includes("promo")) {
        category = "Marketing";
      } else if (lowerTitle.includes("software") || lowerTitle.includes("subscription") || lowerTitle.includes("aws") || lowerTitle.includes("saas") || lowerTitle.includes("hosting")) {
        category = "Software & Subscriptions";
      }
    } else {
      category = "Business Revenue";
    }

    // Capitalize first letter of title
    title = title.charAt(0).toUpperCase() + title.slice(1);

    parsedItems.push({
      id: Math.random().toString(36).substring(2, 9),
      title,
      category,
      amount,
      type,
      notes: `Parsed automatically from Quick Mode line: "${line}"`
    });
  }

  return parsedItems;
}

export const stats = [
  { label: "Total income", value: "$15,000", trend: "+5.1% from last month", positive: true },
  { label: "Total expences", value: "$6,700", trend: "+13.5% from last month", positive: false },
  { label: "Saved balance", value: "$8,300", trend: "+20.7% from last month", positive: true },
]

export const goals = [
  {
    label: "Reserve",
    current: 7000,
    target: 10000,
    note: "Left to save 4 months",
    color: "oklch(0.648 0.2 131.684)",
  },
  {
    label: "Travel",
    current: 2500,
    target: 4000,
    note: "Left to save 3 months",
    color: "oklch(0.879 0.169 91.605)",
  },
  {
    label: "Car",
    current: 1600,
    target: 30000,
    note: "Left to save 3 years 6 months",
    color: "oklch(0.769 0.188 70.08)",
  },
  {
    label: "Real estate",
    current: 8300,
    target: 10000,
    note: "Left to save 5 years 8 months",
    color: "oklch(0.769 0.188 70.08)",
  },
]

export const spendingCategories = [
  { label: "Housing", percent: 18, color: "oklch(0.769 0.188 70.08)" },
  { label: "Debt payments", percent: 7, color: "oklch(0.879 0.169 91.605)" },
  { label: "Food", percent: 6, color: "oklch(0.648 0.2 131.684)" },
  { label: "Transportation", percent: 9, color: "oklch(0.666 0.179 58.318)" },
  { label: "Healthcare", percent: 10, color: "oklch(0.555 0.163 48.998)" },
  { label: "Investments", percent: 17, color: "oklch(0.841 0.238 128.85)" },
  { label: "Other", percent: 33, color: "oklch(0.922 0 0)" },
]

export const financialHealthChartConfig = {
  filled: { label: "Saved", color: "oklch(0.841 0.238 128.85)" },
  empty: { label: "Remaining", color: "oklch(0.922 0 0)" },
}

export const financialHealthPercentage = 75

export const financialHealthData = [
  { name: "filled", value: financialHealthPercentage },
  { name: "empty", value: 100 - financialHealthPercentage },
]

export const balanceChartData = [
  { day: "Sun", savings: 8, income: 12, expenses: 4 },
  { day: "Mon", savings: 10, income: 15, expenses: 5 },
  { day: "Tue", savings: 12, income: 18, expenses: 8 },
  { day: "Wed", savings: 24, income: 70, expenses: 46 },
  { day: "Thu", savings: 9, income: 14, expenses: 6 },
  { day: "Fri", savings: 7, income: 11, expenses: 5 },
  { day: "Sat", savings: 6, income: 10, expenses: 3 },
]

export const balanceChartConfig = {
  savings: { label: "Savings", color: "oklch(0.879 0.169 91.605)" },
  income: { label: "Income", color: "oklch(0.648 0.2 131.684)" },
  expenses: { label: "Expenses", color: "oklch(0.769 0.188 70.08)" },
}

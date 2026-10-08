export type AccessMode = "demo" | "subscriber" | "trial" | "admin" | "ambassador" | "blocked";
export type DemoUsage = { incomeUsed: boolean; expenseUsed: boolean; welcomed: boolean };

export function accessMode(flags: { active: boolean; trial: boolean; admin: boolean; ambassador: boolean; demo: boolean }): AccessMode {
  if (flags.admin) return "admin";
  if (flags.ambassador) return "ambassador";
  if (flags.active) return "subscriber";
  if (flags.trial) return "trial";
  return flags.demo ? "demo" : "blocked";
}

export function canDemoWrite(table: string, operation: "insert" | "update" | "delete", usage: DemoUsage) {
  if (operation !== "insert") return false;
  return table === "incomes" ? !usage.incomeUsed : table === "expenses" && !usage.expenseUsed;
}

export function demoResult(incomes: { amount: number }[], expenses: { amount: number }[]) {
  const income = incomes.reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  return { income, expense, profit: income - expense };
}
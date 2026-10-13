/** Ganhos e gastos só podem ter valor maior que zero (espelha o CHECK amount > 0 no banco). */
export function isPositiveAmount(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export const NON_POSITIVE_AMOUNT_MESSAGE = "Informe um valor maior que zero.";

/** Traduz recusas do banco ligadas à integridade financeira em mensagens para o usuário. */
export function financialWriteErrorMessage(message: string): string | null {
  if (message.includes("incomes_amount_positive") || message.includes("expenses_amount_positive")) return NON_POSITIVE_AMOUNT_MESSAGE;
  if (message.includes("work_session_owner_mismatch")) return "Essa jornada não pertence à sua conta.";
  return null;
}

import { z } from "zod";
import { MAINTENANCE_CATEGORIES } from "./constants";

const optionalNonnegativeNumber = z.number().finite().min(0).nullable();

const maintenanceInputSchema = z.object({
  category: z.enum(MAINTENANCE_CATEGORIES),
  cost: z.number().finite().positive(),
  description: z.string().trim().max(500).nullable(),
  km: optionalNonnegativeNumber,
  nextKm: optionalNonnegativeNumber,
  nextDate: z.string().trim().max(10).nullable(),
  workshop: z.string().trim().max(150).nullable(),
});

export type MaintenanceInput = z.infer<typeof maintenanceInputSchema>;

export function normalizeMaintenanceInput(input: unknown) {
  return maintenanceInputSchema.safeParse(input);
}
export type FuelMeasurements = {
  total: number | null;
  liters: number | null;
  pricePerLiter: number | null;
  km: number | null;
};

export type ValidFuelMeasurements = Omit<FuelMeasurements, "total"> & { total: number };

export function normalizeFuelMeasurements(values: FuelMeasurements): ValidFuelMeasurements | null {
  if (values.total == null || !Number.isFinite(values.total) || values.total <= 0) return null;

  const liters = values.liters != null && Number.isFinite(values.liters) && values.liters > 0 ? values.liters : null;
  const suppliedPrice = values.pricePerLiter != null && Number.isFinite(values.pricePerLiter) && values.pricePerLiter > 0
    ? values.pricePerLiter
    : null;
  const km = values.km != null && Number.isFinite(values.km) && values.km >= 0 ? values.km : null;

  return {
    total: values.total,
    liters,
    pricePerLiter: suppliedPrice ?? (liters == null ? null : values.total / liters),
    km,
  };
}
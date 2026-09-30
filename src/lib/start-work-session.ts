/** A leitura antes do INSERT melhora a experiência; o índice único continua sendo a proteção contra corridas. */
export async function startOrResumeSession<T>(
  getActive: () => Promise<T | null>,
  create: () => Promise<T>,
  isActiveConflict: (error: unknown) => boolean,
): Promise<{ session: T; existed: boolean }> {
  const existing = await getActive();
  if (existing) return { session: existing, existed: true };

  try {
    return { session: await create(), existed: false };
  } catch (error) {
    if (isActiveConflict(error)) {
      const concurrent = await getActive().catch(() => null);
      if (concurrent) return { session: concurrent, existed: true };
      throw new Error("Já existe uma jornada em andamento. Atualize a página para continuar.");
    }
    throw error;
  }
}
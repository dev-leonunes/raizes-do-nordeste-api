export type RespostaPaginada<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function criarRespostaPaginada<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): RespostaPaginada<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

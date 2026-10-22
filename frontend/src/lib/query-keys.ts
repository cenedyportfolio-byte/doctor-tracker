export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (params: object) => [...doctorKeys.lists(), params] as const,
  details: () => [...doctorKeys.all, "detail"] as const,
  detail: (id: string) => [...doctorKeys.details(), id] as const,
  facets: () => [...doctorKeys.all, "facets"] as const,
  options: (search: string) => [...doctorKeys.all, "options", search] as const,
};

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: object) => [...patientKeys.lists(), params] as const,
};

export const statsKeys = {
  all: ["stats"] as const,
  overview: (range: string) => [...statsKeys.all, "overview", range] as const,
};

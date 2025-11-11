const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export const withApiBase = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};



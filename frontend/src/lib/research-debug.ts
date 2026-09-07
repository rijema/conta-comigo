export type ResearchDebugRole = 'child' | 'guardian' | 'professional' | 'admin' | string;

export interface ResearchDebugAccessInput {
  environmentFlag?: string;
  queryValue?: string | null;
  role?: ResearchDebugRole | null;
}

export function isResearchDebugEnabled({
  environmentFlag,
  queryValue,
  role,
}: ResearchDebugAccessInput): boolean {
  const authorizedRole = role === 'professional' || role === 'admin';
  return environmentFlag === 'true' && queryValue === 'true' && authorizedRole;
}

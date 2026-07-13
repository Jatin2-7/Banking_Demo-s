import { useCompany } from '../../context/CompanyContext.jsx';

/** Agent IDs for the active company demo. */
export function useCompanyAgents() {
  const company = useCompany();
  return company.agents;
}

/**
 * Resolve an agent ID for the active company.
 * @param {'home'|'loan'|'imps'|'deposit'|'txnHistory'|'loanLos'} flow
 */
export function useCompanyAgent(flow) {
  const agents = useCompanyAgents();
  return agents[flow];
}

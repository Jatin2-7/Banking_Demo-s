import { streamLoanAguiRun } from './loanAguiRunner.js';
import { streamImpsAguiRun } from './impsAguiRunner.js';
import { streamHomeAguiRun } from './homeAguiRunner.js';
import { streamDepositAguiRun } from './depositAguiRunner.js';
import { streamTxnHistoryAguiRun } from './txnHistoryAguiRunner.js';
import { streamSSQuickLoanRun } from './ssQuickLoanRunner.js';
import { streamAbcdPersonalLoanRun } from './abcdPersonalLoanRunner.js';
import { LOAN_AGENT_ID } from './loanAgentConfig.js';
import { ABCD_PERSONAL_LOAN_AGENT_ID } from './abcdPersonalLoanConfig.js';
import { IMPS_AGENT_ID } from './impsAguiConfig.js';
import { HOME_AGENT_ID } from './homeAguiConfig.js';
import { DEPOSIT_AGENT_ID } from './depositAguiConfig.js';
import { TXN_HISTORY_AGENT_ID } from './txnHistoryAguiConfig.js';
import { SS_QUICKLOAN_AGENT_ID } from './ssQuickLoanConfig.js';

const RUNNERS = {
  [LOAN_AGENT_ID]: streamLoanAguiRun,
  [IMPS_AGENT_ID]: streamImpsAguiRun,
  [HOME_AGENT_ID]: streamHomeAguiRun,
  [DEPOSIT_AGENT_ID]: streamDepositAguiRun,
  [TXN_HISTORY_AGENT_ID]: streamTxnHistoryAguiRun,
  [SS_QUICKLOAN_AGENT_ID]: streamSSQuickLoanRun,
  [ABCD_PERSONAL_LOAN_AGENT_ID]: streamAbcdPersonalLoanRun,
};

export function handleLoanAguiPost(req, res) {
  const agentId = req.params.agentId;
  const runner = RUNNERS[agentId];
  if (!runner) {
    return res.status(404).json({ error: 'unknown_agent', agentId, supported: Object.keys(RUNNERS) });
  }

  const body = req.body || {};
  if (!Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'messages_required' });
  }

  const ac = new AbortController();
  const onClose = () => {
    if (!res.writableEnded) ac.abort();
  };
  res.on('close', onClose);

  runner(res, agentId, body, { signal: ac.signal }).finally(() => {
    res.off('close', onClose);
  });
}

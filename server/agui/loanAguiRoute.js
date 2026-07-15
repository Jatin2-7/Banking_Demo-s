import { streamLoanAguiRun } from './loanAguiRunner.js';
import { streamImpsAguiRun } from './impsAguiRunner.js';
import { streamHomeAguiRun } from './homeAguiRunner.js';
import { streamDepositAguiRun } from './depositAguiRunner.js';
import { streamTxnHistoryAguiRun } from './txnHistoryAguiRunner.js';
import { streamSSQuickLoanRun } from './ssQuickLoanRunner.js';
import { streamAbcdPersonalLoanRun } from './abcdPersonalLoanRunner.js';
import { streamOptimoHomeAguiRun } from './optimoHomeAguiRunner.js';
import { streamOptimoLapAguiRun } from './optimoLapAguiRunner.js';
import { streamDcbGoldLoanRun } from './dcbGoldLoanRunner.js';
import { streamSbiHomeLoanRun } from './sbiHomeLoanRunner.js';
import { streamSbiHomeAguiRun } from './sbiHomeAguiRunner.js';
import { streamKreditbeeArmRun } from './kreditbeeArmRunner.js';
import { streamKreditbeeHomeAguiRun } from './kreditbeeHomeAguiRunner.js';
import { streamIncredHomeAguiRun } from './incredHomeAguiRunner.js';
import { streamIncredPersonalLoanRun } from './incredPersonalLoanRunner.js';
import { streamEasemytripHomeAguiRun } from './easemytripHomeAguiRunner.js';
import { streamEasemytripForexAguiRun } from './easemytripForexAguiRunner.js';
import { streamEasemytripVisaAguiRun } from './easemytripVisaAguiRunner.js';
import { streamEasemytripAirportAguiRun } from './easemytripAirportAguiRunner.js';
import { LOAN_AGENT_ID } from './loanAgentConfig.js';
import { ABCD_PERSONAL_LOAN_AGENT_ID } from './abcdPersonalLoanConfig.js';
import { IMPS_AGENT_ID } from './impsAguiConfig.js';
import { HOME_AGENT_ID } from './homeAguiConfig.js';
import { DEPOSIT_AGENT_ID } from './depositAguiConfig.js';
import { TXN_HISTORY_AGENT_ID } from './txnHistoryAguiConfig.js';
import { SS_QUICKLOAN_AGENT_ID } from './ssQuickLoanConfig.js';
import { OPTIMO_HOME_AGENT_ID } from './optimoHomeAguiConfig.js';
import { OPTIMO_LAP_AGENT_ID } from './optimoLapAguiConfig.js';
import { KREDITBEE_ARM_AGENT_ID } from './kreditbeeArmConfig.js';
import { KREDITBEE_HOME_AGENT_ID } from './kreditbeeHomeAguiConfig.js';
import { DCB_GOLD_LOAN_AGENT_ID } from './dcbGoldLoanConfig.js';
import { SBI_HOME_LOAN_AGENT_ID } from './sbiHomeLoanConfig.js';
import { SBI_HOME_AGENT_ID } from './sbiHomeAguiConfig.js';
import { INCRED_HOME_AGENT_ID } from './incredHomeAguiConfig.js';
import { INCRED_PERSONAL_LOAN_AGENT_ID } from './incredPersonalLoanConfig.js';
import { EASEMYTRIP_HOME_AGENT_ID } from './easemytripHomeAguiConfig.js';
import { EASEMYTRIP_FOREX_AGENT_ID } from './easemytripForexAguiConfig.js';
import { EASEMYTRIP_VISA_AGENT_ID } from './easemytripVisaAguiConfig.js';
import { EASEMYTRIP_AIRPORT_AGENT_ID } from './easemytripAirportAguiConfig.js';

const RUNNERS = {
  [LOAN_AGENT_ID]: streamLoanAguiRun,
  [IMPS_AGENT_ID]: streamImpsAguiRun,
  [HOME_AGENT_ID]: streamHomeAguiRun,
  [DEPOSIT_AGENT_ID]: streamDepositAguiRun,
  [TXN_HISTORY_AGENT_ID]: streamTxnHistoryAguiRun,
  [SS_QUICKLOAN_AGENT_ID]: streamSSQuickLoanRun,
  [ABCD_PERSONAL_LOAN_AGENT_ID]: streamAbcdPersonalLoanRun,
  [OPTIMO_HOME_AGENT_ID]: streamOptimoHomeAguiRun,
  [OPTIMO_LAP_AGENT_ID]: streamOptimoLapAguiRun,
  [KREDITBEE_ARM_AGENT_ID]: streamKreditbeeArmRun,
  [KREDITBEE_HOME_AGENT_ID]: streamKreditbeeHomeAguiRun,
  [DCB_GOLD_LOAN_AGENT_ID]: streamDcbGoldLoanRun,
  [SBI_HOME_LOAN_AGENT_ID]: streamSbiHomeLoanRun,
  [SBI_HOME_AGENT_ID]: streamSbiHomeAguiRun,
  [INCRED_HOME_AGENT_ID]: streamIncredHomeAguiRun,
  [INCRED_PERSONAL_LOAN_AGENT_ID]: streamIncredPersonalLoanRun,
  [EASEMYTRIP_HOME_AGENT_ID]: streamEasemytripHomeAguiRun,
  [EASEMYTRIP_FOREX_AGENT_ID]: streamEasemytripForexAguiRun,
  [EASEMYTRIP_VISA_AGENT_ID]: streamEasemytripVisaAguiRun,
  [EASEMYTRIP_AIRPORT_AGENT_ID]: streamEasemytripAirportAguiRun,
};

export function handleLoanAguiPost(req, res) {
  const agentId = req.params.agentId;
  const runner = RUNNERS[agentId];
  if (!runner) {
    return res
      .status(404)
      .json({ error: 'unknown_agent', agentId, supported: Object.keys(RUNNERS) });
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

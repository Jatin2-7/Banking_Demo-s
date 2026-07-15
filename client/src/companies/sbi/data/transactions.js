/** SBI demo — transaction history (Jun 15 – Jul 15, 2026). */

export const SBI_ACCOUNT = {
  number: 'XXXXXXX5437',
  balance: 2542.58,
};

/** Newest first. Running balances verified chronologically. */
export const SBI_TRANSACTIONS = [
  {
    date: '15/07/2026',
    desc: 'UPI- TRANSFER TO 4897692...',
    amount: 30,
    balance: 2542.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '14/07/2026',
    desc: 'UPI- TRANSFER TO 4897691...',
    amount: 326,
    balance: 2572.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '14/07/2026',
    desc: 'UPI- TRANSFER TO 4897691...',
    amount: 80,
    balance: 2898.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '13/07/2026',
    desc: 'UPI- TRANSFER TO 4897690...',
    amount: 100,
    balance: 2978.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '13/07/2026',
    desc: 'UPI- TRANSFER TO 4897690...',
    amount: 76,
    balance: 3078.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '12/07/2026',
    desc: 'UPI- NETFLIX INDIA',
    amount: 649,
    balance: 3154.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '11/07/2026',
    desc: 'UPI- BIGBASKET',
    amount: 1567,
    balance: 3803.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '10/07/2026',
    desc: 'UPI- PHONEPE MERCHANT',
    amount: 899,
    balance: 5370.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '08/07/2026',
    desc: 'BILL PAY- ELECTRICITY',
    amount: 3200,
    balance: 6269.58,
    type: 'debit',
    channel: 'BILL',
  },
  {
    date: '05/07/2026',
    desc: 'UPI- INDIAN OIL PETROL',
    amount: 2500,
    balance: 9469.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '02/07/2026',
    desc: 'UPI- IRCTC TICKET',
    amount: 1847,
    balance: 11969.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '30/06/2026',
    desc: 'IMPS- TRANSFER TO 4897689...',
    amount: 5000,
    balance: 13816.58,
    type: 'debit',
    channel: 'IMPS',
  },
  {
    date: '28/06/2026',
    desc: 'UPI- FLIPKART PAYMENTS',
    amount: 2499,
    balance: 18816.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '25/06/2026',
    desc: 'ATM WDL- CHANDPOLE UDAIPUR',
    amount: 2000,
    balance: 21315.58,
    type: 'debit',
    channel: 'ATM',
  },
  {
    date: '22/06/2026',
    desc: 'UPI- ZOMATO',
    amount: 350,
    balance: 23315.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '20/06/2026',
    desc: 'NEFT- RENT TRANSFER',
    amount: 15000,
    balance: 23665.58,
    type: 'debit',
    channel: 'NEFT',
  },
  {
    date: '18/06/2026',
    desc: 'UPI- AMAZON PAY',
    amount: 1299,
    balance: 38665.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '16/06/2026',
    desc: 'UPI- SWIGGY',
    amount: 420,
    balance: 39964.58,
    type: 'debit',
    channel: 'UPI',
  },
  {
    date: '15/06/2026',
    desc: 'SALARY CREDIT- SILVER SUITS',
    amount: 45000,
    balance: 40384.58,
    type: 'credit',
    channel: 'NEFT',
  },
];

export function groupTransactionsByMonth(transactions) {
  const groups = [];
  let current = null;
  for (const txn of transactions) {
    const [, month, year] = txn.date.split('/');
    const label = `${month === '06' ? 'June' : month === '07' ? 'July' : month} ${year}`;
    if (!current || current.label !== label) {
      current = { label, items: [] };
      groups.push(current);
    }
    current.items.push(txn);
  }
  return groups;
}

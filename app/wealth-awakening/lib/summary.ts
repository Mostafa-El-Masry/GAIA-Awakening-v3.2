import { todayKey } from "@/utils/dates";
import type {
  DayKey,
  MonthKey,
  WealthOverview,
  WealthState,
  WealthFlow,
} from "./types";

export function getTodayInKuwait(): DayKey {
  return todayKey();
}

function toMonthKey(day: DayKey): MonthKey {
  return day.slice(0, 7);
}

function classifyFlow(flow: WealthFlow): number {
  const signPositiveKinds: WealthFlow["kind"][] = [
    "income",
    "deposit",
    "interest",
  ];
  const signNegativeKinds: WealthFlow["kind"][] = ["withdrawal", "expense"];

  if (signPositiveKinds.includes(flow.kind)) return +flow.amount;
  if (signNegativeKinds.includes(flow.kind)) return -flow.amount;
  return 0;
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}

export function buildWealthOverview(
  state: WealthState,
  today: DayKey,
): WealthOverview {
  const totalNetWorth = sumBy(state.accounts, (a) => a.currentBalance);
  const totalCash = sumBy(
    state.accounts.filter((a) => a.type === "cash"),
    (a) => a.currentBalance,
  );
  const totalCertificates = sumBy(
    state.accounts.filter((a) => a.type === "certificate"),
    (a) => a.currentBalance,
  );
  const totalInvestments = sumBy(
    state.accounts.filter((a) => a.type === "investment"),
    (a) => a.currentBalance,
  );

  const primaryCurrency =
    state.accounts.find((a) => a.isPrimary)?.currency ||
    state.accounts[0]?.currency ||
    "KWD";

  const monthKey = toMonthKey(today);
  const flowsThisMonth = state.flows.filter(
    (f) => toMonthKey(f.date) === monthKey,
  );

  const totalDeposits = sumBy(
    flowsThisMonth.filter((f) => f.kind === "deposit"),
    (f) => f.amount,
  );
  const totalWithdrawals = sumBy(
    flowsThisMonth.filter((f) => f.kind === "withdrawal"),
    (f) => f.amount,
  );
  const totalIncome = sumBy(
    flowsThisMonth.filter((f) => f.kind === "income"),
    (f) => f.amount,
  );
  const totalInterest = sumBy(
    flowsThisMonth.filter((f) => f.kind === "interest"),
    (f) => f.amount,
  );
  const totalExpenses = sumBy(
    flowsThisMonth.filter((f) => f.kind === "expense"),
    (f) => f.amount,
  );

  const netChangeFromFlows = sumBy(flowsThisMonth, classifyFlow);
  const endingBalance = totalNetWorth;
  const startingBalance = endingBalance - netChangeFromFlows;

  const netChange = endingBalance - startingBalance;
  const netChangePercent =
    startingBalance > 0 ? (netChange / startingBalance) * 100 : null;

  const story = buildMonthStorySentence({
    totalDeposits,
    totalIncome,
    totalInterest,
    totalWithdrawals,
    totalExpenses,
    netChange,
  });

  return {
    ...state,
    today,
    totalNetWorth,
    totalCash,
    totalCertificates,
    totalInvestments,
    primaryCurrency,
    monthStory: {
      month: monthKey,
      startingBalance,
      totalDeposits,
      totalWithdrawals,
      totalIncome,
      totalInterest,
      totalExpenses,
      endingBalance,
      netChange,
      netChangePercent,
      story,
    },
  };
}

interface StoryInputs {
  totalDeposits: number;
  totalIncome: number;
  totalInterest: number;
  totalWithdrawals: number;
  totalExpenses: number;
  netChange: number;
}

function buildMonthStorySentence(inputs: StoryInputs): string {
  const inflow =
    inputs.totalDeposits + inputs.totalIncome + inputs.totalInterest;
  const outflow = inputs.totalWithdrawals + inputs.totalExpenses;

  if (!Number.isFinite(inflow) || !Number.isFinite(outflow)) {
    return "This month&apos;s money story is still warming up.";
  }

  if (inputs.netChange > 0 && inflow > outflow) {
    return "You grew your net stash this month. You put more in than you took out.";
  }

  if (Math.abs(inputs.netChange) < 1) {
    return "You held steady this month. No big moves, but your base is still there.";
  }

  if (inputs.netChange < 0 && outflow > inflow) {
    return "You dipped into your savings this month. That&apos;s okay; Wall Street Drive is here to help you see the road ahead.";
  }

  return "Your month had a mix of deposits and withdrawals. The full driving logic will come as we add more data.";
}

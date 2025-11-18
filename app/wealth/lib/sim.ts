"use client";

import type { Cert, SimInput, SimResult, YearRow, MonthRow } from "./types";

/**
 * Updated assumptions per user:
 * - During first 7 years (deposit horizon), each month opens a cert for (base deposit + any accumulated pot).
 *   Pot accumulates: monthly interest from existing certs + matured principals.
 * - After 7 years, user stops base deposits but keeps reinvesting *everything* (monthly interest + matured principals).
 *   A new cert is opened whenever the pot >= minReinvest (e.g., 1,000 EGP). Remainder (< min) carries forward as cash.
 * - All certs are 36 months (3 years) fixed-rate at the year-of-origination rate (coupon monthly, not compounding inside).
 * - Net worth = active principal (locked) + cash remainder carried.
 * - Rate schedule: 2025:15%, 2026:14%, 2027:13%, 2028:12%, 2029:11%, 2030+:10% (floor).
 */
function rateForYear(y: number): number {
  if (y <= 2025) return 0.17;
  if (y === 2026) return 0.16;
  if (y === 2027) return 0.15;
  if (y === 2028) return 0.14;
  if (y === 2029) return 0.13;
  if (y === 2030) return 0.12;
  if (y === 2031) return 0.11;
  return 0.1;
}

function ageAtDec31(year: number): number {
  return year - 1991;
} // born 1991-08-10

function ageAtMonth(year: number, monthIndex: number): number {
  // birth in August 1991 (monthIndex 7). Return age in years with one decimal.
  const birthMonthIndex = 7;
  const ageYears = year - 1991 + (monthIndex - birthMonthIndex) / 12;
  return Number(ageYears.toFixed(1));
}

function pushMonthRow(
  rows: any[],
  year: number,
  monthIndex: number,
  depositsThisMonth: number,
  monthlyInterest: number,
  activePrincipal: number,
  cash: number
) {
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  rows.push({
    year,
    monthIndex,
    month,
    age: ageAtMonth(year, monthIndex),
    depositsThisMonth: Math.round(depositsThisMonth),
    monthlyInterest: Math.round(monthlyInterest),
    activePrincipal: Math.round(activePrincipal),
    cash: Math.round(cash),
    netWorth: Math.round(activePrincipal + cash),
  });
}

function pushDecRow(
  rows: YearRow[],
  year: number,
  depositsYTD: number,
  monthlyInterestDec: number,
  activePrincipal: number,
  cash: number
) {
  rows.push({
    year,
    age: ageAtDec31(year),
    depositsYTD: Math.round(depositsYTD),
    monthlyInterestDec: Math.round(monthlyInterestDec),
    activePrincipalEnd: Math.round(activePrincipal),
    cashEnd: Math.round(cash),
    netWorthEnd: Math.round(activePrincipal + cash),
  });
}

export function simulate(planName: string, input: SimInput): SimResult {
  const termMonths = 36;
  const lastYear = 2051; // age 60
  const finalMonthIndex = 11; // December

  let year = input.startYear;
  let month = input.startMonthIndex; // 0..11
  const monthsOfDeposits = input.yearsOfDeposits * 12;
  let depositsDone = 0;

  let certs: Cert[] = [];
  let cash = 0; // remainder below minReinvest
  let pot = 0; // accumulates interest + maturities (+ base during horizon)
  const rows: YearRow[] = [];
  let depositsThisYear = 0;
  let totalDeposited = 0;

  while (year < lastYear || (year === lastYear && month <= finalMonthIndex)) {
    // 1) Monthly coupon interest from active certs
    const monthlyInterest = certs.reduce(
      (sum, c) => sum + (c.principal * c.rate) / 12,
      0
    );
    pot += monthlyInterest;

    // 2) Maturities at end of month -> principal returned; add to pot (to be re-invested)
    const nextCerts: Cert[] = [];
    for (const c of certs) {
      const left = c.monthsLeft - 1;
      if (left <= 0) {
        pot += c.principal;
      } else {
        nextCerts.push({ ...c, monthsLeft: left });
      }
    }
    certs = nextCerts;

    // 3) Opening new certificates
    const inHorizon = depositsDone < monthsOfDeposits;
    if (inHorizon) {
      // During horizon: add base deposit to pot and open a new cert for the entire pot
      pot += input.baseMonthlyDeposit;
      const r = rateForYear(year);
      certs.push({
        principal: pot,
        startYear: year,
        startMonthIndex: month,
        rate: r,
        monthsLeft: termMonths,
      });
      depositsThisYear += pot;
      totalDeposited += pot;
      pot = 0;
      depositsDone += 1;
    } else {
      // After horizon: if pot >= minReinvest, open a cert for the full pot; else let it accumulate (cash shown as remainder)
      if (pot >= input.minReinvest) {
        const r = rateForYear(year);
        certs.push({
          principal: pot,
          startYear: year,
          startMonthIndex: month,
          rate: r,
          monthsLeft: termMonths,
        });
        depositsThisYear += pot;
        totalDeposited += pot;
        pot = 0;
      }
    }

    // 4) For reporting, any leftover pot under min threshold is considered cash remainder
    cash = pot;

    // 5) December snapshot
    if (month === 11) {
      const activePrincipal = certs.reduce((s, c) => s + c.principal, 0);
      const decMonthlyInterest = certs.reduce(
        (s, c) => s + (c.principal * c.rate) / 12,
        0
      );
      pushDecRow(
        rows,
        year,
        depositsThisYear,
        decMonthlyInterest,
        activePrincipal,
        cash
      );
      depositsThisYear = 0;
    }

    // 6) Next month
    month += 1;
    if (month >= 12) {
      month = 0;
      year += 1;
    }
  }

  const totals = {
    deposited: Math.round(totalDeposited),
    cash: Math.round(cash),
    activePrincipal: Math.round(certs.reduce((s, c) => s + c.principal, 0)),
    netWorth: Math.round(cash + certs.reduce((s, c) => s + c.principal, 0)),
  };

  return { planName, rows, totals };
}

/**
 * Simulate but stop adding base monthly deposits as soon as the monthly
 * interest (sum of coupons) reaches or exceeds `targetMonthlyEGP`.
 * After that point, the behavior is identical to `simulate`: all pot and
 * maturities are reinvested when >= minReinvest.
 */
export function simulateUntilMonthlyTarget(
  planName: string,
  input: SimInput,
  targetMonthlyEGP: number
): SimResult {
  const termMonths = 36;
  const maxMonths = 600; // safety cap (50 years)

  let year = input.startYear;
  let month = input.startMonthIndex; // 0..11
  const monthsOfDeposits = input.yearsOfDeposits * 12;
  let depositsDone = 0;

  let certs: Cert[] = [];
  let cash = 0; // remainder below minReinvest
  let pot = 0; // accumulates interest + maturities (+ base during horizon)
  const rows: any[] = [];
  let depositsThisMonth = 0;
  let totalDeposited = 0;
  let monthsElapsed = 0;

  while (monthsElapsed < maxMonths) {
    // 1) Monthly coupon interest from active certs
    const monthlyInterest = certs.reduce(
      (sum, c) => sum + (c.principal * c.rate) / 12,
      0
    );
    pot += monthlyInterest;

    // 2) Maturities at end of month -> principal returned; add to pot (to be re-invested)
    const nextCerts: Cert[] = [];
    for (const c of certs) {
      const left = c.monthsLeft - 1;
      if (left <= 0) {
        pot += c.principal;
      } else {
        nextCerts.push({ ...c, monthsLeft: left });
      }
    }
    certs = nextCerts;

    // Reset monthly deposit tracker
    depositsThisMonth = 0;

    // 3) Opening new certificates
    const inHorizon = depositsDone < monthsOfDeposits;
    if (inHorizon) {
      // During horizon: add base deposit to pot and open a new cert for the entire pot
      pot += input.baseMonthlyDeposit;
      const r = rateForYear(year);
      certs.push({
        principal: pot,
        startYear: year,
        startMonthIndex: month,
        rate: r,
        monthsLeft: termMonths,
      });
      depositsThisMonth = pot;
      totalDeposited += pot;
      pot = 0;
      depositsDone += 1;
    } else {
      // After horizon: if pot >= minReinvest, open a cert for the full pot; else let it accumulate (cash shown as remainder)
      if (pot >= input.minReinvest) {
        const r = rateForYear(year);
        certs.push({
          principal: pot,
          startYear: year,
          startMonthIndex: month,
          rate: r,
          monthsLeft: termMonths,
        });
        depositsThisMonth = pot;
        totalDeposited += pot;
        pot = 0;
      }
    }

    // 4) For reporting, any leftover pot under min threshold is considered cash remainder
    cash = pot;

    // 5) Compute monthly interest after processing maturities and opening new certs.
    //    This treats the newly opened certificate(s) as contributing to the month's
    //    interest for the purposes of determining whether the monthly target is met.
    const monthlyInterestAfter = certs.reduce(
      (sum, c) => sum + (c.principal * c.rate) / 12,
      0
    );

    // 6) Push monthly snapshot (use the post-processing monthly interest so the
    //    display and stop-check align with the client's expectation that a new
    //    deposit increases monthly coupons immediately)
    const activePrincipal = certs.reduce((s, c) => s + c.principal, 0);
    pushMonthRow(
      rows,
      year,
      month,
      depositsThisMonth,
      monthlyInterestAfter,
      activePrincipal,
      cash
    );

    // 7) If we've reached or exceeded the target this month (based on the
    //    post-processing monthly interest), compute totals AND generate a
    //    continuation trajectory that assumes no further base deposits and
    //    only reinvestment until age 60 (Dec 2051).
    if (monthlyInterestAfter >= targetMonthlyEGP) {
      const totals = {
        deposited: Math.round(totalDeposited),
        cash: Math.round(cash),
        activePrincipal: Math.round(activePrincipal),
        netWorth: Math.round(activePrincipal + cash),
      };

      // Build continuationYears: clones current state and simulates forward with
      // base deposits disabled (reinvest-only) up to Dec 2051. We aggregate
      // into yearly (Dec) snapshots so the post-target trajectory is yearly.
      const continuationYears: YearRow[] = [];

      // Clone certs (make shallow copies) and local vars for continuation sim
      let contCerts: Cert[] = certs.map((c) => ({ ...c }));
      let contPot = pot;
      let contCash = cash;
      let contYear = year;
      let contMonth = month;

      const contLastYear = 2051;
      const contFinalMonthIndex = 11; // December
      let contMonthsElapsed = 0;
      const contMaxMonths = 600;

      // advance month-by-month but only push Dec snapshots as YearRow entries
      let depositsThisYear = 0;
      while (
        contMonthsElapsed < contMaxMonths &&
        (contYear < contLastYear ||
          (contYear === contLastYear && contMonth <= contFinalMonthIndex))
      ) {
        // monthly coupons from active certs
        const contMonthlyInterest = contCerts.reduce(
          (sum, c) => sum + (c.principal * c.rate) / 12,
          0
        );
        contPot += contMonthlyInterest;

        // maturities
        const nextContCerts: Cert[] = [];
        for (const c of contCerts) {
          const left = c.monthsLeft - 1;
          if (left <= 0) {
            contPot += c.principal;
          } else {
            nextContCerts.push({ ...c, monthsLeft: left });
          }
        }
        contCerts = nextContCerts;

        // after target: no base deposits; open new cert only if pot >= minReinvest
        if (contPot >= input.minReinvest) {
          const r = rateForYear(contYear);
          contCerts.push({
            principal: contPot,
            startYear: contYear,
            startMonthIndex: contMonth,
            rate: r,
            monthsLeft: termMonths,
          });
          depositsThisYear += contPot;
          contPot = 0;
        }

        // cash remainder is pot under minReinvest
        contCash = contPot;

        // If December, push a yearly snapshot
        if (contMonth === 11) {
          const contActivePrincipal = contCerts.reduce(
            (s, c) => s + c.principal,
            0
          );
          const decMonthlyInterest = contCerts.reduce(
            (s, c) => s + (c.principal * c.rate) / 12,
            0
          );
          pushDecRow(
            continuationYears,
            contYear,
            depositsThisYear,
            decMonthlyInterest,
            contActivePrincipal,
            contCash
          );
          depositsThisYear = 0;
        }

        // advance month
        contMonth += 1;
        if (contMonth >= 12) {
          contMonth = 0;
          contYear += 1;
        }
        contMonthsElapsed += 1;
      }

      return { planName, rows, totals, continuationYears };
    }

    // 8) Next month
    month += 1;
    if (month >= 12) {
      month = 0;
      year += 1;
    }
    monthsElapsed += 1;
  }

  // If we exit loop without reaching target, return what we have
  const totals = {
    deposited: Math.round(totalDeposited),
    cash: Math.round(cash),
    activePrincipal: Math.round(certs.reduce((s, c) => s + c.principal, 0)),
    netWorth: Math.round(cash + certs.reduce((s, c) => s + c.principal, 0)),
  };

  return { planName, rows, totals };
}

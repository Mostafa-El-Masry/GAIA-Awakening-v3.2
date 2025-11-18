import { addInvestment } from "./lib/store";

// Add first certificate (25,000 EGP)
addInvestment({
  name: "Certificate 25K",
  principal: 25000,
  annualRatePercent: 17,
  startDate: "2025-11-02",
  endDate: "2028-03-01",
});

// Add second certificate (10,000 EGP)
addInvestment({
  name: "Certificate 10K",
  principal: 10000,
  annualRatePercent: 17,
  startDate: "2025-11-02",
  endDate: "2028-01-02",
});

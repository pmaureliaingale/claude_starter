import { render, screen } from "@testing-library/react";
import { SummaryBar } from "../dashboard/SummaryBar";
import type { SummaryStats } from "@/lib/applications";

const baseStats: SummaryStats = {
  total: 42,
  responseRate: 15,
  byStatus: { applied: 30, interviewing: 5, offer: 2, rejected: 5 },
  periodLabel: "This Month",
};

describe("SummaryBar", () => {
  it("displays the total application count", () => {
    render(<SummaryBar stats={baseStats} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("displays the response rate as a percentage", () => {
    render(<SummaryBar stats={baseStats} />);
    expect(screen.getByText("15%")).toBeInTheDocument();
  });

  it("shows the period label in status breakdown", () => {
    render(<SummaryBar stats={baseStats} />);
    expect(screen.getByText(/This Month/)).toBeInTheDocument();
  });

  it("displays 0% response rate when no applications", () => {
    render(
      <SummaryBar
        stats={{ ...baseStats, total: 0, responseRate: 0 }}
      />
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows active count as sum of interviewing and responded", () => {
    const stats: SummaryStats = {
      ...baseStats,
      byStatus: { interviewing: 3, responded: 2, applied: 10 },
    };
    render(<SummaryBar stats={stats} />);
    // Active = interviewing(3) + responded(2) = 5
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

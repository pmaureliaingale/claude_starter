import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the correct label for each status", () => {
    const cases = [
      { status: "applied", label: "Applied" },
      { status: "responded", label: "Responded" },
      { status: "interviewing", label: "Interviewing" },
      { status: "offer", label: "Offer" },
      { status: "rejected", label: "Rejected" },
      { status: "withdrawn", label: "Withdrawn" },
      { status: "manual_review", label: "Manual Review" },
    ];

    for (const { status, label } of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("renders unknown statuses with the raw value", () => {
    render(<StatusBadge status="some_unknown_status" />);
    expect(screen.getByText("some_unknown_status")).toBeInTheDocument();
  });

  it("applies green color class for offer status", () => {
    const { container } = render(<StatusBadge status="offer" />);
    expect(container.firstChild).toHaveClass("text-green-400");
  });

  it("applies red color class for rejected status", () => {
    const { container } = render(<StatusBadge status="rejected" />);
    expect(container.firstChild).toHaveClass("text-red-400");
  });
});

import { describe, it, expect } from "vitest";
import { AppError } from "../src/modules/shared/app-error";
import {
  applyTransition,
  canTransition,
  getValidTransitions,
  isTerminal,
  canAuthorAct,
  canEditorAct,
  canReviewerAct,
} from "../src/modules/editorial/domain/state-machine";

function expectInvalidTransition(transition: () => unknown): void {
  try {
    transition();
    throw new Error("Expected transition to be rejected");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: "INVALID_STATE_TRANSITION" });
  }
}

describe("Editorial State Machine", () => {
  describe("Valid transitions from draft", () => {
    it("allows author to withdraw", () => {
      const result = applyTransition("draft", "withdraw", "author", "human");
      expect(result).toBe("withdrawn");
    });

    it("rejects reviewer acting on draft", () => {
      expectInvalidTransition(() => applyTransition("draft", "screening_passed", "reviewer", "human"));
    });

    it("rejects editor screening before the author submits", () => {
      expectInvalidTransition(() => applyTransition("draft", "screening_passed", "editor", "human"));
      expectInvalidTransition(() => applyTransition("draft", "screening_failed", "editor", "human"));
    });
  });

  describe("Valid transitions from submitted", () => {
    it("allows editor to pass screening", () => {
      const result = applyTransition("submitted", "screening_passed", "editor", "human");
      expect(result).toBe("under_review");
    });

    it("allows editor to fail screening", () => {
      const result = applyTransition("submitted", "screening_failed", "editor", "human");
      expect(result).toBe("rejected");
    });

    it("allows author to withdraw", () => {
      const result = applyTransition("submitted", "withdraw", "author", "human");
      expect(result).toBe("withdrawn");
    });
  });

  describe("Valid transitions from under_review", () => {
    it("allows editor to assign reviewer", () => {
      const result = applyTransition("under_review", "reviewer_assigned", "editor", "human");
      expect(result).toBe("under_review");
    });

    it("allows editor to unassign reviewer", () => {
      const result = applyTransition("under_review", "reviewer_unassigned", "editor", "human");
      expect(result).toBe("under_review");
    });

    it("allows reviewer to submit review", () => {
      const result = applyTransition("under_review", "review_submitted", "reviewer", "human");
      expect(result).toBe("under_review");
    });

    it("allows editor to request revision", () => {
      const result = applyTransition("under_review", "revision_requested", "editor", "human");
      expect(result).toBe("revision_requested");
    });

    it("allows editor to accept", () => {
      const result = applyTransition("under_review", "accept", "editor", "human");
      expect(result).toBe("accepted");
    });

    it("allows editor to reject", () => {
      const result = applyTransition("under_review", "reject", "editor", "human");
      expect(result).toBe("rejected");
    });

    it("allows author to withdraw", () => {
      const result = applyTransition("under_review", "withdraw", "author", "human");
      expect(result).toBe("withdrawn");
    });
  });

  describe("Valid transitions from revision_requested", () => {
    it("allows author to submit revision", () => {
      const result = applyTransition("revision_requested", "revision_received", "author", "human");
      expect(result).toBe("under_review");
    });

    it("allows editor to reject", () => {
      const result = applyTransition("revision_requested", "reject", "editor", "human");
      expect(result).toBe("rejected");
    });

    it("allows author to withdraw", () => {
      const result = applyTransition("revision_requested", "withdraw", "author", "human");
      expect(result).toBe("withdrawn");
    });
  });

  describe("Terminal states", () => {
    it("accepted is terminal", () => {
      expect(isTerminal("accepted")).toBe(true);
    });

    it("rejected is terminal", () => {
      expect(isTerminal("rejected")).toBe(true);
    });

    it("withdrawn is terminal", () => {
      expect(isTerminal("withdrawn")).toBe(true);
    });

    it("under_review is not terminal", () => {
      expect(isTerminal("under_review")).toBe(false);
    });

    it("no transitions from terminal states", () => {
      expectInvalidTransition(() => applyTransition("accepted", "accept", "editor", "human"));
      expectInvalidTransition(() => applyTransition("rejected", "reject", "editor", "human"));
      expectInvalidTransition(() => applyTransition("withdrawn", "withdraw", "author", "human"));
    });
  });

  describe("canTransition helper", () => {
    it("returns allowed=true for valid transitions", () => {
      const result = canTransition("submitted", "screening_passed", "editor", "human");
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("under_review");
    });

    it("returns allowed=false for invalid transitions", () => {
      const result = canTransition("draft", "accept", "editor", "human");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it("returns allowed=false for wrong role", () => {
      const result = canTransition("submitted", "screening_passed", "author", "human");
      expect(result.allowed).toBe(false);
    });

    it("returns allowed=false for system actor", () => {
      const result = canTransition("submitted", "screening_passed", "editor", "system");
      expect(result.allowed).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns all valid transitions from draft", () => {
      const transitions = getValidTransitions("draft");
      expect(transitions.map((t) => t.action)).toEqual(["withdraw"]);
    });
  });

  describe("Permission helpers", () => {
    it("author can act on draft", () => {
      expect(canAuthorAct("draft")).toBe(true);
    });

    it("author can act on submitted", () => {
      expect(canAuthorAct("submitted")).toBe(true);
    });

    it("author can act on revision_requested", () => {
      expect(canAuthorAct("revision_requested")).toBe(true);
    });

    it("author cannot act on under_review", () => {
      expect(canAuthorAct("under_review")).toBe(false);
    });

    it("author cannot act on accepted", () => {
      expect(canAuthorAct("accepted")).toBe(false);
    });

    it("editor can act only after submission and before terminal states", () => {
      expect(canEditorAct("draft")).toBe(false);
      expect(canEditorAct("submitted")).toBe(true);
      expect(canEditorAct("under_review")).toBe(true);
      expect(canEditorAct("revision_requested")).toBe(true);
      expect(canEditorAct("accepted")).toBe(false);
      expect(canEditorAct("rejected")).toBe(false);
      expect(canEditorAct("withdrawn")).toBe(false);
    });

    it("reviewer can only act on under_review", () => {
      expect(canReviewerAct("under_review")).toBe(true);
      expect(canReviewerAct("draft")).toBe(false);
      expect(canReviewerAct("submitted")).toBe(false);
      expect(canReviewerAct("revision_requested")).toBe(false);
    });
  });
});

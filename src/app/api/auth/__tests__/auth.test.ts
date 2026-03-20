import bcrypt from "bcrypt";

// Test the credential validation logic in isolation
describe("Authentication — credential validation", () => {
  it("bcrypt.compare returns true for correct password", async () => {
    const password = "testpassword123";
    const hash = await bcrypt.hash(password, 12);
    const result = await bcrypt.compare(password, hash);
    expect(result).toBe(true);
  });

  it("bcrypt.compare returns false for wrong password", async () => {
    const hash = await bcrypt.hash("correctpassword", 12);
    const result = await bcrypt.compare("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("bcrypt.hash generates different hashes for same password", async () => {
    const password = "samepassword";
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);
    expect(hash1).not.toBe(hash2);
    // Both should still verify
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});

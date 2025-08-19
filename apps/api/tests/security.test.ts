import { describe, it, expect } from "vitest";
import { htmlEncode, sanitizeJsonResponse, isValidEmail, isValidUrl } from "../src/utils/security";

describe("Security Utils", () => {
  describe("htmlEncode", () => {
    it("should encode HTML entities", () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(htmlEncode(input)).toBe(expected);
    });
  });

  describe("sanitizeJsonResponse", () => {
    it("should sanitize string values", () => {
      const input = { message: '<script>alert("xss")</script>' };
      const result = sanitizeJsonResponse(input);
      expect(result.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it("should handle nested objects", () => {
      const input = {
        user: {
          name: '<img src=x onerror=alert(1)>',
          email: 'test@example.com'
        }
      };
      const result = sanitizeJsonResponse(input);
      expect(result.user.name).toBe('&lt;img src=x onerror=alert(1)&gt;');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid.email")).toBe(false);
      expect(isValidEmail("test..test@example.com")).toBe(false);
      expect(isValidEmail(".test@example.com")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate HTTPS URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("https://subdomain.example.com/path")).toBe(true);
    });

    it("should reject dangerous protocols", () => {
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });
  });
});
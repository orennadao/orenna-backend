import { describe, it, expect, vi } from 'vitest';
import { htmlEncode, sanitizeJsonResponse, isValidEmail, isValidUrl } from '../../src/utils/security';

describe('Unit Tests - Security Utils', () => {
  describe('htmlEncode', () => {
    it('should encode dangerous HTML characters', () => {
      const testCases = [
        { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;' },
        { input: '<img src=x onerror=alert(1)>', expected: '&lt;img src=x onerror=alert(1)&gt;' },
        { input: '&<>"\'/', expected: '&amp;&lt;&gt;&quot;&#x27;&#x2F;' },
        { input: 'normal text', expected: 'normal text' },
        { input: '', expected: '' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(htmlEncode(input)).toBe(expected);
      });
    });
  });

  describe('sanitizeJsonResponse', () => {
    it('should sanitize string values in objects', () => {
      const input = {
        message: '<script>alert("xss")</script>',
        name: 'John & Jane',
        safe: 'normal text',
      };

      const result = sanitizeJsonResponse(input);
      
      expect(result.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result.name).toBe('John &amp; Jane');
      expect(result.safe).toBe('normal text');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<img src=x onerror=alert(1)>',
          profile: {
            bio: 'Safe text & symbols',
          },
        },
        items: ['<script>evil</script>', 'safe item'],
      };

      const result = sanitizeJsonResponse(input);
      
      expect(result.user.name).toBe('&lt;img src=x onerror=alert(1)&gt;');
      expect(result.user.profile.bio).toBe('Safe text &amp; symbols');
      expect(result.items[0]).toBe('&lt;script&gt;evil&lt;&#x2F;script&gt;');
      expect(result.items[1]).toBe('safe item');
    });

    it('should handle arrays', () => {
      const input = ['<script>alert(1)</script>', 'normal text', null, 123];
      const result = sanitizeJsonResponse(input);
      
      expect(result[0]).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
      expect(result[1]).toBe('normal text');
      expect(result[2]).toBe(null);
      expect(result[3]).toBe(123);
    });

    it('should handle non-string primitives', () => {
      const input = {
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
      };

      const result = sanitizeJsonResponse(input);
      
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.null).toBe(null);
      expect(result.undefined).toBe(undefined);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'admin@subdomain.example.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid.email',
        'test..test@example.com',
        '.test@example.com',
        'test@example.com.',
        'test@',
        '@example.com',
        'test@.com',
        'test@com',
        '',
        'a'.repeat(255) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTPS and HTTP URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.com:8080/path?query=value',
        'http://localhost:3000/test',
      ];

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it('should reject dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://example.com/file',
        'mailto:test@example.com',
      ];

      dangerousUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });

    it('should reject private networks in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const privateUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://0.0.0.0:3000',
        'http://10.0.0.1/test',
        'http://172.16.0.1/test',
        'http://192.168.1.1/test',
      ];

      privateUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow private networks in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const privateUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
      ];

      privateUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https://',
      ];

      malformedUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });
});
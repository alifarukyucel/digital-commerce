import { isValidSlug, generateSlug } from '../../utils/validation.utils';

describe('Validation Utils', () => {
  describe('isValidSlug', () => {
    it('should return true for valid slugs', () => {
      expect(isValidSlug('my-product')).toBe(true);
      expect(isValidSlug('product-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
      expect(isValidSlug('multi-word-slug')).toBe(true);
    });

    it('should return false for invalid slugs', () => {
      expect(isValidSlug('My Product')).toBe(false); // spaces
      expect(isValidSlug('product_name')).toBe(false); // underscore
      expect(isValidSlug('Product-123')).toBe(false); // uppercase
      expect(isValidSlug('product--name')).toBe(false); // double dash
      expect(isValidSlug('-product')).toBe(false); // starts with dash
      expect(isValidSlug('product-')).toBe(false); // ends with dash
      expect(isValidSlug('product@123')).toBe(false); // special char
    });
  });

  describe('generateSlug', () => {
    it('should convert text to valid slug', () => {
      expect(generateSlug('My Product Name')).toBe('my-product-name');
      expect(generateSlug('Product 123')).toBe('product-123');
      expect(generateSlug('  Trimmed  ')).toBe('trimmed');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Product@#$%Name')).toBe('productname');
      expect(generateSlug('Hello & Goodbye')).toBe('hello-goodbye');
    });

    it('should handle multiple spaces and dashes', () => {
      expect(generateSlug('Too   Many   Spaces')).toBe('too-many-spaces');
      expect(generateSlug('Already-Has-Dashes')).toBe('already-has-dashes');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('UPPERCASE')).toBe('uppercase');
      expect(generateSlug('MixedCase')).toBe('mixedcase');
    });
  });
});

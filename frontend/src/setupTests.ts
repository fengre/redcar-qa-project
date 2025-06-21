// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock fetch globally for tests
global.fetch = jest.fn();

// Mock TextDecoder for streaming tests
global.TextDecoder = class {
  decode(input?: Uint8Array): string {
    if (!input) return '';
    return String.fromCharCode.apply(null, Array.from(input));
  }
} as any;

// Mock TextEncoder for tests if not available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(str: string): Uint8Array {
      if (!str) return new Uint8Array();
      const arr = Array.from(str).map((c: string) => c.charCodeAt(0));
      return new Uint8Array(arr);
    }
    encoding = 'utf-8';
    encodeInto?(src: string, dest: Uint8Array): { read: number; written: number } {
      const bytes = this.encode(src);
      dest.set(bytes);
      return { read: src.length, written: bytes.length };
    }
  } as typeof TextEncoder;
}

// Mock ReadableStream for tests if not available or missing getReader
if (typeof global.ReadableStream === 'undefined' ||
    !('getReader' in global.ReadableStream.prototype)) {
  global.ReadableStream = class {
    private _text: string;
    constructor({ text = 'Microsoft is a technology company' } = {}) {
      this._text = text;
    }
    getReader() {
      let done = false;
      return {
        read: () => {
          if (!done) {
            done = true;
            const encoder = new (global.TextEncoder || TextEncoder)();
            return Promise.resolve({ done: false, value: encoder.encode(this._text) });
          } else {
            return Promise.resolve({ done: true, value: undefined });
          }
        },
        releaseLock: () => {},
        closed: Promise.resolve(),
        cancel: () => Promise.resolve()
      };
    }
  } as any;
} 
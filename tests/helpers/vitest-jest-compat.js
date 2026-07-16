'use strict';

// Test files were written against Jest's `jest` global (jest.fn, jest.spyOn).
// Vitest's equivalent is `vi`; alias it so those call sites port unmodified.
globalThis.jest = globalThis.vi;

import '@jest/globals';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockResolvedValue: (value: T) => Mock<T, Y>;
      mockImplementation: (implementation: (...args: Y) => T) => Mock<T, Y>;
      mockReturnThis: () => Mock<T, Y>;
    }
  }
} 
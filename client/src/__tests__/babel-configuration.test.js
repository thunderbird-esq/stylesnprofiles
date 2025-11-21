// Test to verify Babel configuration works with modern ES6+ features
import { describe, test, expect } from '@jest/globals';

describe('Babel Configuration Test', () => {
  test('ES6+ module imports work correctly', () => {
    // Test destructuring assignment
    const testObject = { name: 'test', value: 42 };
    const { name, value } = testObject;

    expect(name).toBe('test');
    expect(value).toBe(42);
  });

  test('ES6+ arrow functions and async/await work', async () => {
    // Test arrow function
    const arrowFunction = (x) => x * 2;
    expect(arrowFunction(5)).toBe(10);

    // Test async/await
    const asyncFunction = async () => {
      return Promise.resolve('async success');
    };

    const result = await asyncFunction();
    expect(result).toBe('async success');
  });

  test('ES6+ classes and template literals work', () => {
    // Test class syntax
    class TestClass {
      constructor(value) {
        this.value = value;
      }

      getValue() {
        return this.value;
      }
    }

    const instance = new TestClass('class value');
    expect(instance.getValue()).toBe('class value');

    // Test template literals
    const template = `Template literal with ${instance.value}`;
    expect(template).toBe('Template literal with class value');
  });

  test('Spread operator and array methods work', () => {
    // Test spread operator
    const array1 = [1, 2, 3];
    const array2 = [...array1, 4, 5];
    expect(array2).toEqual([1, 2, 3, 4, 5]);

    // Test array methods
    const doubled = array1.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
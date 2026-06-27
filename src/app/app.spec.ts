// @vitest-environment jsdom
import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should import App component correctly', () => {
    expect(App).toBeTruthy();
  });
});

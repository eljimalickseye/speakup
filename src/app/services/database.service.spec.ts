// @vitest-environment jsdom
import { describe, beforeEach, it, expect } from 'vitest';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get Gemini API key correctly', () => {
    const testKey = 'test-gemini-key-123';
    service.setGeminiApiKey(testKey);
    expect(service.getGeminiApiKey()).toBe(testKey);

    // Clean up
    service.setGeminiApiKey('');
  });

  it('should fall back to default API key if no key is in localStorage', () => {
    localStorage.removeItem('speak_gemini_api_key');
    const key = service.getGeminiApiKey();
    expect(key).toBe('AIzaSyBdPuo__e2rAhMSC4QhZqdw-KmwWhndSOs');
  });
});

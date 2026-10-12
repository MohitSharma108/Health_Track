'use strict';

const foodRecognitionService = require('../src/services/ai/foodRecognitionService');
const anthropicClient = require('../src/services/ai/anthropicClient');
const { ApiError } = require('../src/middleware/errorHandler');

describe('FoodRecognitionService - Production Reliability Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GROQ_API_KEY: 'test_groq_key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('1. Non-food photos (face, room, selfie) return items: [] and NEVER hallucinate food', async () => {
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockResolvedValue({
      items: [],
      notes: "No food detected in this photo. Please point the camera directly at your meal, plate, or beverage."
    });

    const result = await foodRecognitionService.analyzeFoodPhoto({
      imageBase64: 'fake_face_base64',
      mediaType: 'image/jpeg'
    });

    expect(result.items).toHaveLength(0);
    expect(result.notes).toContain('No food detected');
    // Ensure Oatmeal with Mixed Berries is NEVER returned
    expect(JSON.stringify(result)).not.toContain('Oatmeal with Mixed Berries');
    expect(JSON.stringify(result)).not.toContain('Scrambled Eggs');

    spy.mockRestore();
  });

  test('2. Multiple retries on non-food photos consistently return items: [] without switching to mock foods', async () => {
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockResolvedValue({
      items: [],
      notes: "No food detected in this photo. A human face is shown."
    });

    // Simulate clicking "Try again" 20 times in a row
    for (let i = 0; i < 20; i++) {
      const result = await foodRecognitionService.analyzeFoodPhoto({
        imageBase64: 'user_selfie_base64',
        mediaType: 'image/jpeg'
      });

      expect(result.items).toHaveLength(0);
      expect(result.items).toEqual([]);
      expect(result.notes).toContain('No food detected');
      expect(JSON.stringify(result)).not.toContain('Oatmeal');
      expect(JSON.stringify(result)).not.toContain('Scrambled Eggs');
    }

    spy.mockRestore();
  });

  test('3. Real food detection parses and sanitizes items with exact portions and macros', async () => {
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockResolvedValue({
      items: [
        {
          name: 'Steamed Rice',
          portionEstimate: '1 bowl (~150g)',
          portionGrams: 150,
          unit: 'g',
          calories: 195,
          protein: 4.2,
          carbs: 42,
          fat: 1.2,
          fibre: 1.5,
          confidence: 0.92
        },
        {
          name: 'Paneer Bhurji',
          portionEstimate: '1 serving (~100g)',
          portionGrams: 100,
          unit: 'g',
          calories: 220,
          protein: 16.5,
          carbs: 4,
          fat: 15.5,
          fibre: 1.2,
          confidence: 0.88
        }
      ],
      notes: 'Identified 2 items: Steamed Rice and Paneer Bhurji.'
    });

    const result = await foodRecognitionService.analyzeFoodPhoto({
      imageBase64: 'food_plate_base64',
      mediaType: 'image/jpeg'
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('Steamed Rice');
    expect(result.items[0].portionGrams).toBe(150);
    expect(result.items[0].calories).toBe(195);
    expect(result.items[1].name).toBe('Paneer Bhurji');
    expect(result.items[1].protein).toBe(16.5);
    expect(result.notes).toBe('Identified 2 items: Steamed Rice and Paneer Bhurji.');

    spy.mockRestore();
  });

  test('4. Rate-limit (429) errors throw ApiError rather than silently returning fake food', async () => {
    const rateLimitError = new ApiError(429, 'rate_limited', 'Rate limit reached for model');
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockRejectedValue(rateLimitError);

    await expect(
      foodRecognitionService.analyzeFoodPhoto({
        imageBase64: 'sample_base64',
        mediaType: 'image/jpeg'
      })
    ).rejects.toThrow('AI vision is momentarily busy');

    spy.mockRestore();
  });

  test('5. Non-rate-limit vision errors return clean error note and items: [] without fake mocks', async () => {
    const networkError = new Error('Connection timeout to Groq');
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockRejectedValue(networkError);

    const result = await foodRecognitionService.analyzeFoodPhoto({
      imageBase64: 'sample_base64',
      mediaType: 'image/jpeg'
    });

    expect(result.items).toHaveLength(0);
    expect(result.notes).toContain('Could not analyze photo');
    expect(JSON.stringify(result)).not.toContain('Oatmeal');
    expect(JSON.stringify(result)).not.toContain('Scrambled Eggs');

    spy.mockRestore();
  });

  test('6. When user provides explicit context note, note fallback works if image call errors', async () => {
    const networkError = new Error('Camera stream glitched');
    const spy = jest.spyOn(anthropicClient, 'askJSON').mockRejectedValue(networkError);

    const result = await foodRecognitionService.analyzeFoodPhoto({
      imageBase64: 'sample_base64',
      mediaType: 'image/jpeg',
      note: '2 roti and dal'
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('2 roti and dal');
    expect(result.notes).toContain('Estimated from your note');

    spy.mockRestore();
  });

  test('7. When no API keys exist, cleanly returns no-food notice instead of clock-based oatmeal', async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await foodRecognitionService.analyzeFoodPhoto({
      imageBase64: 'sample_base64',
      mediaType: 'image/jpeg'
    });

    expect(result.items).toHaveLength(0);
    expect(result.notes).toContain('No AI vision API key configured');
    expect(JSON.stringify(result)).not.toContain('Oatmeal with Mixed Berries');
  });
});

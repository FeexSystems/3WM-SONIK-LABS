module.exports = {
  GoogleGenAI: class MockGoogleGenAI {
    constructor() {}
    models = {
      generateContent: async () => ({ text: () => 'mock genai response' }),
    };
  },
};

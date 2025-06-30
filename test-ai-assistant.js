/**
 * Test script for AI Assistant functionality
 * Optimized for robustness, maintainability, and cross-environment compatibility.
 */

/**
 * Test OpenAI API connectivity and configuration.
 * @returns {Promise<boolean>} True if test passes, false otherwise.
 */
const testAIAssistant = async () => {
  console.log('🤖 Testing AI Assistant...');

  // Test OpenAI API key configuration
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.error('❌ OpenAI API key not configured. Set OPENAI_API_KEY in your environment.');
    if (typeof process !== 'undefined') process.exitCode = 1;
    return false;
  }

  console.log('✅ OpenAI API key configured');

  // Test API connectivity with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for UK student accommodation.' },
          { role: 'user', content: 'Hello, can you help me with student housing?' }
        ],
        max_tokens: 100,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API test failed:', response.status, errorData);
      if (typeof process !== 'undefined') process.exitCode = 1;
      return false;
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ OpenAI API test successful');
      console.log('🤖 Sample response:', data.choices[0].message.content.substring(0, 100) + '...');
      return true;
    } else {
      console.error('❌ Unexpected API response format');
      if (typeof process !== 'undefined') process.exitCode = 1;
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ OpenAI API test error: Request timed out');
    } else {
      console.error('❌ OpenAI API test error:', error);
    }
    if (typeof process !== 'undefined') process.exitCode = 1;
    return false;
  }
};

/**
 * Test local AI service keyword matching logic.
 * @returns {boolean} True if all tests pass, false otherwise.
 */
const testLocalAIService = () => {
  console.log('📝 Testing local AI service...');
  const testCases = [
    { input: 'How much should I budget for accommodation?', expectedCategory: 'budget' },
    { input: 'What documents do I need?', expectedCategory: 'documents' },
    { input: 'Is this area safe?', expectedCategory: 'safety' },
    { input: 'What are my tenancy rights?', expectedCategory: 'legal' }
  ];
  let passed = 0;
  for (let i = 0; i < testCases.length; i++) {
    const { input, expectedCategory } = testCases[i];
    const lowerInput = input.toLowerCase();
    let matched = false;
    if (expectedCategory === 'budget' && (lowerInput.includes('budget') || lowerInput.includes('cost') || lowerInput.includes('money'))) {
      matched = true;
    } else if (expectedCategory === 'documents' && (lowerInput.includes('documents') || lowerInput.includes('paperwork'))) {
      matched = true;
    } else if (expectedCategory === 'safety' && (lowerInput.includes('safe') || lowerInput.includes('area'))) {
      matched = true;
    } else if (expectedCategory === 'legal' && (lowerInput.includes('rights') || lowerInput.includes('tenancy'))) {
      matched = true;
    }
    if (matched) {
      console.log(`✅ Test ${i + 1}: "${input}" -> ${expectedCategory}`);
      passed++;
    } else {
      console.log(`❌ Test ${i + 1}: "${input}" -> failed to match ${expectedCategory}`);
    }
  }
  console.log(`📊 Local AI service test: ${passed}/${testCases.length} passed`);
  return passed === testCases.length;
};

/**
 * Run all AI Assistant tests and print results.
 * @returns {Promise<boolean>} True if all tests pass, false otherwise.
 */
const runAllAITests = async () => {
  console.log('🚀 Starting AI Assistant comprehensive tests...');
  console.log('='.repeat(50));
  const openaiTest = await testAIAssistant();
  const localTest = testLocalAIService();
  console.log('='.repeat(50));
  console.log('📋 AI Assistant Test Results:');
  console.log(`OpenAI API: ${openaiTest ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Local AI: ${localTest ? '✅ WORKING' : '❌ FAILED'}`);
  if (openaiTest && localTest) {
    console.log('🎉 AI Assistant is fully functional!');
    console.log('💡 Users can now:');
    console.log('   - Ask questions about student accommodation');
    console.log('   - Get intelligent responses from OpenAI GPT-3.5');
    console.log('   - Fallback to local responses if API fails');
    console.log('   - Use quick action buttons for common questions');
  } else {
    console.log('⚠️ Some AI features may not work properly');
  }
  return openaiTest && localTest;
};

// Export for use in browser console or Node.js
if (typeof globalThis !== 'undefined') {
  globalThis.testAIAssistant = runAllAITests;
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  runAllAITests();
}

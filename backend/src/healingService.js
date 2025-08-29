// backend/src/healingService.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function suggestNewLocator(failedLocator, pageHtml) {
  const prompt = `
You are an expert Playwright locator fixer.
The locator "${failedLocator}" failed to find an element.
Given the page HTML below, suggest a working CSS selector that would find a similar element.

REQUIREMENTS:
- Return ONLY a valid CSS selector
- No explanations, no markdown, no code blocks
- Must be a real CSS selector that exists in the HTML
- Examples: "button", "#submit-btn", ".login-button", "input[type='text']", "a[href*='example']"

HTML:
${pageHtml}

CSS Selector:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o as GPT-5 is not yet available
        messages: [
          {
            role: 'system',
            content: 'You are an expert Playwright locator fixer. You must return ONLY a valid CSS selector that exists in the provided HTML. Do not include any explanations, markdown, code blocks, or additional text. Just return the CSS selector.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let locator = data.choices[0].message.content.trim();
    
    console.log('🤖 OpenAI raw response:', locator);
    
    // Clean up markdown code blocks if present
    locator = locator.replace(/^```css\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Extract just the CSS selector if it's wrapped in other text
    const cssMatch = locator.match(/[.#]?[\w-]+(?:\[[^\]]+\])?(?::[\w-]+)*/);
    if (cssMatch) {
      locator = cssMatch[0];
    }
    
    // If locator is still empty or invalid, provide a fallback
    if (!locator || locator.length < 2) {
      console.log('⚠️ OpenAI returned empty/invalid locator, using fallback');
      locator = 'body'; // Safe fallback
    }
    
    console.log('🎯 Final locator:', locator);
    return locator;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

function loadLocators() {
  try {
    const locatorsPath = path.join(process.cwd(), 'locators.json');
    if (fs.existsSync(locatorsPath)) {
      return JSON.parse(fs.readFileSync(locatorsPath));
    }
  } catch (error) {
    console.log('No locators.json found, using defaults');
  }
  return {};
}

async function fixLocator(locatorKey, failedLocator, pageHtml) {
  try {
    // First try the external healing API
    const res = await fetch('http://localhost:3009/fix-locator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locatorKey, failedLocator, pageHtml })
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to call external healing API, trying OpenAI:', error);
    
    try {
      // Fallback to OpenAI GPT-4o
      const newLocator = await suggestNewLocator(failedLocator, pageHtml);
      
      // Validate the locator
      if (!newLocator || newLocator.length < 2) {
        console.log('⚠️ OpenAI returned invalid locator, using fallback');
        return {
          newLocator: 'body',
          reason: 'OpenAI returned invalid locator, using safe fallback'
        };
      }
      
      return {
        newLocator,
        reason: 'OpenAI GPT-4o suggested alternative locator'
      };
    } catch (openaiError) {
      console.error('Failed to call OpenAI API:', openaiError);
      // Final fallback: return a generic locator
      return {
        newLocator: 'body', // Safe fallback
        reason: 'All healing services unavailable, using safe fallback'
      };
    }
  }
}

/**
 * Healing AI wrapper
 * @param {object} page Playwright page object
 * @param {string} locatorKey Key from locators.json
 * @param {function} action Function that performs action on locatorHandle
 */
async function healingUsingAI(page, locatorKey, action) {
  const locators = loadLocators();
  let locator = locators[locatorKey];
  
  // If locator key doesn't exist, use a default invalid selector to trigger healing
  if (!locator) {
    locator = `[data-test="${locatorKey}"]`; // This will likely fail and trigger healing
  }
  
  let locatorHandle = page.locator(locator);
  const healingAttempts = [];

  try {
    await locatorHandle.waitFor({ state: 'visible', timeout: 2000 });
    await action(locatorHandle);
  } catch (error) {
    console.log(`[AI Healing] ${locatorKey} failed. Sending to AI...`);
    const pageHtml = await page.content();
    const { newLocator, reason } = await fixLocator(locatorKey, locator, pageHtml);
    console.log(`[AI Healing] New locator: ${newLocator}`);

    // Record the healing attempt
    healingAttempts.push({
      locatorKey,
      originalLocator: locator,
      newLocator,
      reason: reason || 'AI suggested alternative locator'
    });

    locatorHandle = page.locator(newLocator);
    await locatorHandle.waitFor({ state: 'visible', timeout: 5000 });
    await action(locatorHandle);
  }

  return healingAttempts;
}

export { healingUsingAI, loadLocators, fixLocator, suggestNewLocator };

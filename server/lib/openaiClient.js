/**
 * Shared OpenAI client — Azure OpenAI when AZURE_OPENAI_* is set, else standard OpenAI.
 */
import OpenAI, { AzureOpenAI } from 'openai';

let _client = null;

export function isAzureOpenAI() {
  return Boolean(
    process.env.AZURE_OPENAI_API_KEY?.trim() &&
    process.env.AZURE_OPENAI_ENDPOINT?.trim() &&
    process.env.AZURE_OPENAI_DEPLOYMENT?.trim(),
  );
}

export function hasLlmConfigured() {
  if (isAzureOpenAI()) {
    const k = process.env.AZURE_OPENAI_API_KEY?.trim();
    return Boolean(k && k.length > 10);
  }
  const k = process.env.OPENAI_API_KEY?.trim();
  return Boolean(k && !k.startsWith('your_') && k.length > 20);
}

export function getChatModel() {
  if (isAzureOpenAI()) return process.env.AZURE_OPENAI_DEPLOYMENT.trim();
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

export function getLlmProvider() {
  return isAzureOpenAI() ? 'azure_openai' : 'openai';
}

export function getOpenAIClient() {
  if (_client) return _client;

  if (isAzureOpenAI()) {
    let endpoint = process.env.AZURE_OPENAI_ENDPOINT.trim();
    if (!endpoint.endsWith('/')) endpoint += '/';
    _client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY.trim(),
      endpoint,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-12-01-preview',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT.trim(),
    });
  } else {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
  }

  return _client;
}

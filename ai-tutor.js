// Minimal stub to satisfy legacy script tag and avoid missing-module errors.
export async function checkOllamaStatus() {
  return { available: false, models: [], selected: null };
}

export async function getPronunciationFeedback() {
  return { feedback: '', corrections: [] };
}

export default { checkOllamaStatus, getPronunciationFeedback };

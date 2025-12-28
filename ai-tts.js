// Compatibility bridge for legacy script tag usage. Routes calls to TTSService.
import * as TTSService from './src/services/TTSService.js';

export async function speak(text, options = {}) {
	return TTSService.speak(text, options);
}

export async function checkServerHealth() {
	return TTSService.checkServerHealth();
}

export default { speak, checkServerHealth };
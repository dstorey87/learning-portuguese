# Voice Integration Plan (Essentials)

Goal: deliver working 2-way pt-PT voice now, without the broken VAD/STT server path.

## Current fix path
- Use **WebSpeechService** for STT (pt-PT) directly in AIChat; drop dependency on silero_vad/localhost:5000 for now.
- Use **TTSService** (Edge-TTS on localhost:3001) for playback; default Raquel, allow Duarte.
- Pronunciation scoring stays client-side (PronunciationAssessor/PhoneticScorer).

## Must-do tasks
1) AIChat voice mode: call WebSpeechService.listen + show interim/final transcripts; send transcript to AIAgent; stop using VoiceConversation/VAD.
2) Playback: apply speed/rate slider to TTS utterance; keep stop/cancel working.
3) UI: show mic state (listening/processing) and fall back gracefully if Web Speech unavailable.
4) Downloads: when a voice is downloaded/installed, refresh dropdown immediately.
5) Future (optional): revisit VAD/Whisper only after core path is stable and models are available.

## Testing quicklist
- Mic button starts/stops listening; transcript appears; AI responds with TTS.
- pt-PT voice output uses Edge-TTS; fallback message if server down.
- Pronunciation challenges allow continue even after fail; scores log to event stream.

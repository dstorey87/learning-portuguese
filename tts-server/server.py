"""Minimal Piper HTTP TTS endpoint for the bundled EU-PT model.

Endpoints:
- POST /tts {text, lang?, voiceKey?, modelUrl?} -> audio/wav
- GET /health -> 200 OK

Notes:
- Defaults to the Piper EU-PT tugão medium model used by the client.
- Performs SHA-256 validation on download, caches the model on disk.
- Enable CORS for browser clients (allowed origins via env var; '*' by default).
"""

import asyncio
import hashlib
import io
import os
import pathlib
import wave
from functools import lru_cache

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from piper import PiperVoice

DEFAULT_MODEL_URL = (
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/"
    "tug%C3%A3o/medium/pt_PT-tug%C3%A3o-medium.onnx"
)
DEFAULT_MODEL_SHA256 = (
    "223a7aaca69a155c61897e8ada7c3b13bc306e16c72dbb9c2fed733e2b0927d4"
)
DEFAULT_MODEL_PATH = pathlib.Path("c:/learning_portuguese/pt_PT-tugA3o-medium.onnx")

MODEL_URL = os.getenv("MODEL_URL", DEFAULT_MODEL_URL)
MODEL_SHA256 = os.getenv("MODEL_SHA256", DEFAULT_MODEL_SHA256)
MODEL_PATH = pathlib.Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))).resolve()
ALLOWED_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")

app = FastAPI(title="Piper EU-PT TTS", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def download_model(url: str, dest: pathlib.Path, expected_sha: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.content
    digest = hashlib.sha256(data).hexdigest()
    if expected_sha and digest.lower() != expected_sha.lower():
        raise RuntimeError(
            f"SHA mismatch for model: expected {expected_sha} got {digest}"
        )
    dest.write_bytes(data)


async def ensure_model() -> pathlib.Path:
    if MODEL_PATH.exists():
        return MODEL_PATH
    await download_model(MODEL_URL, MODEL_PATH, MODEL_SHA256)
    return MODEL_PATH


@lru_cache(maxsize=1)
def get_voice(model_path: pathlib.Path) -> PiperVoice:
    return PiperVoice.load(str(model_path))


@app.on_event("startup")
async def _startup() -> None:
    path = await ensure_model()
    get_voice(path)  # warm cache


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/tts")
async def tts(payload: dict) -> Response:
    text = (payload.get("text") or "").strip()
    lang = payload.get("lang") or "pt-PT"
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    path = await ensure_model()
    voice = get_voice(path)

    # Piper ignores lang/voiceKey for this single-model server; they are accepted for API symmetry.
    try:
        # Synthesize to in-memory WAV file
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
        audio_bytes = buffer.getvalue()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"synthesis failed: {exc}") from exc

    headers = {
        "X-Voice-Lang": lang,
        "X-Voice-Key": payload.get("voiceKey", "piper-pt-tugao-medium"),
    }
    return Response(content=audio_bytes, media_type="audio/wav", headers=headers)


if __name__ == "__main__":
    import uvicorn

    asyncio.run(ensure_model())
    uvicorn.run(
        "server:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False
    )

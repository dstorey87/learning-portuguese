"""
WebSocket Server for Real-time Curator Communication
Allows the admin console to communicate with the Python curator service.
"""

import asyncio
import json
import logging
import websockets
from typing import Dict, Set, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

# Handle relative imports
try:
    from .batch_curator import BatchCurator, BatchConfig, BatchProgress
    from .gpu_manager import GPUManager
except ImportError:
    from batch_curator import BatchCurator, BatchConfig, BatchProgress
    from gpu_manager import GPUManager

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """WebSocket message types."""

    # Server -> Client
    STATUS = "status"
    PROGRESS = "progress"
    CURRENT_WORD = "current_word"
    CANDIDATES = "candidates"
    SELECTED = "selected"
    LOG = "log"
    GPU = "gpu"
    ERROR = "error"
    COMPLETE = "complete"

    # Client -> Server
    START = "start"
    STOP = "stop"
    PAUSE = "pause"
    RESUME = "resume"
    CONFIG = "config"
    MANUAL_SELECT = "manual_select"
    MANUAL_REJECT = "manual_reject"


@dataclass
class WSMessage:
    """WebSocket message structure."""

    type: str
    data: Any
    timestamp: str = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "WSMessage":
        d = json.loads(data)
        return cls(**d)


class CuratorWebSocketServer:
    """
    WebSocket server for curator control.

    Features:
    - Real-time progress updates
    - GPU monitoring
    - Start/stop/pause controls
    - Manual image selection override
    """

    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.curator: Optional[BatchCurator] = None
        self.gpu_manager: Optional[GPUManager] = None
        self.is_running = False
        self.is_paused = False
        self._server = None
        self._curator_task = None
        self._gpu_monitor_task = None
        self._status_broadcast_task = None

    async def start(self):
        """Start the WebSocket server."""
        self._server = await websockets.serve(self.handle_client, self.host, self.port)

        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")

        # Start GPU monitoring
        self.gpu_manager = GPUManager()
        await self.gpu_manager.initialize()
        self._gpu_monitor_task = asyncio.create_task(self._monitor_gpu())

        await self._broadcast(MessageType.STATUS, {"status": "ready"})
        self._status_broadcast_task = asyncio.create_task(
            self._broadcast_status_periodically()
        )

    async def stop(self):
        """Stop the WebSocket server."""
        # Stop curator if running
        if self.curator:
            await self.curator.shutdown()

        # Cancel GPU monitoring
        if self._gpu_monitor_task:
            self._gpu_monitor_task.cancel()
        if self._status_broadcast_task:
            self._status_broadcast_task.cancel()

        # Close all client connections
        for client in self.clients.copy():
            await client.close()

        # Stop server
        if self._server:
            self._server.close()
            await self._server.wait_closed()

        logger.info("WebSocket server stopped")

    async def handle_client(
        self, websocket: websockets.WebSocketServerProtocol, path: str
    ):
        """Handle a client connection."""
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")

        # Send current status
        await self._send(
            websocket,
            MessageType.STATUS,
            {
                "status": "running" if self.is_running else "stopped",
                "paused": self.is_paused,
            },
        )

        try:
            async for message in websocket:
                await self._handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.discard(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def _handle_message(self, websocket, message: str):
        """Handle incoming client message."""
        try:
            msg = WSMessage.from_json(message)

            if msg.type == MessageType.START.value:
                await self._handle_start(msg.data)
            elif msg.type == MessageType.STOP.value:
                await self._handle_stop()
            elif msg.type == MessageType.PAUSE.value:
                await self._handle_pause()
            elif msg.type == MessageType.RESUME.value:
                await self._handle_resume()
            elif msg.type == MessageType.CONFIG.value:
                await self._handle_config(msg.data)
            elif msg.type == MessageType.MANUAL_SELECT.value:
                await self._handle_manual_select(msg.data)
            elif msg.type == MessageType.MANUAL_REJECT.value:
                await self._handle_manual_reject(msg.data)
            else:
                logger.warning(f"Unknown message type: {msg.type}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            await self._send(websocket, MessageType.ERROR, {"error": "Invalid JSON"})
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self._send(websocket, MessageType.ERROR, {"error": str(e)})

    async def _handle_start(self, config_data: Dict):
        """Handle start command."""
        if self.is_running:
            await self._broadcast(MessageType.ERROR, {"error": "Already running"})
            return

        # Create config from client data
        config = BatchConfig(
            vision_model=config_data.get("model", "llama3.2-vision:11b"),
            candidates_per_word=config_data.get("candidates", 3),
            gpu_throttle_percent=config_data.get("gpu_throttle", 75),
            resume_from_crash=config_data.get("resume_on_crash", True),
            min_score=config_data.get("min_score", 28),
            min_relevance=config_data.get("min_relevance", 7),
            use_vision=config_data.get("use_vision", True),
        )

        # Create and initialize curator
        self.curator = BatchCurator(config)
        self.curator.add_progress_callback(self._on_progress)
        self.curator.add_candidate_callback(self._on_candidates)
        self.curator.add_log_callback(self._on_log)

        if not await self.curator.initialize():
            await self._broadcast(
                MessageType.ERROR, {"error": "Failed to initialize curator"}
            )
            return

        self.is_running = True
        self.is_paused = False

        await self._broadcast(MessageType.STATUS, {"status": "running"})
        await self._broadcast(MessageType.LOG, {"message": "Curator started"})

        # Start curator in background
        self._curator_task = asyncio.create_task(self._run_curator())

    async def _handle_stop(self):
        """Handle stop command."""
        if not self.is_running:
            return

        if self.curator:
            self.curator._shutdown_requested = True
            await self.curator.shutdown()

        if self._curator_task:
            self._curator_task.cancel()

        self.is_running = False
        self.is_paused = False

        await self._broadcast(MessageType.STATUS, {"status": "stopped"})
        await self._broadcast(MessageType.LOG, {"message": "Curator stopped"})

    async def _handle_pause(self):
        """Handle pause command."""
        if not self.is_running or self.is_paused:
            return

        self.is_paused = True
        await self._broadcast(MessageType.STATUS, {"status": "paused"})
        await self._broadcast(MessageType.LOG, {"message": "Curator paused"})

    async def _handle_resume(self):
        """Handle resume command."""
        if not self.is_running or not self.is_paused:
            return

        self.is_paused = False
        await self._broadcast(MessageType.STATUS, {"status": "running"})
        await self._broadcast(MessageType.LOG, {"message": "Curator resumed"})

    async def _handle_config(self, config_data: Dict):
        """Handle config update."""
        if self.curator:
            # Update config dynamically
            if "candidates" in config_data:
                self.curator.config.candidates_per_word = config_data["candidates"]
            if "min_score" in config_data:
                self.curator.config.min_score = config_data["min_score"]

            await self._broadcast(MessageType.LOG, {"message": "Config updated"})

    async def _handle_manual_select(self, data: Dict):
        """Handle manual image selection."""
        # This allows admin to override AI selection
        image_id = data.get("image_id")
        if image_id and self.curator:
            self.curator.library.select_image(image_id, actor="admin")
            await self._broadcast(
                MessageType.LOG, {"message": f"Manually selected image {image_id}"}
            )

    async def _handle_manual_reject(self, data: Dict):
        """Handle manual image rejection."""
        image_id = data.get("image_id")
        reason = data.get("reason", "Manual rejection")

        if image_id and self.curator:
            self.curator.library.reject_image(image_id, reason, actor="admin")
            await self._broadcast(
                MessageType.LOG, {"message": f"Manually rejected image {image_id}"}
            )

    async def _run_curator(self):
        """Run the curator process."""
        try:
            results = await self.curator.run()
            await self._broadcast(
                MessageType.LOG, {"message": f"Batch complete: {results}"}
            )
            await self._broadcast(MessageType.COMPLETE, results)
        except asyncio.CancelledError:
            logger.info("Curator task cancelled")
        except Exception as e:
            logger.error(f"Curator error: {e}")
            await self._broadcast(MessageType.ERROR, {"error": str(e)})
        finally:
            self.is_running = False
            await self._broadcast(MessageType.STATUS, {"status": "stopped"})

    def _on_progress(self, progress: BatchProgress):
        """Callback for curator progress updates."""
        progress_payload = progress.to_dict()
        asyncio.create_task(self._broadcast(MessageType.PROGRESS, progress_payload))

        if progress.current_word:
            asyncio.create_task(
                self._broadcast(
                    MessageType.CURRENT_WORD,
                    {
                        "word": progress.current_word,
                        "translation": progress.current_translation,
                        "lesson": progress.current_lesson,
                    },
                )
            )

    def _on_candidates(self, payload: dict):
        """Forward candidate updates to clients."""
        asyncio.create_task(
            self._broadcast(MessageType.CANDIDATES, payload.get("candidates", []))
        )

    def _on_log(self, payload: dict):
        """Forward log events to clients."""
        asyncio.create_task(self._broadcast(MessageType.LOG, payload))

    async def _broadcast_status_periodically(self):
        """Send periodic status to keep clients synced."""
        while True:
            try:
                await self._broadcast(
                    MessageType.STATUS,
                    {"status": "running" if self.is_running else "stopped"},
                )
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Status heartbeat error: {e}")
                await asyncio.sleep(5)

    async def _monitor_gpu(self):
        """Monitor GPU stats and broadcast periodically."""
        while True:
            try:
                if self.gpu_manager:
                    stats = self.gpu_manager.get_stats()
                    await self._broadcast(MessageType.GPU, stats)
                await asyncio.sleep(2)  # Update every 2 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"GPU monitor error: {e}")
                await asyncio.sleep(5)

    async def _send(self, websocket, msg_type: MessageType, data: Any):
        """Send message to specific client."""
        msg = WSMessage(type=msg_type.value, data=data)
        try:
            await websocket.send(msg.to_json())
        except websockets.exceptions.ConnectionClosed:
            pass

    async def _broadcast(self, msg_type: MessageType, data: Any):
        """Broadcast message to all clients."""
        if not self.clients:
            return

        msg = WSMessage(type=msg_type.value, data=data)
        message = msg.to_json()

        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)

        self.clients -= disconnected


async def run_server(host: str = "localhost", port: int = 8765):
    """Run the WebSocket server."""
    server = CuratorWebSocketServer(host, port)

    try:
        await server.start()
        # Keep running until interrupted
        await asyncio.Future()
    except asyncio.CancelledError:
        pass
    finally:
        await server.stop()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Curator WebSocket Server")
    parser.add_argument("--host", default="localhost", help="Host to bind")
    parser.add_argument("--port", type=int, default=8765, help="Port to bind")
    parser.add_argument("-v", "--verbose", action="store_true")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    asyncio.run(run_server(args.host, args.port))

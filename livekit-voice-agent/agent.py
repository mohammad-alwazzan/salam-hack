import json
import logging
import os

import httpx
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.inference import LLM, STT, TTS
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

_fmt = logging.Formatter("%(asctime)s [TOOL] %(message)s", datefmt="%H:%M:%S")

_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(_fmt)

_file_handler = logging.FileHandler("tool_calls.log", encoding="utf-8")
_file_handler.setFormatter(_fmt)

logger = logging.getLogger("mizan.tools")
logger.setLevel(logging.DEBUG)
logger.addHandler(_stream_handler)
logger.addHandler(_file_handler)
logger.propagate = False  # don't let livekit's root logger swallow or duplicate our records

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")


# ---------------------------------------------------------------------------
# HTTP helpers — thin RPC wrappers around the backend REST API
# ---------------------------------------------------------------------------

async def _get(path: str) -> dict | list:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{BACKEND_URL}{path}")
        r.raise_for_status()
        return r.json()


async def _post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(f"{BACKEND_URL}{path}", json=body)
        r.raise_for_status()
        return r.json()


def _log_tool(name: str, inputs: dict, output: str) -> None:
    logger.debug(
        "\n┌─ TOOL: %s\n│  IN : %s\n└─ OUT: %s",
        name,
        json.dumps(inputs, ensure_ascii=False),
        output,
    )


# ---------------------------------------------------------------------------
# Agent definition with tools
# ---------------------------------------------------------------------------

class MizanAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are Mizan (ميزان), a friendly bilingual (Arabic/English) financial assistant. "
                "You help users check account balances, view and pay bills, and make transfers. "
                "Always confirm the details with the user before executing any financial action. "
                "Respond in whichever language the user speaks. Keep responses short and natural "
                "since this is a voice interface."
            ),
            llm=LLM(model="openai/gpt-4o"),
            stt=STT(model="deepgram/nova-3"),
            tts=TTS(model="elevenlabs/eleven_multilingual_v2"),
            vad=silero.VAD.load(),
            turn_handling={"turn_detection": MultilingualModel()},
        )

    # ------------------------------------------------------------------
    # Bank accounts
    # ------------------------------------------------------------------

    @function_tool(description="List all bank accounts and their current balances.")
    async def get_bank_accounts(self) -> str:
        data = await _get("/bank-accounts")
        result = json.dumps(data)
        _log_tool("get_bank_accounts", {}, result)
        return result

    @function_tool(description="Get details for a single bank account by its ID.")
    async def get_bank_account(self, account_id: int) -> str:
        """
        Args:
            account_id: The unique numeric ID of the bank account.
        """
        data = await _get(f"/bank-accounts/{account_id}")
        result = json.dumps(data)
        _log_tool("get_bank_account", {"account_id": account_id}, result)
        return result

    # ------------------------------------------------------------------
    # Bills
    # ------------------------------------------------------------------

    @function_tool(description="List all bills, both paid and pending.")
    async def get_bills(self) -> str:
        data = await _get("/bills")
        result = json.dumps(data)
        _log_tool("get_bills", {}, result)
        return result

    @function_tool(
        description=(
            "Pay a specific bill from a bank account. "
            "Only call this after the user has explicitly confirmed they want to pay."
        )
    )
    async def pay_bill(self, bill_id: int, bank_account_id: int) -> str:
        """
        Args:
            bill_id: The ID of the bill to pay.
            bank_account_id: The ID of the bank account to deduct from.
        """
        inputs = {"bill_id": bill_id, "bank_account_id": bank_account_id}
        data = await _post(f"/bills/{bill_id}/pay", {"bankAccountId": bank_account_id})
        result = json.dumps(data)
        _log_tool("pay_bill", inputs, result)
        return result

    # ------------------------------------------------------------------
    # Transfers
    # ------------------------------------------------------------------

    @function_tool(description="Get a history of all past transfers.")
    async def get_transfers(self) -> str:
        data = await _get("/transfers")
        result = json.dumps(data)
        _log_tool("get_transfers", {}, result)
        return result

    @function_tool(
        description=(
            "Execute a money transfer from a bank account to a recipient. "
            "Only call this after the user has explicitly confirmed the amount and recipient."
        )
    )
    async def execute_transfer(
        self,
        from_bank_account_id: int,
        amount: float,
        recipient: str,
        note: str = "",
    ) -> str:
        """
        Args:
            from_bank_account_id: ID of the bank account to deduct from.
            amount: Positive amount to transfer.
            recipient: Name or description of the recipient (e.g. 'Mama', 'Ahmed').
            note: Optional memo attached to the transfer.
        """
        inputs = {
            "from_bank_account_id": from_bank_account_id,
            "amount": amount,
            "recipient": recipient,
            "note": note,
        }
        payload: dict = {
            "fromBankAccountId": from_bank_account_id,
            "amount": amount,
            "recipient": recipient,
        }
        if note:
            payload["note"] = note
        data = await _post("/transfers", payload)
        result = json.dumps(data)
        _log_tool("execute_transfer", inputs, result)
        return result


# ---------------------------------------------------------------------------
# LiveKit entrypoint
# ---------------------------------------------------------------------------

async def entrypoint(ctx: JobContext):
    await ctx.connect()

    session = AgentSession()
    await session.start(agent=MizanAgent(), room=ctx.room)

    await session.generate_reply(
        instructions="Greet the user warmly and ask how you can help with their finances today."
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

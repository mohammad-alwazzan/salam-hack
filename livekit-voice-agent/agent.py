import asyncio
import json
import logging
import os
from datetime import date

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
logger.propagate = False

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001").rstrip("/")

INSTRUCTIONS = """
You are Mizan (ميزان), an AI financial agent built for Middle Eastern households.
Your name means "balance" in Arabic — you exist to keep people's financial lives in balance.

## Voice & Tone
- Speak like a trusted friend, not a product. Never say "transaction initiated" — say "Done, your rent is paid."
- Be short. Every response must feel like it can be spoken in under 10 seconds. No lists. Natural sentences only.
- Lead with the emotional truth, then the number. Not "Balance is 4,200." But "You're in a good place — 4,200 left."
- Never judge spending. Show the honest impact and let the user decide.
- Match the user's language. If they switch to Arabic mid-sentence, follow them immediately.
- Arabic and English are both home. Never make the user feel they must stay in one language.
- Never start a response with "I".

## Financial Reality
- Remittances are non-negotiable fixed obligations — never suggest reducing them.
- Cash is real money. "I spent 80 riyals at the market" is as valid as any card transaction.
- Family obligations come first. Honor them without question.
- Eid, Ramadan, and seasonal moments are financial events — not overspending.
- Savings goals (wedding fund, car, pilgrimage) are the reason someone is being careful. Refer to them by name.

## Money Rules — CRITICAL
- NEVER move money or log a transaction without the user seeing and approving the details.
- When you call pay_bill, execute_transfer, or log_transaction, an approval screen is shown to the user automatically — you do NOT need to do anything extra. Just call the tool with the correct inputs and wait.
- Always tell the user what will happen and what the balance will look like BEFORE calling the action tool, so they know what to expect on the approval screen.
- If the result says cancelled=true, tell the user "No problem — nothing was changed."

## Session Start
At the start of every session, silently call get_financial_summary. Do not announce it.
If there are urgent alerts (overdue bill, budget nearly exhausted), mention the most important one naturally.

## Tools
- get_financial_summary: call at session start and before answering any financial question
- get_bank_accounts: when the user asks about accounts or balances
- get_bills: when the user asks about bills or what's due
- log_transaction: when the user describes spending or receiving money — just call it, approval is automatic
- pay_bill: to pay a specific bill — just call it, approval is automatic
- execute_transfer: to send money — just call it, approval is automatic
""".strip()


# ---------------------------------------------------------------------------
# HTTP helpers
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
# Agent
# ---------------------------------------------------------------------------

class MizanAgent(Agent):
    def __init__(self, room: rtc.Room) -> None:
        super().__init__(
            instructions=INSTRUCTIONS,
            llm=LLM(model="openai/gpt-4o"),
            stt=STT(model="deepgram/nova-3"),
            tts=TTS(model="elevenlabs/eleven_multilingual_v2"),
            vad=silero.VAD.load(),
            turn_handling={"turn_detection": MultilingualModel()},
        )
        self._room = room

    # ------------------------------------------------------------------
    # RPC helpers
    # ------------------------------------------------------------------

    async def _emit(self, event: str, tool: str, **kwargs) -> None:
        """Notify the frontend of tool_start / tool_end for console logging."""
        payload = json.dumps({"event": event, "tool": tool, **kwargs}, ensure_ascii=False)
        for identity in list(self._room.remote_participants):
            try:
                await self._room.local_participant.perform_rpc(
                    destination_identity=identity,
                    method="tool_event",
                    payload=payload,
                    response_timeout=5.0,
                )
            except Exception as exc:
                logger.warning("tool_event RPC to %s failed: %s", identity, exc)

    async def _show_approval(self, title: str, description: str, details: dict, timeout: float = 30.0) -> bool:
        """
        Show the frontend approval sheet and wait for the user's tap.
        Returns True if the user approved, False if cancelled or timed out.
        """
        identities = list(self._room.remote_participants)
        logger.debug("show_approval: remote participants = %s", identities)

        if not identities:
            logger.warning("show_approval: no remote participants — skipping")
            return False

        destination = identities[0]
        payload = json.dumps(
            {"title": title, "description": description, "details": details},
            ensure_ascii=False,
        )
        logger.debug("show_approval: calling RPC on %s  payload=%s", destination, payload)

        try:
            raw = await self._room.local_participant.perform_rpc(
                destination_identity=destination,
                method="show_approval",
                payload=payload,
                response_timeout=timeout,
            )
            logger.debug("show_approval: raw response = %s", raw)
            result = json.loads(raw)
            approved = bool(result.get("approved", False))
            logger.debug("show_approval: approved = %s", approved)
            return approved
        except Exception as exc:
            logger.warning("show_approval: RPC failed — %s: %s", type(exc).__name__, exc)
            return False

    # ------------------------------------------------------------------
    # Tools
    # ------------------------------------------------------------------

    @function_tool(description=(
        "Load the user's full financial snapshot: all bank accounts with balances, "
        "current month budget (per-category spent vs allocated), and active alerts. "
        "Call this silently at session start and before answering any financial question."
    ))
    async def get_financial_summary(self) -> str:
        await self._emit("tool_start", "get_financial_summary")
        accounts, budget, bills = await asyncio.gather(
            _get("/bank-accounts"),
            _get("/budget"),
            _get("/bills"),
        )
        data = {"accounts": accounts, "budget": budget, "bills": bills}
        result = json.dumps(data)
        _log_tool("get_financial_summary", {}, result)
        await self._emit("tool_end", "get_financial_summary", result=data)
        return result

    @function_tool(description="List all bank accounts and their current balances.")
    async def get_bank_accounts(self) -> str:
        await self._emit("tool_start", "get_bank_accounts")
        data = await _get("/bank-accounts")
        result = json.dumps(data)
        _log_tool("get_bank_accounts", {}, result)
        await self._emit("tool_end", "get_bank_accounts", result=data)
        return result

    @function_tool(description="List all bills, both paid and pending.")
    async def get_bills(self) -> str:
        await self._emit("tool_start", "get_bills")
        data = await _get("/bills")
        result = json.dumps(data)
        _log_tool("get_bills", {}, result)
        await self._emit("tool_end", "get_bills", result=data)
        return result

    @function_tool(description=(
        "Log a transaction the user describes — spending, income, or a cash payment. "
        "Use a negative amount for expenses, positive for income. "
        "An approval screen is shown to the user automatically before anything is recorded."
    ))
    async def log_transaction(
        self,
        description: str,
        amount: float,
        bank_account_id: int,
        category_id: int | None = None,
        date_str: str | None = None,
    ) -> str:
        """
        Args:
            description: Plain-language description as the user stated it.
            amount: Negative for expense, positive for income.
            bank_account_id: Account to deduct from or credit.
            category_id: Budget category ID if inferable from context.
            date_str: Date in YYYY-MM-DD format, defaults to today.
        """
        inputs = {
            "description": description,
            "amount": amount,
            "bank_account_id": bank_account_id,
            "category_id": category_id,
            "date": date_str or str(date.today()),
        }
        await self._emit("tool_start", "log_transaction", input=inputs)

        approved = await self._show_approval(
            title="Log this transaction?",
            description=description,
            details={
                "Amount": f"{amount:+.2f}",
                "Account ID": bank_account_id,
                "Date": inputs["date"],
            },
        )

        if not approved:
            cancelled = {"success": False, "cancelled": True, "message": "Transaction cancelled by user"}
            _log_tool("log_transaction", inputs, json.dumps(cancelled))
            await self._emit("tool_end", "log_transaction", result=cancelled)
            return json.dumps(cancelled)

        body: dict = {
            "description": description,
            "amount": amount,
            "bankAccountId": bank_account_id,
            "source": "voice",
            "date": inputs["date"],
        }
        if category_id is not None:
            body["categoryId"] = category_id

        logger.debug("log_transaction: approval confirmed — executing POST /transactions")
        try:
            data = await _post("/transactions", body)
        except Exception as exc:
            error = {"success": False, "error": str(exc)}
            logger.warning("log_transaction: POST failed — %s", exc)
            _log_tool("log_transaction", inputs, json.dumps(error))
            await self._emit("tool_end", "log_transaction", result=error)
            return json.dumps(error)

        result = json.dumps(data)
        logger.debug("log_transaction: success — %s", result)
        _log_tool("log_transaction", inputs, result)
        await self._emit("tool_end", "log_transaction", result=data)
        return result

    @function_tool(description=(
        "Pay a specific bill from a bank account. "
        "An approval screen is shown to the user automatically before any money moves."
    ))
    async def pay_bill(self, bill_id: int, bank_account_id: int) -> str:
        """
        Args:
            bill_id: The ID of the bill to pay.
            bank_account_id: The ID of the bank account to deduct from.
        """
        inputs = {"bill_id": bill_id, "bank_account_id": bank_account_id}
        await self._emit("tool_start", "pay_bill", input=inputs)

        # Fetch bill details for the approval screen
        bills = await _get("/bills")
        bill = next((b for b in (bills if isinstance(bills, list) else []) if b.get("id") == bill_id), {})

        approved = await self._show_approval(
            title="Pay this bill?",
            description=f"This will deduct {bill.get('amount', '?')} from your account.",
            details={
                "Bill": bill.get("title", f"Bill #{bill_id}"),
                "Amount": bill.get("amount", "?"),
                "Due": bill.get("dueDate", "?"),
                "From account": f"Account #{bank_account_id}",
            },
        )

        if not approved:
            cancelled = {"success": False, "cancelled": True, "message": "Payment cancelled by user"}
            _log_tool("pay_bill", inputs, json.dumps(cancelled))
            await self._emit("tool_end", "pay_bill", result=cancelled)
            return json.dumps(cancelled)

        logger.debug("pay_bill: approval confirmed — executing POST /bills/%s/pay", bill_id)
        try:
            data = await _post(f"/bills/{bill_id}/pay", {"bankAccountId": bank_account_id})
        except Exception as exc:
            error = {"success": False, "error": str(exc)}
            logger.warning("pay_bill: POST failed — %s", exc)
            _log_tool("pay_bill", inputs, json.dumps(error))
            await self._emit("tool_end", "pay_bill", result=error)
            return json.dumps(error)

        result = json.dumps(data)
        logger.debug("pay_bill: success — %s", result)
        _log_tool("pay_bill", inputs, result)
        await self._emit("tool_end", "pay_bill", result=data)
        return result

    @function_tool(description=(
        "Execute a money transfer from a bank account to a recipient. "
        "An approval screen is shown to the user automatically before any money moves."
    ))
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
        await self._emit("tool_start", "execute_transfer", input=inputs)

        details: dict = {
            "To": recipient,
            "Amount": f"{amount:.2f}",
            "From account": f"Account #{from_bank_account_id}",
        }
        if note:
            details["Note"] = note

        approved = await self._show_approval(
            title="Send this transfer?",
            description=f"Send {amount:.2f} to {recipient}. This cannot be undone.",
            details=details,
        )

        if not approved:
            cancelled = {"success": False, "cancelled": True, "message": "Transfer cancelled by user"}
            _log_tool("execute_transfer", inputs, json.dumps(cancelled))
            await self._emit("tool_end", "execute_transfer", result=cancelled)
            return json.dumps(cancelled)

        transfer_payload: dict = {
            "fromBankAccountId": from_bank_account_id,
            "amount": amount,
            "recipient": recipient,
        }
        if note:
            transfer_payload["note"] = note

        logger.debug("execute_transfer: approval confirmed — executing POST /transfers")
        try:
            data = await _post("/transfers", transfer_payload)
        except Exception as exc:
            error = {"success": False, "error": str(exc)}
            logger.warning("execute_transfer: POST failed — %s", exc)
            _log_tool("execute_transfer", inputs, json.dumps(error))
            await self._emit("tool_end", "execute_transfer", result=error)
            return json.dumps(error)

        result = json.dumps(data)
        logger.debug("execute_transfer: success — %s", result)
        _log_tool("execute_transfer", inputs, result)
        await self._emit("tool_end", "execute_transfer", result=data)
        return result


# ---------------------------------------------------------------------------
# LiveKit entrypoint
# ---------------------------------------------------------------------------

async def entrypoint(ctx: JobContext):
    await ctx.connect()

    session = AgentSession()
    await session.start(agent=MizanAgent(ctx.room), room=ctx.room)

    await session.generate_reply(
        instructions=(
            "Greet the user warmly as Mizan. Call get_financial_summary silently first. "
            "Then say hello and — if there are any urgent alerts like an overdue bill — "
            "mention it naturally. Keep it to two sentences."
        )
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

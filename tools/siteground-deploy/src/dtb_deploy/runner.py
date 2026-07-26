from __future__ import annotations

import asyncio
import shlex
from dataclasses import dataclass
from pathlib import Path
from typing import Awaitable, Callable, Sequence

LogSink = Callable[[str, str], Awaitable[None]]


@dataclass(slots=True)
class CommandResult:
    command: tuple[str, ...]
    returncode: int
    stdout: str
    stderr: str


class CommandError(RuntimeError):
    def __init__(self, result: CommandResult):
        self.result = result
        super().__init__(f"Command failed ({result.returncode}): {shlex.join(result.command)}")


async def run_command(
    command: Sequence[str],
    *,
    cwd: Path | None = None,
    sink: LogSink | None = None,
    check: bool = True,
    input_text: str | None = None,
) -> CommandResult:
    if sink:
        await sink("command", shlex.join(command))
    process = await asyncio.create_subprocess_exec(
        *command,
        cwd=str(cwd) if cwd else None,
        stdin=asyncio.subprocess.PIPE if input_text is not None else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout_bytes, stderr_bytes = await process.communicate(
        input_text.encode("utf-8") if input_text is not None else None
    )
    stdout = stdout_bytes.decode("utf-8", errors="replace")
    stderr = stderr_bytes.decode("utf-8", errors="replace")
    if sink:
        for line in stdout.splitlines():
            await sink("stdout", line)
        for line in stderr.splitlines():
            await sink("stderr", line)
    result = CommandResult(tuple(command), process.returncode, stdout, stderr)
    if check and result.returncode != 0:
        raise CommandError(result)
    return result

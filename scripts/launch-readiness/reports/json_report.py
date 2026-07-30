"""JSON report writer — machine-readable output for CI or downstream tooling."""

from __future__ import annotations

import json
from pathlib import Path

from reports.models import RunReport


def write_json_report(report: RunReport, path: Path) -> Path:
    payload = {
        "environment": report.environment,
        "started_at": report.started_at.isoformat(),
        "finished_at": report.finished_at.isoformat() if report.finished_at else None,
        "duration_s": round(report.duration_s, 3),
        "overall_status": report.overall_status.value,
        "readiness_label": report.readiness_label,
        "score": report.score,
        "stages": [
            {
                "name": stage.name,
                "status": stage.status.value,
                "duration_s": round(stage.duration_s, 3),
                "steps": [
                    {
                        "name": step.name,
                        "status": step.status.value,
                        "detail": step.detail,
                        "duration_s": round(step.duration_s, 3),
                        "evidence": step.evidence,
                    }
                    for step in stage.steps
                ],
            }
            for stage in report.stages
        ],
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path

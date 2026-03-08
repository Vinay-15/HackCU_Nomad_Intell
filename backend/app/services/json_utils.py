
import json
import re


class JsonExtractionError(ValueError):
    pass


TRAILING_COMMA_PATTERN = re.compile(r",\s*([}\]])")


def extract_json_block(text: str) -> str:
    without_fences = re.sub(r"```json|```", "", text).strip()
    object_start = without_fences.find("{")
    object_end = without_fences.rfind("}")
    if object_start != -1 and object_end != -1 and object_end > object_start:
        return without_fences[object_start : object_end + 1]

    array_start = without_fences.find("[")
    array_end = without_fences.rfind("]")
    if array_start != -1 and array_end != -1 and array_end > array_start:
        return without_fences[array_start : array_end + 1]

    raise JsonExtractionError("Model response did not contain JSON.")


def repair_common_json_issues(text: str) -> str:
    repaired = TRAILING_COMMA_PATTERN.sub(r"\1", text)
    repaired = repaired.replace("“", '"').replace("”", '"')
    repaired = repaired.replace("‘", "'").replace("’", "'")
    repaired = repaired.replace("	", " ")
    return repaired


def parse_model_json(text: str):
    block = extract_json_block(text)
    try:
        return json.loads(block)
    except json.JSONDecodeError:
        repaired = repair_common_json_issues(block)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError as exc:
            raise JsonExtractionError(
                f"Invalid JSON from ORACLE: {exc.msg} at line {exc.lineno} column {exc.colno}"
            ) from exc

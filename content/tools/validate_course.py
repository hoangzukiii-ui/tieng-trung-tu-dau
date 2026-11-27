import json
import re
import sys
import unicodedata
import wave
from array import array
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator

content = Path(sys.argv[1])
course = json.loads((content / "course.json").read_text(encoding="utf-8"))
schema = json.loads((content / "course.schema.json").read_text(encoding="utf-8"))
Draft202012Validator.check_schema(schema)
Draft202012Validator(schema).validate(course)

lessons = course["lessons"]
item_by_id = {item["id"]: item for item in course["items"]}
assert len(lessons) == 15 and len(course["modules"]) == 3
assert len(item_by_id) == len(course["items"])
assert all(len(module["lessonIds"]) == 5 for module in course["modules"])
assert [lid for module in course["modules"] for lid in module["lessonIds"]] == [l["id"] for l in lessons]

used_ids = set()
clips = set()
listen_clips = set()
counts = Counter()
answer_positions = Counter()
learned_items = set()
completed = set()


def unique(identifier):
    assert identifier not in used_ids, identifier
    used_ids.add(identifier)


for module in course["modules"]:
    unique(module["id"])
for item in course["items"]:
    unique(item["id"])
    assert re.search(r"[\u4e00-\u9fff]", item["hanzi"]), item["id"]
    assert not re.search(r"[0-9\u4e00-\u9fff]", item["pinyin"]), item["id"]
    assert unicodedata.is_normalized("NFC", item["pinyin"]), item["id"]
    assert (content / item["audio"]).is_file(), item["id"]
    clip = item["audio"]
    if clip not in clips:
        with wave.open(str(content / clip)) as wav:
            assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 22050), clip
            assert wav.getnframes() >= wav.getframerate() // 4, clip
            samples = array("h", wav.readframes(wav.getnframes()))
            assert max(map(abs, samples)) > 1000, clip
        clips.add(clip)
for lesson in lessons:
    unique(lesson["id"])
    assert set(lesson["prerequisiteIds"]) <= completed, lesson["id"]
    completed.add(lesson["id"])
    assert 4 <= len(lesson["itemIds"]) <= 8 and len(lesson["exercises"]) >= 4
    assert any(item_by_id[i]["hanzi"].endswith(("。", "！", "？")) for i in lesson["itemIds"])
    learned_items.update(lesson["itemIds"])
    assert learned_items <= item_by_id.keys()
    assert any(q["type"] == "audio_choice" for q in lesson["exercises"])
    for question in lesson["exercises"]:
        unique(question["id"])
        kind = question["type"]
        counts[kind] += 1
        assert set(question["itemIds"]) <= learned_items
        choice_ids = []
        choice_labels = set()
        for choice in question["choices"]:
            unique(choice["id"])
            choice_ids.append(choice["id"])
            assert choice["label"] not in choice_labels
            choice_labels.add(choice["label"])
            if "itemId" in choice:
                assert choice["itemId"] in learned_items
        answers = question["answerIds"]
        assert set(answers) <= set(choice_ids)
        if kind == "order":
            assert set(answers) == set(choice_ids) and answers != choice_ids
        else:
            assert len(answers) == 1
            answer_positions[choice_ids.index(answers[0]) + 1] += 1
        if kind in ("audio_choice", "tone_choice"):
            source, = question["itemIds"]
            item = item_by_id[source]
            assert item["hanzi"] not in question["promptVi"]
            listen_clips.add(item["audio"])
            if kind == "audio_choice":
                assert [c["id"] for c in question["choices"] if c["itemId"] == source] == answers
                assert all(c["label"] == item_by_id[c["itemId"]]["hanzi"] for c in question["choices"])
assert learned_items == item_by_id.keys()
assert set((content / "audio").glob("*.wav")) == {content / clip for clip in clips}
assert set(answer_positions) == {1, 2, 3, 4}
print(f"PASS schema, ID, prerequisites, answer keys, {len(clips)} offline PCM WAV files")
print(f"{len(lessons)} lessons, {len(item_by_id)} items, {sum(counts.values())} questions", dict(counts))
print(f"{len(listen_clips)} distinct clips in listening questions, correct positions", dict(sorted(answer_positions.items())))

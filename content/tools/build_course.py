import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = Path(sys.argv[1]).resolve()
TITLES = ["Âm và chào hỏi", "Giao tiếp hằng ngày", "Đi chơi và ăn uống"]
AUDIO_TARGETS = [2, 1, 5, 3, 4, 2, 6, 6, 5, 6, 5, 5, 6, 5, 4]
ORDER_HINTS = [
    "Xếp câu «Xin chào, cảm ơn bạn!».",
    "Xếp câu «Cảm ơn, tạm biệt!».",
    "Xếp câu «Bạn tên là gì?».",
    "Xếp ba số từ 8 đến 10 theo thứ tự tăng dần.",
    "Xếp câu «Rất vui được gặp bạn».",
    "Xếp câu «Mình 20 tuổi».",
    "Xếp câu «Nhà mình có ba người».",
    "Xếp câu «Bây giờ là mấy giờ?».",
    "Xếp câu «Bạn có ở nhà không?».",
    "Xếp câu «Cùng đi uống nước nhé».",
    "Xếp câu «Cho mình một ly trà».",
    "Xếp câu «Cái này bao nhiêu tiền?».",
    "Xếp câu «Nhà ga ở đâu?».",
    "Xếp câu theo mẫu chủ ngữ → thời gian → hành động: «Chiều ba giờ mình gặp nhau nhé».",
    "Xếp câu «Mình đi quán ăn trước, rồi đến nhà ga».",
]


def dump(name, data):
    (CONTENT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def audio_path(hanzi):
    digest = hashlib.sha256(hanzi.encode("utf-8")).hexdigest()[:20]
    return f"audio/{digest}.wav"


def question(lesson_id, number, kind, prompt, sources, labels, correct, feedback, references=None):
    question_id = f"{lesson_id}-q{number:02}"
    choices = []
    for i, label in enumerate(labels):
        choice = {"id": f"{question_id}-c{i + 1:02}", "label": label}
        if references:
            choice["itemId"] = references[i]
        choices.append(choice)
    answer_ids = [choices[i]["id"] for i in correct]
    # Rotating display positions keeps answer IDs stable across edits.
    position = (int(lesson_id[-2:]) + number - min(correct)) % len(choices)
    if kind == "order" and position == 0:
        position = 1
    choices = choices[-position:] + choices[:-position] if position else choices
    return dict(id=question_id, type=kind, promptVi=prompt, itemIds=sources, choices=choices,
                answerIds=answer_ids, explanationVi=feedback)


def item_example(item):
    return f'{item["hanzi"]} ({item["pinyin"]}) → {item["vi"]}'


def make_course():
    modules = [dict(id=f"module-{i + 1}", title=title, lessonIds=[]) for i, title in enumerate(TITLES)]
    course = dict(schemaVersion=1, modules=modules, lessons=[], items=[])
    blocks = re.split(r"\n\s*\n", (ROOT / "lessons.txt").read_text(encoding="utf-8").strip())
    for index, block in enumerate(blocks):
        n = index + 1
        lesson_id = f"lesson-{n:02}"
        header, *rows, order_row = block.splitlines()
        title, objective, notes = header.split("|")
        items = []
        for item_number, row in enumerate(rows, 1):
            hanzi, pinyin, vi = row.split("|")
            items.append(dict(id=f"{lesson_id}-i{item_number:02}", hanzi=hanzi,
                              pinyin=pinyin, vi=vi, audio=audio_path(hanzi)))
        item_ids = [item["id"] for item in items]
        exercises = []
        if n == 1:
            labels = ["Thanh 1 — cao và ngang", "Thanh 2 — đi lên",
                      "Thanh 3 — hạ thấp", "Thanh 4 — đi xuống"]
            for i in range(4):
                item = items[i]
                exercises.append(question(lesson_id, len(exercises) + 1, "tone_choice",
                                          "Nghe âm ma rồi chọn thanh điệu.",
                                          [item["id"]], labels, [i],
                                          f'{item["pinyin"]} là {labels[i].lower()}.'))
        for i in ([4] if n == 1 else [0, len(items) - 1]):
            target = items[i]
            options = [target] + [item for item in items if item != target][:3]
            exercises.append(question(lesson_id, len(exercises) + 1, "meaning_choice",
                                      f'«{target["hanzi"]}» có nghĩa là gì?', [target["id"]],
                                      [item["vi"] for item in options], [0], item_example(target)))
        i = AUDIO_TARGETS[index]
        target = items[i]
        if n == 1:
            candidates = items[:4]
        else:
            phrases = [item for item in items if item["hanzi"].endswith(("！", "。", "？"))]
            if target in phrases and len(phrases) >= 3:
                candidates = [target] + [item for item in phrases if item != target][:3]
            else:
                candidates = [target] + [item for item in items if item != target][:3]
        exercises.append(question(lesson_id, len(exercises) + 1, "audio_choice",
                                  "Nghe đoạn ghi âm rồi chọn chữ đúng.", [target["id"]],
                                  [item["hanzi"] for item in candidates], [candidates.index(target)],
                                  item_example(target), [item["id"] for item in candidates]))
        tokens = order_row[1:].split("|")
        exercises.append(question(lesson_id, len(exercises) + 1, "order", ORDER_HINTS[index],
                                  [], tokens, list(range(len(tokens))), "Đáp án là " + " ".join(tokens) + "."))
        if n == 5:
            labels = ["A · 您好！", "A · 你叫什么名字？", "B · 我叫小安。", "A · 再见！"]
            exercises.append(question(
                lesson_id, len(exercises) + 1, "order",
                "Xếp bốn lượt theo tiến trình: chào → hỏi tên → giới thiệu tên → tạm biệt.",
                ["lesson-02-i01", "lesson-03-i07", "lesson-03-i06", "lesson-02-i02"],
                labels, list(range(4)),
                "您好 dùng để chào. Hỏi tên với 你叫什么名字？, trả lời 我叫小安。, rồi nói 再见 để tạm biệt.",
            ))
        if n in (10, 15):
            review_id = {10: "lesson-08-i06", 15: "lesson-11-i06"}[n]
            target = next(item for item in course["items"] if item["id"] == review_id)
            options = [target, *items[-3:]]
            exercises.append(question(
                lesson_id, len(exercises) + 1, "meaning_choice",
                f'Ôn lại: «{target["hanzi"]}» có nghĩa là gì?', [review_id],
                [item["vi"] for item in options], [0], item_example(target),
            ))
        course["lessons"].append(dict(id=lesson_id, title=title, objective=objective, notesVi=notes,
                                      prerequisiteIds=[f"lesson-{n - 1:02}"] if index else [],
                                      itemIds=item_ids, exercises=exercises))
        course["items"].extend(items)
        modules[index // 5]["lessonIds"].append(lesson_id)
    return course


if __name__ == "__main__":
    CONTENT.mkdir(parents=True, exist_ok=True)
    course = make_course()
    assert len(course["lessons"]) == 15
    dump("course.json", course)

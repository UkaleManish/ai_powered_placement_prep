import json
import os
import sys
import tempfile

try:
    import fitz  # PyMuPDF
    from paddleocr import PaddleOCR
except Exception as exc:
    print(json.dumps({"error": f"missing_dependency: {exc}"}))
    sys.exit(1)


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing_pdf_path"}))
        return 1

    if sys.argv[1] == "--check":
        lang = os.getenv("PADDLEOCR_LANG", "en")
        try:
            PaddleOCR(use_angle_cls=True, lang=lang)
            print(json.dumps({"ok": True, "lang": lang}))
            return 0
        except Exception as exc:
            print(json.dumps({"error": f"paddleocr_init_failed: {exc}"}))
            return 1

    pdf_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else os.getenv("PADDLEOCR_LANG", "en")
    max_pages = int(os.getenv("PADDLEOCR_MAX_PAGES", "6"))

    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:
        print(json.dumps({"error": f"failed_to_open_pdf: {exc}"}))
        return 1

    tmp_dir = tempfile.mkdtemp(prefix="paddle-ocr-")
    try:
        ocr = PaddleOCR(use_angle_cls=True, lang=lang)
        texts = []

        page_count = min(len(doc), max_pages)
        for index in range(page_count):
            page = doc[index]
            pix = page.get_pixmap(dpi=200)
            img_path = os.path.join(tmp_dir, f"page_{index + 1}.png")
            pix.save(img_path)

            result = ocr.ocr(img_path, cls=True)
            if result and isinstance(result, list) and len(result) > 0:
                for line in result[0]:
                    if len(line) > 1:
                        text = line[1][0]
                        if text:
                            texts.append(text)

        output = {
            "text": " ".join(texts).strip(),
            "pages": page_count,
        }
        print(json.dumps(output))
        return 0
    except Exception as exc:
        print(json.dumps({"error": f"paddleocr_failed: {exc}"}))
        return 1
    finally:
        try:
            for entry in os.listdir(tmp_dir):
                try:
                    os.remove(os.path.join(tmp_dir, entry))
                except Exception:
                    pass
            os.rmdir(tmp_dir)
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())

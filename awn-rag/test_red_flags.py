"""Deterministic red-flag checks: these must pass before any model change ships."""
import json
import os
import sys
import unittest
from unittest.mock import patch

os.environ.setdefault("GEMINI_API_KEY", "test-key")
sys.path.insert(0, os.path.dirname(__file__))

from red_flags import age_group, red_flag  # noqa: E402

EMERGENCY = [
    "عندي ألم في الصدر", "صدري يعورني", "وجع بصدري من ساعة", "كتمة في صدري",
    "نفسي ضايق وما اقدر اتنفس", "ابوي طاح واغمى عليه", "وجهه مايل وما يقدر يحرك يده",
    "ابني بلع شي ونفسه يصفّر", "عندي حساسية وانتفخ وجهي ولساني", "ولدي حرارته ٤٠ وتشنج",
    "ينزف كثير وما وقف", "My chest feels tight", "my dad passed out", "I have crushing chest pain",
    "ولدي رضيع وعنده حرارة", "بنتي عمرها ٢ شهور ومسخنة", "my 3-week-old baby has a fever",
]
SELF_HARM = ["ابي اموت نفسي", "I want to kill myself", "تعبت من الحياة وما ابي اعيش", "ودي انتحر"]
SAFE = [
    "ما هي أعراض الجلطة", "وش اسباب ضيق التنفس", "ركبتي تعورني لما امشي", "عندي حبوب في وجهي",
    "what are the symptoms of a stroke", "My knee hurts when I walk", "عندي صداع خفيف من امس",
    "ابي احجز موعد عيون", "نفسي اروح للدكتور بكرة",
]


class RedFlagTests(unittest.TestCase):
    def test_emergencies(self):
        for text in EMERGENCY:
            with self.subTest(text=text):
                self.assertEqual(red_flag(text), "emergency")

    def test_self_harm(self):
        for text in SELF_HARM:
            with self.subTest(text=text):
                self.assertEqual(red_flag(text), "self_harm")

    def test_non_urgent(self):
        for text in SAFE:
            with self.subTest(text=text):
                self.assertIsNone(red_flag(text))

    def test_booking_checks_later_turns_without_model(self):
        import main
        body = main.BookingConversation(
            user_message="وصار صدري يعورني الحين",
            conversation_state={"step": "time", "symptoms": "ركبتي تعورني", "specialty_en": "Orthopedics"},
        )
        with patch.object(main, "generate_content") as generate:
            result = main.booking_conversation(body)
        generate.assert_not_called()
        self.assertTrue(result["emergency"])
        self.assertIn("997", result["response"])

    def test_invented_specialty_falls_back(self):
        import main
        self.assertEqual(main.validated_specialty("Sports Medicine"), ("Family Medicine", "طب الأسرة"))
        self.assertEqual(main.validated_specialty("orthopedics"), ("Orthopedics", "العظام"))


class AgeTests(unittest.TestCase):
    def test_age_groups(self):
        cases = {
            "ولدي رضيع": "infant", "عمرها شهرين": "infant", "my 3-week-old": "infant",
            "طفلي عمره 5 سنوات": "child", "عمرها 20 شهر": "child", "my 8 year old has a rash": "child",
            "عمري 25": "adult", "عندي صداع": None,
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                self.assertEqual(age_group(text), expected)

    def test_toddler_fever_is_not_auto_emergency(self):
        self.assertIsNone(red_flag("عمرها 20 شهر وعندها حرارة"))


class BookingAgeTests(unittest.TestCase):
    def _model(self, state):
        return type("R", (), {"text": json.dumps({
            "response": "ok", "state": state, "complete": False, "confirmed": False, "emergency": False,
        })})()

    def test_child_moves_family_medicine_to_pediatrics(self):
        import main
        body = main.BookingConversation(
            user_message="طفلي عمره 5 سنوات عنده كحة من يومين",
            conversation_state={"step": "symptoms"},
        )
        with patch.object(main, "generate_content", return_value=self._model(
            {"specialty_en": "Family Medicine", "specialty_ar": "طب الأسرة"}
        )):
            result = main.booking_conversation(body)
        self.assertEqual(result["state"]["patient_age_group"], "child")
        self.assertEqual(result["state"]["specialty_en"], "Pediatrics")

    def test_infant_age_given_after_fever_is_emergency(self):
        import main
        body = main.BookingConversation(
            user_message="عمره شهرين",
            conversation_state={"step": "date", "symptoms": "ولدي عنده حرارة", "specialty_en": "Pediatrics"},
        )
        with patch.object(main, "generate_content") as generate:
            result = main.booking_conversation(body)
        generate.assert_not_called()
        self.assertTrue(result["emergency"])


class PrivacyTests(unittest.TestCase):
    def test_redact_identifiers(self):
        import main
        text = main.redact("رقمي 0551234567 وهويتي 1012345678 وايميلي a.b@x.com")
        self.assertNotIn("0551234567", text)
        self.assertNotIn("1012345678", text)
        self.assertNotIn("a.b@x.com", text)

    def test_logging_off_by_default(self):
        import main
        with patch.object(main, "get_conn") as conn:
            main.log_query("q", "a", [])
        conn.assert_not_called()


if __name__ == "__main__":
    unittest.main()

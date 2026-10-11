"""Deterministic red-flag checks: these must pass before any model change ships."""
import os
import sys
import unittest
from unittest.mock import patch

os.environ.setdefault("GEMINI_API_KEY", "test-key")
sys.path.insert(0, os.path.dirname(__file__))

from red_flags import red_flag  # noqa: E402

EMERGENCY = [
    "عندي ألم في الصدر", "صدري يعورني", "وجع بصدري من ساعة", "كتمة في صدري",
    "نفسي ضايق وما اقدر اتنفس", "ابوي طاح واغمى عليه", "وجهه مايل وما يقدر يحرك يده",
    "ابني بلع شي ونفسه يصفّر", "عندي حساسية وانتفخ وجهي ولساني", "ولدي حرارته ٤٠ وتشنج",
    "ينزف كثير وما وقف", "My chest feels tight", "my dad passed out", "I have crushing chest pain",
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


if __name__ == "__main__":
    unittest.main()

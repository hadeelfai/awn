"""Focused behavior checks for the one-call booking flow."""
import json
import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import httpx
os.environ.setdefault("GEMINI_API_KEY", "test-key")
sys.path.insert(0, os.path.dirname(__file__))

import main  # noqa: E402
import gemini_service  # noqa: E402


class BookingFlowTests(unittest.TestCase):
    def test_emergency_is_returned_without_calling_model(self):
        body = main.BookingConversation(
            user_message="I have crushing chest pain",
            conversation_state={"step": "symptoms"},
        )
        with patch.object(main, "generate_content") as generate:
            result = main.booking_conversation(body)

        generate.assert_not_called()
        self.assertTrue(result["emergency"])
        self.assertEqual(result["state"]["step"], "emergency")
        self.assertIn("997", result["response"])

    def test_arabic_chest_pain_phrase_is_caught_without_calling_model(self):
        body = main.BookingConversation(
            user_message="الم في الصدر",
            conversation_state={"step": "symptoms"},
        )
        with patch.object(main, "generate_content") as generate:
            result = main.booking_conversation(body)

        generate.assert_not_called()
        self.assertTrue(result["emergency"])
        self.assertIn("997", result["response"])

    def test_first_symptom_turn_uses_one_call_and_captures_specialty(self):
        body = main.BookingConversation(
            user_message="My knee hurts when I walk",
            conversation_state={"step": "symptoms"},
        )
        model_result = {
            "response": "Orthopedics fits your knee pain. What date works for you?",
            "state": {
                "step": "date",
                "specialty_ar": "العظام",
                "specialty_en": "Orthopedics",
                "specialty_reason": "Knee pain is assessed by orthopedics.",
            },
            "complete": False,
            "confirmed": False,
            "emergency": False,
        }
        with patch.object(main, "generate_content", return_value=type("Response", (), {"text": json.dumps(model_result)})()) as generate:
            result = main.booking_conversation(body)

        generate.assert_called_once()
        self.assertEqual(result["state"]["step"], "date")
        self.assertEqual(result["state"]["symptoms"], body.user_message)
        self.assertEqual(result["state"]["specialty_en"], "Orthopedics")
        self.assertEqual(result["state"]["specialty_ar"], "العظام")

    def test_later_turn_keeps_specialty_and_previous_items(self):
        previous_state = {
            "step": "date",
            "symptoms": "My knee hurts",
            "specialty_ar": "العظام",
            "specialty_en": "Orthopedics",
            "specialty_reason": "Joint pain",
            "patient_preparation_items": ["clinic letter"],
        }
        body = main.BookingConversation(
            user_message="tomorrow",
            conversation_state=previous_state,
        )
        model_result = {
            "response": "What time works for you?",
            "state": {"step": "time", "date": "2030-01-02"},
            "complete": False,
            "confirmed": False,
            "emergency": False,
        }
        with patch.object(main, "generate_content", return_value=type("Response", (), {"text": json.dumps(model_result)})()) as generate:
            result = main.booking_conversation(body)

        generate.assert_called_once()
        self.assertEqual(result["state"]["step"], "time")
        self.assertEqual(result["state"]["specialty_en"], "Orthopedics")
        self.assertEqual(result["state"]["specialty_ar"], "العظام")
        self.assertEqual(result["state"]["symptoms"], "My knee hurts")
        self.assertEqual(result["state"]["patient_preparation_items"], ["clinic letter"])

    def test_model_detected_emergency_is_returned(self):
        body = main.BookingConversation(
            user_message="My arm feels strange and I feel dizzy",
            conversation_state={"step": "symptoms"},
        )
        model_result = {"emergency": True}
        with patch.object(main, "generate_content", return_value=type("Response", (), {"text": json.dumps(model_result)})()) as generate:
            result = main.booking_conversation(body)

        generate.assert_called_once()
        self.assertTrue(result["emergency"])
        self.assertEqual(result["state"]["step"], "emergency")
        self.assertIn("997", result["response"])

    def test_preparation_returns_sourced_and_general_guidance_from_one_call(self):
        body = main.PrepareAppointment(
            specialty="Family Medicine",
            symptoms="routine checkup",
            language="en",
        )
        row = ("Clinic guidance", "https://example.test/clinic", "Bring prior test results.", 0.1)
        generated = {
            "instructions": ["Bring prior test results."],
            "source_numbers": [1],
            "note": "Clinic-specific guidance found.",
            "general_instructions": ["Write down questions for your visit."],
        }
        with (
            patch.object(main, "search", return_value=[row]),
            patch.object(main, "get_source_chunks", return_value=[]),
            patch.object(main, "generate_content", return_value=type("Response", (), {"text": json.dumps(generated)})()) as generate,
        ):
            result = main.prepare_appointment(body)

        generate.assert_called_once()
        self.assertEqual(result["instructions"], ["Bring prior test results."])
        self.assertEqual(result["general_instructions"], ["Write down questions for your visit."])
        self.assertEqual(result["sources"][0]["url"], row[1])

    def test_read_timeout_uses_faster_fallback_model_once(self):
        fallback_response = SimpleNamespace(text="fallback response")
        with patch.object(
            gemini_service.client.models,
            "generate_content",
            side_effect=[httpx.ReadTimeout("primary timed out"), fallback_response],
        ) as generate:
            result = gemini_service.generate_content("prompt")

        self.assertIs(result, fallback_response)
        self.assertEqual(generate.call_count, 2)
        self.assertEqual(generate.call_args.kwargs["model"], gemini_service.GEMINI_FALLBACK_MODEL)

    def test_response_text_skips_thought_parts(self):
        response = SimpleNamespace(candidates=[SimpleNamespace(content=SimpleNamespace(parts=[
            SimpleNamespace(text="answer ", thought=False),
            SimpleNamespace(text="private thought", thought=True),
            SimpleNamespace(text=None, thought_signature="opaque"),
        ]))])

        self.assertEqual(gemini_service.response_text(response), "answer ")

    def test_stream_timeout_before_text_uses_fallback_model(self):
        first_chunk = SimpleNamespace(text="fallback answer")

        def timed_out_stream(**_kwargs):
            def chunks():
                raise httpx.ReadTimeout("primary stream timed out")
                yield  # make this a generator
            return chunks()

        with patch.object(
            gemini_service.client.models,
            "generate_content_stream",
            side_effect=[timed_out_stream(), [first_chunk]],
        ) as generate:
            chunks = list(gemini_service.generate_content_stream("prompt"))

        self.assertEqual(chunks, [first_chunk])
        self.assertEqual(generate.call_count, 2)
        self.assertEqual(generate.call_args.kwargs["model"], gemini_service.GEMINI_FALLBACK_MODEL)

    def test_stream_timeout_after_text_does_not_restart_and_duplicate(self):
        first_chunk = SimpleNamespace(text="partial answer")

        def partial_stream(**_kwargs):
            def chunks():
                yield first_chunk
                raise httpx.ReadTimeout("primary stream timed out")
            return chunks()

        with patch.object(
            gemini_service.client.models,
            "generate_content_stream",
            side_effect=[partial_stream()],
        ) as generate:
            stream = gemini_service.generate_content_stream("prompt")
            self.assertIs(next(stream), first_chunk)
            with self.assertRaises(httpx.ReadTimeout):
                next(stream)

        generate.assert_called_once()


if __name__ == "__main__":
    unittest.main()

import io
import unittest
from types import SimpleNamespace
from services.speech_to_text_provider import FasterWhisperSpeechToTextProvider
from services.neural_tts_provider import PiperNeuralTTSProvider


class FakeWhisper:
    def transcribe(self, stream, **_kwargs):
        self.received_stream = isinstance(stream, io.BytesIO)
        return iter([SimpleNamespace(text=" quero outro ")]), SimpleNamespace(language="pt")


class FakeVoice:
    def synthesize_wav(self, text, output, syn_config=None):
        self.syn_config = syn_config
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(16000)
        output.writeframes(text.encode())


class VoiceProviderTests(unittest.TestCase):
    def test_stt_uses_an_in_memory_stream(self):
        model = FakeWhisper()
        result = FasterWhisperSpeechToTextProvider(model).transcribe(b"temporary")
        self.assertTrue(model.received_stream)
        self.assertEqual(result["transcript"], "quero outro")

    def test_generated_titia_audio_is_cached(self):
        provider = PiperNeuralTTSProvider(
            FakeVoice(), synthesis_config_factory=lambda **values: SimpleNamespace(**values)
        )
        first = provider.synthesize("Isso!", "titia", "pt-BR", .85, "test")
        second = provider.synthesize("Isso!", "titia", "pt-BR", .85, "test")
        self.assertIs(first, second)


if __name__ == "__main__":
    unittest.main()

import unittest

from services.bkt_service import BKTService


class BKTServiceTest(unittest.TestCase):
    def setUp(self):
        self.service = BKTService()

    def test_correct_observation_updates_mastery(self):
        result = self.service.update("EF99MA99", "student-1", True, 0.5)
        self.assertGreater(result["mastery_probability"], 0.5)

    def test_incorrect_observation_updates_mastery(self):
        result = self.service.update("EF99MA99", "student-1", False, 0.5)
        self.assertLess(result["mastery_probability"], 0.5)


if __name__ == "__main__":
    unittest.main()

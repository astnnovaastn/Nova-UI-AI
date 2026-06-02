from astra_ai.core.widget_controller import WidgetController


def test_casual_conversation_does_not_trigger_image_widget():
    controller = WidgetController()
    messages = [
        "i love Michael Jackson and he songs",
        "i love to eat italy food and food from ghana",
        "i want to Create personalized CGI-like AI assistant (Jarvis style)",
        "help me build a logo generator for my website",
        "my sister name is reachel",
    ]

    assert all(not controller.has_explicit_image_intent(message) for message in messages)


def test_explicit_image_requests_trigger_image_widget():
    controller = WidgetController()
    messages = [
        "create an image of Michael Jackson performing",
        "can you make a picture of Italian food",
        "write an image prompt for a Jarvis-style assistant",
        "open the image widget",
        "show image 2 from my gallery",
        "edit this photo to add a blue background",
    ]

    assert all(controller.has_explicit_image_intent(message) for message in messages)


def test_confirmation_requires_existing_draft():
    controller = WidgetController()
    assert not controller.has_explicit_image_intent("yes generate it")

    controller.awaiting_generation_confirmation = True
    assert controller.has_explicit_image_intent("yes")
    assert controller.has_explicit_image_intent("generate it")

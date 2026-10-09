"""Checks on the scripts each page loads, read from the rendered HTML.

No browser is involved. The checks cover what can be read from the markup
and from the script files themselves.
"""
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

import pytest

from app import app
from test_routes import PAGES

# document.getElementById("some-id") or document.getElementById('some-id')
ELEMENT_LOOKUP = re.compile(r"""getElementById\(\s*["']([^"']+)["']\s*\)""")


class TagCollector(HTMLParser):
    """Records every start tag in a page as (name, attributes), in document order."""

    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


@pytest.fixture
def client():
    return app.test_client()


def tags_on(client, page):
    collector = TagCollector()
    collector.feed(client.get(page).get_data(as_text=True))
    return collector.tags


@pytest.mark.parametrize("page", PAGES)
def test_scripts_find_their_elements(client, page):
    """Every id a page's own scripts look up has to exist on that page.

    getElementById returns null for an id the page does not have, and the
    script then fails on the first use of that null.
    """
    tags = tags_on(client, page)
    ids = {attrs["id"] for _, attrs in tags if "id" in attrs}
    sources = [attrs["src"] for tag, attrs in tags if tag == "script" and attrs.get("src")]
    own_scripts = [src for src in sources if not urlsplit(src).netloc]
    for src in own_scripts:
        # The with block closes the file behind a static-file response.
        with client.get(src) as response:
            wanted = set(ELEMENT_LOOKUP.findall(response.get_data(as_text=True)))
        assert wanted <= ids, f"{src} looks up {sorted(wanted - ids)}, which {page} does not have"

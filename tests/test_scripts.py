"""Checks on the scripts each page loads, read from the rendered HTML.

No browser is involved. The checks cover what can be read from the markup
and from the script files themselves.
"""
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

import pytest

from app import app
from test_routes import ALGORITHM_PAGES, PAGES

# document.getElementById("some-id") or document.getElementById('some-id')
ELEMENT_LOOKUP = re.compile(r"""getElementById\(\s*["']([^"']+)["']\s*\)""")

# The languages prism.min.js highlights by itself. Any other language comes
# from a component script, which extends the core and so has to load after it.
PRISM_CORE_LANGUAGES = {"markup", "css", "clike", "javascript"}


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


def url_of(attrs):
    """Return the URL a script or link tag with these attributes loads, or ""."""
    return attrs.get("src") or attrs.get("href") or ""


def third_party_files(tags):
    """Return the attributes of each script and link tag that loads from another site."""
    assets = [attrs for tag, attrs in tags if tag in ("script", "link")]
    return [attrs for attrs in assets if urlsplit(url_of(attrs)).netloc]


def prism_files(tags):
    """Return the URLs of the Prism stylesheets and scripts among `tags`, in document order."""
    urls = [url_of(attrs) for attrs in third_party_files(tags)]
    return [url for url in urls if "prism" in url]


def p5_script(tags):
    """Return the attributes of the one script tag among `tags` that loads p5.js."""
    scripts = [attrs for tag, attrs in tags if tag == "script"]
    [p5] = [attrs for attrs in scripts if re.search(r"/p5(\.min)?\.js$", attrs.get("src") or "")]
    return p5


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


@pytest.mark.parametrize("page", ALGORITHM_PAGES)
def test_prism_can_highlight_every_listing(client, page):
    """Prism has what it needs to highlight every listing on the page.

    That is a theme, the core script ahead of every other Prism script, and a
    component for each listing language outside the core.
    """
    tags = tags_on(client, page)
    files = [url.rsplit("/", 1)[-1] for url in prism_files(tags)]
    scripts = [name for name in files if name.endswith(".js")]
    assert any(name.endswith(".css") for name in files), f"{page} loads no Prism theme"
    assert scripts[:1] == ["prism.min.js"], f"the first Prism script on {page} is not the core"

    classes = [attrs.get("class") or "" for tag, attrs in tags if tag == "code"]
    languages = {name[len("language-"):] for name in classes if name.startswith("language-")}
    assert languages, f"{page} has no listings"
    for language in languages - PRISM_CORE_LANGUAGES:
        component = f"prism-{language}.min.js"
        assert component in scripts, f"{page} has a {language} listing but no {component}"


def test_algorithm_pages_load_the_same_third_party_files(client):
    """The five pages share one layout, so they load the same files in the same way."""
    first, *others = ALGORITHM_PAGES
    expected = third_party_files(tags_on(client, first))
    for page in others:
        assert third_party_files(tags_on(client, page)) == expected, f"{page} differs from {first}"


@pytest.mark.parametrize("page", ALGORITHM_PAGES)
def test_p5_is_pinned_and_integrity_checked(client, page):
    """p5.js is loaded at an exact version, with a hash for the browser to check.

    A browser checks the hash of a script from another site only if the
    request is made with CORS, which is what crossorigin="anonymous" asks for.
    """
    p5 = p5_script(tags_on(client, page))
    assert re.search(r"[/@]v?\d+\.\d+\.\d+/", p5["src"]), f"no exact version in {p5['src']}"
    assert re.match(r"sha(256|384|512)-", p5.get("integrity") or ""), "p5.js has no integrity hash"
    assert p5.get("crossorigin") == "anonymous"

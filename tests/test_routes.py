"""Route and link checks, run through Flask's test client.

Every page has to load, and so does every link on a page that points back
into the app. The checks run twice: with the app at the site root, the way
`python app.py` serves it, and with the app mounted under /dev, the way it
sits behind an API Gateway stage. Links built with url_for work in both
setups. A hard-coded path works in only one of them.

The scripts are not run, so only links written in the HTML are covered.
"""
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import pytest
from werkzeug.exceptions import NotFound
from werkzeug.middleware.dispatcher import DispatcherMiddleware

from app import app

HOME = "/"
ALGORITHM_PAGES = ["/bubble_sort", "/selection_sort", "/merge_sort", "/quick_sort", "/heap_sort"]
PAGES = [HOME] + ALGORITHM_PAGES


class LinkCollector(HTMLParser):
    """Collects the value of every href and src attribute in a page."""

    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                self.links.append(value)


def internal_links(client, url):
    """Return the paths on this site that the page at `url` links to.

    Each link is resolved against the page URL the way a browser does it, so
    links to other hosts drop out and "#python" resolves to the page itself.
    """
    collector = LinkCollector()
    collector.feed(client.get(url).get_data(as_text=True))
    targets = [urlsplit(urljoin("http://localhost" + url, link)) for link in collector.links]
    return {target.path for target in targets if target.netloc == "localhost"}


@pytest.fixture(params=["", "/dev"], ids=["root", "prefix"])
def prefix(request, monkeypatch):
    """Where the app is mounted for this test: the site root, then /dev."""
    if request.param:
        mounted = DispatcherMiddleware(NotFound(), {request.param: app.wsgi_app})
        monkeypatch.setattr(app, "wsgi_app", mounted)
    return request.param


@pytest.fixture
def client(prefix):
    return app.test_client()


@pytest.mark.parametrize("page", PAGES)
def test_page_returns_200(client, prefix, page):
    assert client.get(prefix + page).status_code == 200


@pytest.mark.parametrize("page", PAGES)
def test_internal_links_resolve(client, prefix, page):
    for link in sorted(internal_links(client, prefix + page)):
        # The with block closes the file behind a static-file response.
        with client.get(link) as response:
            assert response.status_code == 200, f"{page} links to {link}"


def test_pages_link_to_each_other(client, prefix):
    home = prefix + HOME
    algorithm_pages = [prefix + page for page in ALGORITHM_PAGES]
    assert set(algorithm_pages) <= internal_links(client, home)
    for page in algorithm_pages:
        assert home in internal_links(client, page), f"{page} has no link to the home page"

"""Runs the sorting code in this repository outside the browser.

Two kinds of code are covered:

- The listings on the algorithm pages. Each page shows the algorithm in
  JavaScript, Python and Java. The tests take the Python and JavaScript
  listings out of the rendered page and run them. The Java listings are not
  run.
- The p5.js sketches in static/js/. Each one has a function, sortSteps, that
  records the snapshots its page plays back. The tests run that function.
  The drawing code is not run.

All of it runs on a set of small arrays, and the results are compared with
sorted().

Each piece of code runs in a process of its own. Code that never returns is
then stopped by a timeout and reported as a failure, instead of hanging the
test run.

The JavaScript needs node on the PATH. Without it those tests are skipped.
"""
import itertools
import json
import random
import shutil
import subprocess
import sys
import textwrap
from html.parser import HTMLParser

import pytest

from app import app

# For each page and language, the statement that sorts the array `arr` with
# the listing: in place, or by assigning the sorted copy the listing returns.
SORT_CALLS = {
    "/bubble_sort": {"python": "bubble_sort(arr)", "javascript": "bubbleSort(arr)"},
    "/selection_sort": {"python": "selection_sort(arr)", "javascript": "selectionSort(arr)"},
    "/merge_sort": {"python": "arr = merge_sort(arr)", "javascript": "arr = mergeSort(arr)"},
    "/quick_sort": {
        "python": "quick_sort(arr, 0, len(arr) - 1)",
        "javascript": "quickSort(arr, 0, arr.length - 1)",
    },
    "/heap_sort": {"python": "heap_sort(arr)", "javascript": "heapSort(arr)"},
}

# A sketch registers a DOMContentLoaded handler while it loads. Outside a
# browser this stand-in for document lets it load. The handler never runs.
DOCUMENT_STUB = "const document = { addEventListener() {} };\n"

# Every array of up to five values drawn from 1, 2 and 3. That covers the
# empty array, the single-element arrays and every arrangement of repeated
# values at those sizes. Then some longer arrays of random digits, which
# repeat values as well.
INPUTS = [
    list(values) for size in range(6) for values in itertools.product([1, 2, 3], repeat=size)
]
rng = random.Random(0)
INPUTS += [[rng.randrange(10) for _ in range(size)] for size in range(6, 60, 3)]

# A script per language that sorts every input with the code under test. It
# prints each result as a line of JSON as soon as it has it, so after a
# timeout the number of lines tells which input the code was stuck on.
SCRIPTS = {
    "python": """\
import json
{code}
for arr in {inputs}:
    {call}
    print(json.dumps(arr), flush=True)
""",
    "javascript": """\
{code}
for (let arr of {inputs}) {{
    {call};
    require("fs").writeSync(1, JSON.stringify(arr) + "\\n");
}}
""",
}

# Both interpreters read the script from standard input when given "-".
COMMANDS = {"python": [sys.executable, "-"], "javascript": ["node", "-"]}

# Seconds allowed for one script. A run that works takes a fraction of that.
TIMEOUT = 10

needs_node = pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")


class ListingCollector(HTMLParser):
    """Collects the text of every <code class="language-..."> element, by language."""

    def __init__(self):
        super().__init__()
        self.listings = {}
        self.language = None

    def handle_starttag(self, tag, attrs):
        css_class = dict(attrs).get("class") or ""
        if tag == "code" and css_class.startswith("language-"):
            self.language = css_class[len("language-"):]
            self.listings[self.language] = ""

    def handle_endtag(self, tag):
        if tag == "code":
            self.language = None

    def handle_data(self, data):
        if self.language:
            self.listings[self.language] += data


def listing(page, language):
    """Return the listing for `language` on `page`, without its indentation in the HTML."""
    collector = ListingCollector()
    collector.feed(app.test_client().get(page).get_data(as_text=True))
    return textwrap.dedent(collector.listings[language])


def check_sorting(language, code, call, inputs=INPUTS):
    """Sort every input by running `call` with `code` loaded, and check each result."""
    script = SCRIPTS[language].format(code=code, inputs=json.dumps(inputs), call=call)
    try:
        finished = subprocess.run(
            COMMANDS[language], input=script.encode(), capture_output=True, timeout=TIMEOUT
        )
    except subprocess.TimeoutExpired as expired:
        stuck_on = inputs[len((expired.stdout or b"").splitlines())]
        message = f"did not finish sorting {stuck_on} within {TIMEOUT} seconds"
        raise AssertionError(message) from None
    assert finished.returncode == 0, finished.stderr.decode()
    results = [json.loads(line) for line in finished.stdout.splitlines()]
    assert len(results) == len(inputs)
    for values, result in zip(inputs, results):
        assert result == sorted(values), f"sorting {values} gave {result}"


@pytest.mark.parametrize("language", ["python", pytest.param("javascript", marks=needs_node)])
@pytest.mark.parametrize("page", SORT_CALLS)
def test_listing_sorts(page, language):
    check_sorting(language, listing(page, language), SORT_CALLS[page][language])


@needs_node
@pytest.mark.parametrize("page", SORT_CALLS)
def test_animation_ends_on_the_sorted_array(page):
    """The last snapshot is the frame that stays on screen when the animation ends."""
    # Each page loads the sketch that is named after it.
    with app.test_client().get(f"/static/js{page}.js") as response:
        assert response.status_code == 200
        sketch = response.get_data(as_text=True)
    # With fewer than two bars there is nothing to sort, and not every sketch
    # records a snapshot then.
    inputs = [values for values in INPUTS if len(values) > 1]
    last_snapshot = "arr = sortSteps(arr).pop().array"
    check_sorting("javascript", DOCUMENT_STUB + sketch, last_snapshot, inputs)

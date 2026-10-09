"""Runs the code listings shown on the algorithm pages.

Each algorithm page shows the algorithm in JavaScript, Python and Java. The
tests take the Python and JavaScript listings out of the rendered page, run
them on a set of small arrays and compare the results with sorted(). The Java
listings are not run.

Each listing runs in a process of its own. A listing that never returns is
then stopped by a timeout and reported as a failure, instead of hanging the
test run.

The JavaScript listings need node on the PATH. Without it they are skipped.
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


def sort_inputs(language, code, call):
    """Sort every input with `code` and return the results in order."""
    script = SCRIPTS[language].format(code=code, inputs=json.dumps(INPUTS), call=call)
    try:
        finished = subprocess.run(
            COMMANDS[language], input=script.encode(), capture_output=True, timeout=TIMEOUT
        )
    except subprocess.TimeoutExpired as expired:
        stuck_on = INPUTS[len((expired.stdout or b"").splitlines())]
        message = f"did not finish sorting {stuck_on} within {TIMEOUT} seconds"
        raise AssertionError(message) from None
    assert finished.returncode == 0, finished.stderr.decode()
    return [json.loads(line) for line in finished.stdout.splitlines()]


@pytest.mark.parametrize("language", ["python", pytest.param("javascript", marks=needs_node)])
@pytest.mark.parametrize("page", SORT_CALLS)
def test_listing_sorts(page, language):
    results = sort_inputs(language, listing(page, language), SORT_CALLS[page][language])
    assert len(results) == len(INPUTS)
    for values, result in zip(INPUTS, results):
        assert result == sorted(values), f"sorting {values} gave {result}"

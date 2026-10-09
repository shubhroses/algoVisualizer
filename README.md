# Sorting Algorithm Visualizer

A small web app that animates five sorting algorithms as colored bars: bubble sort, selection sort, merge sort, quick sort and heap sort. Flask serves the pages and the animation runs in the browser with p5.js.

The app was deployed to AWS Lambda and API Gateway with [Zappa](https://github.com/zappa/Zappa), and the Zappa settings are still in the repository. That deployment has since been taken down, so there is no live demo. To try the app, run it locally as described below.

![Quick sort page showing the frame-rate buttons, the bar-count slider and the sorted bars](static/visualization.png)

## What it does

The home page links to one page per algorithm. Each algorithm page has:

- A canvas of bars, one per array element. The height and color of a bar come from the element's value. The element the algorithm is working on at each step (for example the one being compared or written) is drawn in black.
- Frame-rate buttons from 1 to 2000 fps (default 5). p5.js draws at most once per screen refresh, so the settings above the display's refresh rate behave the same.
- A slider for the number of bars, from 1 to 500 (default 25).
- A button that switches between Start and Pause, and a Reset button.
- A written description of the algorithm and code listings for it in JavaScript, Python and Java, highlighted by Prism.
- A Home link back to the list of algorithms.

Moving the slider or pressing Reset generates a new shuffled array of the values 1 to n.

## How it works

- `app.py` is a Flask app with six routes: `/` and one per algorithm (`/bubble_sort`, `/selection_sort`, `/merge_sort`, `/quick_sort`, `/heap_sort`). Each route only renders a template. There are no API endpoints and nothing is sorted on the server.
- Each algorithm page loads its own script from `static/js/`. When Start is pressed, the script runs the sort on a copy of the array and records a snapshot of the array, plus the index to highlight, at every step. The p5.js `draw()` loop then plays the snapshots back at the selected frame rate, advancing more snapshots per frame as the array gets larger.
- Links between pages and to the files under `static/` are built with Flask's `url_for`, so they follow the path the app is served under: `/` locally, `/dev/` behind the API Gateway stage.
- The templates load Bootstrap, Prism and p5.js from the jsDelivr and cdnjs CDNs, each at an exact version, so the pages need internet access even when the app runs locally.
- The p5.js script tag carries a Subresource Integrity hash, so a browser refuses to run the file if it is not byte for byte the 1.7.0 release of `p5.min.js`. To change the p5.js version, change the URL in the five algorithm templates and replace the hash with `sha512-` followed by the output of `curl -s <url> | openssl dgst -sha512 -binary | openssl base64 -A`. cdnjs publishes the same value at `https://api.cdnjs.com/libraries/p5.js/1.7.0?fields=sri`.

## Repository layout

| Path | Contents |
| --- | --- |
| `app.py` | Flask application and routes |
| `templates/` | `index.html` and one template per algorithm |
| `static/js/` | one p5.js sketch per algorithm (step recording and playback) |
| `static/css/` | page styles |
| `static/visualization.png` | the screenshot above |
| `tests/test_routes.py` | route and link checks, run with pytest |
| `tests/test_sorting.py` | runs the Python and JavaScript code listings from the pages, with pytest |
| `tests/test_scripts.py` | checks on the scripts each page loads, run with pytest |
| `pytest.ini` | pytest settings |
| `zappa_settings.json` | Zappa configuration for the `dev` stage |
| `requirements.txt` | pinned dependencies: Flask, Flask-Cors, Zappa and the packages they depend on |

## Run locally

You need Python 3 and pip.

```bash
git clone https://github.com/shubhroses/algoVisualizer.git
cd algoVisualizer
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:5001/.

`requirements.txt` is a pinned list from September 2023. Besides Flask it installs Zappa and the AWS libraries Zappa depends on. `app.py` itself only imports Flask and Flask-Cors, so `pip install Flask Flask-Cors` is enough if you only want to run the app locally.

Checked in October 2026 on macOS: the pinned versions install on Python 3.10, 3.13 and 3.14, and the app and its tests run on all three. The app and the tests also run with the current Flask release (3.1) on Python 3.13. Zappa itself supports fewer Python versions, as the deployment section explains.

## Run the tests

In the same virtual environment:

```bash
pip install pytest
pytest
```

The run should report 54 passed. Five of those tests need [Node.js](https://nodejs.org/). If `node` is not on the PATH they are skipped and the run reports 49 passed, 5 skipped.

The test files use Flask's test client, so no server and no browser need to be running.

`tests/test_routes.py` checks that every page returns 200, that every link on a page that points back into the app (other pages and the files under `static/`) also returns 200, and that the home page and the algorithm pages link to each other. Each check runs twice: with the app at the site root, and with the app mounted under `/dev`, the way it sits behind an API Gateway stage.

`tests/test_sorting.py` takes the Python and JavaScript listings out of each rendered algorithm page and runs them on a few hundred arrays: every array of up to five values drawn from 1, 2 and 3, which includes the empty array, single elements and repeated values, and some longer arrays of random digits. Each result has to match Python's `sorted()`. A listing runs in a process of its own with a 10 second limit, so one that never returns fails its test instead of hanging the run. The JavaScript listings run under `node`. The Java listings are not run, and neither are the p5.js sketches in `static/js/`.

`tests/test_scripts.py` reads the tags out of each rendered page. It checks that every element id the page's own scripts look up with `getElementById` exists on that page. For the algorithm pages it also checks that Prism can highlight every listing: the page loads a Prism theme, the Prism core comes before the other Prism scripts, every listing language outside the core has its component script, and all five pages load the same Prism files. It checks that the p5.js script tag has an exact version in its URL, an integrity hash and `crossorigin="anonymous"`, and is the same on all five pages. Whether the hash matches the file is not something these tests can tell without network access. A browser checks that on every page load.

## Deploy to AWS Lambda with Zappa

`zappa_settings.json` defines one stage, `dev`, which packages `app.app` for Lambda and exposes it through API Gateway. Deployment is not covered by the tests.

Before deploying to your own AWS account, edit these keys:

- `profile_name`: the AWS CLI profile to deploy with (the file says `default`).
- `s3_bucket`: a bucket of your own for the deployment package. The value in the file is a placeholder.
- `runtime`: currently `python3.8`, which AWS Lambda deprecated in October 2024. Set a runtime that AWS still supports. The pinned Zappa 0.57.0 only runs on Python 3.7 to 3.10, so a runtime newer than `python3.10` also needs a newer Zappa release.

Then, from the activated virtual environment:

```bash
zappa deploy dev      # first deployment
zappa update dev      # redeploy after changes
zappa undeploy dev    # remove the deployment
```

API Gateway serves the app under the stage name, as in `https://<api-id>.execute-api.<region>.amazonaws.com/dev/`. The pages build their links with `url_for`, so they work under that prefix whatever the stage is called.

## License

MIT. See [LICENSE](LICENSE).

## Author

Shubhrose Singh - [github.com/shubhroses](https://github.com/shubhroses)

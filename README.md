# Sorting Algorithm Visualizer

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Overview

Sorting Algorithm Visualizer is a web application designed to help you understand the inner workings of various sorting algorithms. This project is hosted on AWS Lambda, making it highly scalable and cost-efficient. The application provides visual representations and code implementations for the following sorting algorithms:

- Bubble Sort
- Heap Sort
- Merge Sort
- Quick Sort
- Selection Sort

**Live Website**: [Sorting Algorithm Visualizer](https://pfzk1lyri2.execute-api.us-east-1.amazonaws.com/dev/)

![Demo Screenshot](your_demo_image_link_here)

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Deployment with Zappa](#deployment-with-zappa)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- Interactive UI to choose different sorting algorithms.
- Visual representation of each step of the sorting process.
- Code snippets in multiple programming languages (JavaScript, Python, Java).
- In-depth description and key features of each algorithm.

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask
- **Deployment**: AWS Lambda via Zappa

## Getting Started

### Prerequisites

- Python 3.x
- pip
- virtualenv
- AWS CLI configured

### Installation

1. Clone the repository
    ```bash
    git clone https://github.com/yourusername/sorting-algorithm-visualizer.git
    ```

2. Create a virtual environment
    ```bash
    virtualenv venv
    ```

3. Activate the virtual environment
    - On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    - On Windows:
        ```bash
        .\venv\Scripts\activate
        ```

4. Install dependencies
    ```bash
    pip install -r requirements.txt
    ```

5. Run the Flask application
    ```bash
    flask run
    ```

## Deployment with Zappa

This project is configured to be easily deployed on AWS Lambda using [Zappa](https://github.com/Miserlou/Zappa). Follow these steps to deploy:

1. Install Zappa
    ```bash
    pip install zappa
    ```

2. Initialize Zappa settings
    ```bash
    zappa init
    ```

3. Deploy the application
    ```bash
    zappa deploy dev
    ```

For more detailed information, please refer to [this guide](#your_detailed_zappa_guide_link_here).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact

- **Your Name** - [GitHub](https://github.com/yourusername)

For any questions, feel free to open an issue or pull request. Feedback and contributions are welcome!

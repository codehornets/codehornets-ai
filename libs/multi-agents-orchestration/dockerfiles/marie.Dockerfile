# Marie Agent Dockerfile
# Specialized for dance teaching, student management, and documentation

FROM codehornets-base:latest

# Install marie-specific packages
RUN apt-get update && apt-get install -y \
    # Document processing
    pandoc \
    texlive-latex-base \
    texlive-fonts-recommended \
    # Image processing
    imagemagick \
    graphicsmagick \
    # Video processing
    ffmpeg \
    # Office tools
    libreoffice \
    # PDF tools
    poppler-utils \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install document/data processing Python packages
RUN pip3 install --no-cache-dir \
    # Document processing
    python-docx \
    openpyxl \
    xlrd \
    pypdf2 \
    # Data analysis
    pandas \
    numpy \
    matplotlib \
    seaborn \
    # Web scraping (for research)
    beautifulsoup4 \
    requests \
    # Calendar/scheduling
    icalendar \
    python-dateutil \
    # Email
    sendgrid \
    # Forms
    wtforms \
    flask-wtf

# Install frontend/UI tools
RUN npm install -g \
    markdown-it \
    marked \
    puppeteer \
    playwright

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Set environment variables
ENV AGENT_NAME=marie
ENV AGENT_ROLE=worker

# Set working directory
WORKDIR /home/agent/workspace

LABEL ai.codehornets.agent="marie"
LABEL ai.codehornets.role="dance_teacher_assistant"
LABEL ai.codehornets.description="Student management and documentation"
LABEL ai.codehornets.specialties="documentation,spreadsheets,student_tracking,scheduling"

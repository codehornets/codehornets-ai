FROM python:3.12-slim

# Install reportlab and dependencies
RUN pip install --no-cache-dir reportlab>=4.0.0

# Create working directory
WORKDIR /app

# Copy PDF generator script
COPY generate_evaluation_pdf.py /app/

# Make script executable
RUN chmod +x /app/generate_evaluation_pdf.py

# Default command
CMD ["python", "/app/generate_evaluation_pdf.py"]

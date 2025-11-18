#!/bin/bash
# Combine agent personality with domain expertise

AGENT=$1
DOMAIN=$2
OUTPUT=$3

if [ -z "$AGENT" ] || [ -z "$DOMAIN" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 <agent-file> <domain-file> <output-file>"
    echo "Example: $0 agents/Marie.md domains/DANCE.md /workspace/CLAUDE.md"
    exit 1
fi

# Combine agent personality + domain knowledge
cat "$AGENT" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "# Domain Expertise (Imported)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
cat "$DOMAIN" >> "$OUTPUT"

echo "Created $OUTPUT from $AGENT + $DOMAIN"

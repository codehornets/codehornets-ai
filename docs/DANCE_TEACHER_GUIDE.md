#!/bin/bash

echo "🩰 Creating Dance Teacher Assistant..."
echo ""

# Start from the general assistant version
if [ ! -f "cli.assistant.js" ]; then
    echo "❌ Error: cli.assistant.js not found!"
    echo "Please run ./transform.sh first to create the general assistant"
    exit 1
fi

echo "📋 Creating dance teacher version from assistant base..."
cp cli.assistant.js cli.dance-teacher.js

echo "🔄 Applying dance teacher specializations..."

# 1. Update identity
sed -i 's/Claude Assistant/DanceTeach Assistant/g' cli.dance-teacher.js
sed -i 's/helpful AI personal assistant/AI assistant for dance teachers and studio owners/g' cli.dance-teacher.js

# 2. Update task focus
sed -i 's/daily tasks, research, planning, writing, and productivity/student tracking, progress notes, class planning, and studio management/g' cli.dance-teacher.js

# 3. Add dance terminology
sed -i 's/general assistance/dance teaching and student management/g' cli.dance-teacher.js

# 4. Update file descriptions
sed -i 's/your files/student files, class notes, and dance teaching materials/g' cli.dance-teacher.js

echo "✅ Dance teacher transformations complete!"
echo ""
echo "📝 Manual changes still needed:"
echo "   1. Update tone to be supportive for teachers (line ~399276)"
echo "   2. Add dance-specific tool usage (line ~136393)"
echo "   3. Customize file organization suggestions"
echo ""
echo "📖 See DANCE_TEACHER_GUIDE.md for detailed manual changes"
echo ""
echo "🎯 Output file: cli.dance-teacher.js"
echo ""
echo "🚀 Test with: node cli.dance-teacher.js"

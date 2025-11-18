# Quick Start: Transform Claude Code to AI Assistant

## 🚀 5-Minute Quick Start

### Step 1: Run the Automation Script
```bash
cd agent-mod
chmod +x transform.sh
./transform.sh
```

This automatically changes:
- ✅ "Claude Code" → "Claude Assistant"
- ✅ "software engineering" → "general assistance"
- ✅ "codebase" → "your files"
- ✅ "developer" → "user"

### Step 2: Make Key Manual Changes

Open `cli.assistant.js` in your editor and apply these critical changes:

#### Change 1: Line 136553 (Identity)
```javascript
// BEFORE:
var EUB = "You are Claude Code, Anthropic's official CLI for Claude.",

// AFTER:
var EUB = "You are Claude Assistant, a helpful AI personal assistant.",
```

#### Change 2: Line 399276-399280 (Emoji Policy)
```javascript
// FIND this line:
- Only use emojis if the user explicitly requests it. Avoid using emojis in all communication unless asked.

// REPLACE with:
- Be friendly and conversational. Use emojis when appropriate to add personality and warmth 😊
```

#### Change 3: Line 136420 (File Creation Policy)
```javascript
// FIND this line:
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.

// REPLACE with:
- Create files to help organize information, notes, todos, and documents.
```

#### Change 4: Line 136421 (Documentation Files)
```javascript
// FIND this line:
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

// REPLACE with:
- Feel free to create markdown files for better formatting and readability.
```

### Step 3: Test It!
```bash
# Method 1: Direct execution
node cli.assistant.js

# Method 2: Create an alias
echo "alias assistant='node $(pwd)/cli.assistant.js'" >> ~/.bashrc
source ~/.bashrc
assistant
```

---

## 🎯 What Changed?

| Aspect | Before (Coding) | After (Assistant) |
|--------|----------------|-------------------|
| **Identity** | Claude Code | Claude Assistant |
| **Focus** | Software engineering | General productivity |
| **Tone** | Professional, no emojis | Friendly, emojis welcome |
| **File Creation** | Avoid creating files | Create files freely |
| **Task Types** | Bug fixes, refactoring | Research, planning, notes |
| **Tools** | git, npm, docker | Any command-line tasks |

---

## 📖 Full Documentation

For complete details, see:
- **MODIFICATION_GUIDE.md** - Complete line-by-line changes
- **README.md** - Understanding the architecture

---

## ✅ Testing Your Modified CLI

Try these commands to verify it works:

```bash
# 1. Test basic conversation
assistant
> Hello! What can you help me with?

# 2. Test file creation
> Create a markdown file called todo.md with my weekly tasks

# 3. Test web search
> Search the web for information about productivity techniques

# 4. Test note organization
> Help me organize my meeting notes from this week
```

---

## 🛠️ Troubleshooting

### Issue: "Permission denied"
```bash
chmod +x cli.assistant.js
```

### Issue: "Module not found"
Make sure you're running from the `agent-mod` directory:
```bash
cd /path/to/agent-mod
node cli.assistant.js
```

### Issue: Modified version behaves like original
- Clear any caches
- Make sure you're running `cli.assistant.js`, not `cli.readable.js`
- Verify your changes saved with: `grep "Claude Assistant" cli.assistant.js`

---

## 🎨 Customization Ideas

Once you have the basic assistant working, you can further customize:

### 1. Add Custom Greeting
Find the initialization function and add:
```javascript
console.log("👋 Hello! I'm Claude Assistant, your AI helper!");
```

### 2. Change Default Behavior
Modify the system prompt to add:
```javascript
"Be proactive in offering productivity suggestions and organization help."
```

### 3. Add Custom Commands
Create shortcuts like:
- `/note` - Quick note taking
- `/todo` - Task management
- `/research` - Research mode

### 4. Customize for Your Domain
If you want a research assistant, add:
```javascript
"You specialize in academic research, literature reviews, and citation management."
```

---

## 📊 File Structure

```
agent-mod/
├── cli.original.js         # Original minified (9.8MB)
├── cli.readable.js         # Beautified (16MB)
├── cli.assistant.js        # Modified version
├── transform.sh            # Automation script
├── MODIFICATION_GUIDE.md   # Detailed changes
├── QUICK_START.md          # This file
└── README.md               # Architecture docs
```

---

## 🚀 Next Steps

1. ✅ Run `transform.sh`
2. ✅ Make 4 manual changes above
3. ✅ Test with `node cli.assistant.js`
4. ✅ Create alias or global command
5. ✅ Enjoy your AI assistant!

---

## 💡 Pro Tips

- **Keep both versions**: Maintain `cli.readable.js` for coding tasks
- **Version control**: Track your changes with git
- **Share your mods**: If you make cool improvements, share them!
- **Plugin ecosystem**: Build custom plugins for your specific needs

---

## 🎉 You're Done!

You now have a **general-purpose AI assistant** with all of Claude Code's power, but focused on helping with daily tasks instead of just coding!

Happy assisting! 🚀

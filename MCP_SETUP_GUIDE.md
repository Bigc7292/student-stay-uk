# StudentHome MCP Integration Setup Guide

## 🚀 Complete MCP Integration for StudentHome Platform

This guide provides step-by-step instructions to integrate the Vibe-Coder-MCP with your StudentHome application and Augment extension.

## 📋 Prerequisites

### 1. Install Node.js and npm
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
# Minimum required: Node.js v18.0.0+
```

### 2. Verify Repository Structure
```
student-stay-uk/
├── Vibe-Coder-MCP/          # Cloned MCP repository
├── src/                     # StudentHome source code
├── public/                  # Static assets
├── .env.local              # Environment variables
├── package.json            # Dependencies
└── mcp-integration.json    # MCP configuration
```

## 🔧 Step 1: Setup Vibe-Coder-MCP

### Windows Setup
```batch
# Navigate to MCP directory
cd Vibe-Coder-MCP

# Run setup script
.\setup.bat

# If Node.js is not found, install it first then retry
```

### Manual Setup (if script fails)
```bash
cd Vibe-Coder-MCP

# Install dependencies
npm install

# Build TypeScript project
npm run build

# Create environment file
copy .env.example .env
```

## 🔑 Step 2: Configure Environment Variables

### Update Vibe-Coder-MCP/.env
```env
# OpenRouter Configuration (Required for MCP)
OPENROUTER_API_KEY="your_openrouter_key_here"
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GEMINI_MODEL=google/gemini-2.5-flash-preview-05-20

# StudentHome API Keys
GOOGLE_MAPS_API_KEY="AIzaSyCJ8y-vOnm_EGMLnrBdBSDLOfF7krNYk8s"
RAPIDAPI_KEY="185071a5bfmsh670e0fb96e945b9p17c4aajsncc978fb964b2"
RAPIDAPI_HOST="uk-properties.p.rapidapi.com"
APIFY_TOKEN="apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ"
OPENRENT_ACTOR="vivid-softwares~openrent-scraper"
OPENAI_API_KEY="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"

# Output Directories
VIBE_CODER_OUTPUT_DIR="./VibeCoderOutput"
CODE_MAP_ALLOWED_DIR="../src"
VIBE_TASK_MANAGER_READ_DIR="../"
```

### Update StudentHome .env.local
```env
# Ensure all API keys are configured
VITE_GOOGLE_MAPS_API_KEY="AIzaSyCJ8y-vOnm_EGMLnrBdBSDLOfF7krNYk8s"
VITE_RAPIDAPI_KEY="185071a5bfmsh670e0fb96e945b9p17c4aajsncc978fb964b2"
VITE_RAPIDAPI_HOST="uk-properties.p.rapidapi.com"
VITE_APIFY_TOKEN="apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ"
VITE_OPENRENT_ACTOR="vivid-softwares~openrent-scraper"
VITE_OPENAI_API_KEY="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"
```

## ⚙️ Step 3: Configure Augment Extension

### Create .vscode/settings.json
```json
{
  "augment.mcpServers": {
    "studenthome-vibe-coder": {
      "command": "node",
      "args": ["./Vibe-Coder-MCP/build/index.js"],
      "cwd": "C:/Users/toplo/Desktop/ai_stuff/james_university_students/student-stay-uk",
      "transport": "stdio",
      "env": {
        "LLM_CONFIG_PATH": "C:/Users/toplo/Desktop/ai_stuff/james_university_students/student-stay-uk/Vibe-Coder-MCP/llm_config.json",
        "LOG_LEVEL": "debug",
        "NODE_ENV": "production",
        "VIBE_CODER_OUTPUT_DIR": "C:/Users/toplo/Desktop/ai_stuff/james_university_students/student-stay-uk/Vibe-Coder-MCP/VibeCoderOutput",
        "CODE_MAP_ALLOWED_DIR": "C:/Users/toplo/Desktop/ai_stuff/james_university_students/student-stay-uk/src",
        "VIBE_TASK_MANAGER_READ_DIR": "C:/Users/toplo/Desktop/ai_stuff/james_university_students/student-stay-uk",
        "GOOGLE_MAPS_API_KEY": "AIzaSyCJ8y-vOnm_EGMLnrBdBSDLOfF7krNYk8s",
        "RAPIDAPI_KEY": "185071a5bfmsh670e0fb96e945b9p17c4aajsncc978fb964b2",
        "APIFY_TOKEN": "apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ",
        "OPENAI_API_KEY": "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"
      },
      "disabled": false,
      "autoApprove": [
        "research",
        "generate-rules",
        "generate-user-stories",
        "generate-task-list",
        "generate-prd",
        "map-codebase",
        "run-workflow",
        "search-properties",
        "calculate-route",
        "ai-chat",
        "test-apis"
      ]
    }
  }
}
```

## 🧪 Step 4: Test MCP Integration

### Test MCP Server
```bash
# Test MCP server startup
cd Vibe-Coder-MCP
node build/index.js --test

# Should show: "MCP Server started successfully"
```

### Test StudentHome Application
```bash
# Start development server
npm run dev

# Open browser to http://localhost:8080
# Test navigation and API functionality
```

## 🔍 Step 5: Comprehensive Testing Protocol

### 1. Navigation Testing
- [ ] Test all primary navigation tabs (Home, Search, Maps, AI Assistant)
- [ ] Test "More Tools" dropdown functionality
- [ ] Test mobile navigation menu
- [ ] Verify navigation state management

### 2. API Integration Testing
- [ ] Test Google Maps API connectivity
- [ ] Test RapidAPI Zoopla integration
- [ ] Test Apify OpenRent integration
- [ ] Test OpenAI API functionality

### 3. Core Features Testing
- [ ] Property search with real data
- [ ] Route planning functionality
- [ ] AI assistant responses
- [ ] API key management interface

### 4. MCP Tools Testing
- [ ] Research tool functionality
- [ ] Code map generation
- [ ] Task management features
- [ ] Workflow execution

## 🚨 Troubleshooting

### Common Issues

#### 1. Node.js Not Found
```bash
# Install Node.js from https://nodejs.org/
# Restart terminal after installation
# Verify: node --version
```

#### 2. MCP Server Won't Start
```bash
# Check build directory exists
ls Vibe-Coder-MCP/build/

# Rebuild if necessary
cd Vibe-Coder-MCP
npm run build
```

#### 3. API Keys Not Working
```bash
# Verify environment variables
echo $VITE_GOOGLE_MAPS_API_KEY
echo $VITE_RAPIDAPI_KEY

# Check .env.local file exists and has correct values
```

#### 4. Augment Extension Not Connecting
- Restart VS Code completely
- Check .vscode/settings.json paths are absolute
- Verify MCP server is built and accessible

## ✅ Success Indicators

### MCP Integration Working
- [ ] Augment extension shows "studenthome-vibe-coder" server connected
- [ ] MCP tools available in Augment command palette
- [ ] No connection errors in VS Code output

### StudentHome Application Working
- [ ] All navigation buttons functional
- [ ] Real property data loading (not mock data)
- [ ] Google Maps displaying correctly
- [ ] AI assistant responding
- [ ] No console errors

### Full Integration Success
- [ ] Can use MCP tools to analyze StudentHome codebase
- [ ] Can generate documentation and tasks via MCP
- [ ] Can search properties and plan routes via web interface
- [ ] All APIs returning real data

## 🎯 Next Steps

1. **Get OpenRouter API Key**: Visit https://openrouter.ai/ to get API key for MCP functionality
2. **Test All Features**: Use the comprehensive test suite in the application
3. **Explore MCP Tools**: Try research, code analysis, and workflow tools
4. **Monitor Performance**: Check monitoring dashboard for API usage and performance

## 📞 Support

If you encounter issues:
1. Check console logs in browser (F12)
2. Check VS Code output panel for MCP errors
3. Verify all file paths are correct and absolute
4. Ensure all API keys are valid and have sufficient quota

The integration combines the power of Vibe-Coder-MCP's AI development tools with StudentHome's real property data and mapping capabilities for a complete student accommodation platform.

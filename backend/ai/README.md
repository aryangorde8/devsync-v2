# DevSync AI System

A fully custom AI system built for the DevSync developer portfolio platform. **No API keys required** - runs locally for privacy and cost-effectiveness.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Question                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Smart Response Engine (Instant)                    │
│  • DevSync-specific questions → Pre-built responses (<50ms)    │
│  • "How do I add a project?" → Instant answer                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Not matched?
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                RAG (Retrieval Augmented Generation)             │
│  • ChromaDB vector database                                     │
│  • sentence-transformers embeddings                             │
│  • Retrieves relevant DevSync documentation                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ollama LLM (Local)                           │
│  • llama3.2:1b (default) or custom fine-tuned model            │
│  • Augmented prompt with retrieved context                      │
│  • Generates accurate, contextual response (5-10s)              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### 1. Smart Response Engine (Instant)
Pre-built responses for common DevSync questions:
- Profile management (photo, bio, title)
- Skills, Projects, Experience, Education
- Portfolio improvement tips

### 2. RAG (Retrieval Augmented Generation)
Semantic search over DevSync knowledge base:
- 20+ curated documentation chunks
- CPU-friendly embeddings (all-MiniLM-L6-v2)
- ChromaDB for fast vector search

### 3. Local LLM (Ollama)
Privacy-focused, free inference:
- No API keys or external calls
- Runs on CPU (8GB RAM sufficient)
- Quantized models for speed

### 4. Optional: LoRA Fine-Tuning
Train your own model for free:
- Google Colab notebook included
- TinyLlama base (1.1B params)
- 30 DevSync-specific training examples

## 📦 Installation

### Quick Setup
```bash
cd backend
./ai/setup_ai.sh
```

### Manual Setup
```bash
# Install dependencies
pip install chromadb sentence-transformers

# Initialize knowledge base
python -c "from ai.rag import initialize_knowledge_base; initialize_knowledge_base()"

# Start server
python manage.py runserver 8001
```

## 🎯 Performance (on 8GB RAM, i5 CPU)

| Query Type | Response Time | Source |
|------------|---------------|--------|
| DevSync questions | <50ms | Smart Engine |
| General questions | 5-10s | RAG + Ollama |
| Portfolio analysis | 200ms (cached) | Database |

## 🔧 Configuration

Environment variables:
```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b  # or devsync-ai (fine-tuned)
OLLAMA_TIMEOUT=30
```

## 📊 Knowledge Base

The RAG system includes knowledge about:
- **Platform Overview** - What DevSync is
- **Profile Section** - Photo, bio, title tips
- **Skills Management** - Categories, proficiency
- **Projects** - Descriptions, demos, GitHub
- **Experience/Education** - Best practices
- **Interview Prep** - Using portfolio effectively
- **Technical Stack** - DevSync architecture

## 🎓 Fine-Tuning (Optional)

For the best "I built my own AI" story:

1. **Open Colab Notebook**
   - File: `ai/training_data/DevSync_LoRA_Training.ipynb`
   - Upload to Google Colab

2. **Run Training** (~15-30 min on free GPU)
   - Uses TinyLlama 1.1B base
   - LoRA adapter (small, efficient)
   - 30 DevSync-specific examples

3. **Deploy to Ollama**
   ```bash
   # Create Modelfile
   echo 'FROM tinyllama
   ADAPTER ./devsync-lora-adapter
   SYSTEM "You are DevSync AI assistant."' > Modelfile
   
   # Build model
   ollama create devsync-ai -f Modelfile
   
   # Use it
   export OLLAMA_MODEL=devsync-ai
   ```

## 📁 File Structure

```
ai/
├── rag.py                 # RAG system (ChromaDB, embeddings)
├── services.py            # Ollama service, caching
├── views.py               # API endpoints, Smart Engine
├── setup_ai.sh            # Quick setup script
├── chroma_db/             # Vector database (auto-created)
└── training_data/
    ├── devsync_qa.json    # Training examples
    └── DevSync_LoRA_Training.ipynb  # Colab notebook
```

## 🔒 Privacy & Cost

- **100% Local** - No external API calls
- **Zero Cost** - No subscription or per-token fees
- **Private** - User data never leaves the server
- **Open Source** - Full control over AI behavior

## 🛠️ Extending the Knowledge Base

Add more knowledge to `ai/rag.py`:

```python
DEVSYNC_KNOWLEDGE.append({
    "id": "custom_1",
    "content": "Your custom documentation here...",
    "metadata": {"category": "custom", "topic": "example"}
})
```

Then re-initialize:
```python
from ai.rag import initialize_knowledge_base
initialize_knowledge_base()
```

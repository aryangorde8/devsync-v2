#!/bin/bash
# DevSync AI Setup Script
# Sets up RAG (Retrieval Augmented Generation) for accurate AI responses

set -e

echo "🚀 DevSync AI Setup"
echo "=================="

cd "$(dirname "$0")/.."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run from backend directory with venv."
    exit 1
fi

# Activate venv
source venv/bin/activate

echo ""
echo "📦 Installing RAG dependencies..."
pip install chromadb==0.4.22 sentence-transformers==2.2.2 --quiet

echo ""
echo "🔧 Initializing knowledge base..."
python -c "
from ai.rag import initialize_knowledge_base, is_rag_available
if is_rag_available():
    result = initialize_knowledge_base()
    if result:
        print('✅ Knowledge base initialized successfully!')
    else:
        print('⚠️ Knowledge base initialization failed')
else:
    print('⚠️ RAG dependencies not available')
"

echo ""
echo "✅ DevSync AI Setup Complete!"
echo ""
echo "Features enabled:"
echo "  • RAG (Retrieval Augmented Generation)"
echo "  • Local Ollama model (free, private)"
echo "  • Smart Response Engine (instant for DevSync questions)"
echo ""
echo "Next steps:"
echo "  1. Make sure Ollama is running: ollama serve"
echo "  2. Pull the model: ollama pull llama3.2:1b"
echo "  3. Start the server: python manage.py runserver 8001"
echo ""
echo "Optional - Fine-tune your own model:"
echo "  1. Open ai/training_data/DevSync_LoRA_Training.ipynb in Google Colab"
echo "  2. Run all cells (free GPU)"
echo "  3. Download the adapter and follow the instructions"

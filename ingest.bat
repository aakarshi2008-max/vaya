@echo off
echo ============================================
echo   JULIE - MSMARCO-XI Ingestion Runner
echo ============================================
echo.
echo This will stream ai4bharat/MSMARCO-XI from HuggingFace
echo and index it into Qdrant with all 4 chunking strategies.
echo.
echo Make sure Qdrant + embedding service are running first!
echo (Run start.bat to launch them, or they're already running)
echo.

set QDRANT_URL=http://localhost:6333
set QDRANT_COLLECTION=msmarco_xi_passages
set EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
set LANGUAGES=hi,ta,bn,gu,mr
set INDEX_ENGLISH=1
set CHECKPOINT_DIR=.checkpoints

echo [1/4] Ingesting with: semantic_boundary
set CHUNKING_STRATEGY=semantic_boundary
python backend\ingest_msmarco_xi.py

echo.
echo [2/4] Ingesting with: hierarchical_parent_child
set CHUNKING_STRATEGY=hierarchical_parent_child
python backend\ingest_msmarco_xi.py

echo.
echo [3/4] Ingesting with: metadata_aware
set CHUNKING_STRATEGY=metadata_aware
python backend\ingest_msmarco_xi.py

echo.
echo [4/4] Ingesting with: adaptive_sliding_window
set CHUNKING_STRATEGY=adaptive_sliding_window
python backend\ingest_msmarco_xi.py

echo.
echo ============================================
echo   Ingestion complete for all 4 strategies!
echo ============================================
pause

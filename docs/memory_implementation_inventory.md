# Memory implementation inventory

Static imports include imports inside functions. This intentionally overapproximates
reachability. Unreached code is a candidate for manual review, not proof it is safe
to delete; dynamic loaders and compatibility entry points must also be checked.

| Module | Static status |
|---|---|
| `astra_ai.core.advanced_memory_retrieval` | Manual/dynamic/compatibility review required |
| `astra_ai.core.aegis_memory_integration` | Manual/dynamic/compatibility review required |
| `astra_ai.core.enhanced_aegis_memory_integration` | Manual/dynamic/compatibility review required |
| `astra_ai.core.learned_capabilities` | Reachable from backend |
| `astra_ai.core.learning` | Manual/dynamic/compatibility review required |
| `astra_ai.core.learning_declarations` | Reachable from backend |
| `astra_ai.core.research_learning` | Reachable from backend |
| `astra_ai.core.time_service` | Reachable from backend |
| `astra_ai.memory.Mem0_ai_organizer` | Reachable from backend |
| `astra_ai.memory.aegis_memory_interface` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.category_engine` | Reachable from backend |
| `astra_ai.memory.category_policy` | Reachable from backend |
| `astra_ai.memory.category_registry` | Reachable from backend |
| `astra_ai.memory.comprehensive_test` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.context_declarations` | Reachable from backend |
| `astra_ai.memory.conversation_persistence` | Reachable from backend |
| `astra_ai.memory.conversation_sessions` | Reachable from backend |
| `astra_ai.memory.daily_history` | Reachable from backend |
| `astra_ai.memory.entity_graph` | Reachable from backend |
| `astra_ai.memory.globe_actions` | Reachable from backend |
| `astra_ai.memory.globe_projection` | Reachable from backend |
| `astra_ai.memory.globe_topics` | Reachable from backend |
| `astra_ai.memory.historical_recovery` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.history_import` | Reachable from backend |
| `astra_ai.memory.impact_vector.improved_embedding_module` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.impact_vector.test_improved_embeddings` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.legacy_live_memory` | Reachable from backend |
| `astra_ai.memory.library` | Reachable from backend |
| `astra_ai.memory.live_memory` | Reachable from backend |
| `astra_ai.memory.mem0_memory_system` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.memory_actions` | Reachable from backend |
| `astra_ai.memory.memory_auto_optimizer` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.memory_data_models` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.memory_graph` | Reachable from backend |
| `astra_ai.memory.memory_intelligence` | Reachable from backend |
| `astra_ai.memory.memory_organization` | Reachable from backend |
| `astra_ai.memory.memory_processing_pipeline` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.memory_topics` | Reachable from backend |
| `astra_ai.memory.memory_types` | Reachable from backend |
| `astra_ai.memory.new_memory_event` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.new_memory_event_generator` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.nova_memory_interface` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.optimizer_integration` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.organizer_runtime` | Reachable from backend |
| `astra_ai.memory.persistent_rules` | Reachable from backend |
| `astra_ai.memory.retrieval_index` | Reachable from backend |
| `astra_ai.memory.semantic_recall` | Reachable from backend |
| `astra_ai.memory.shared_memory` | Reachable from backend |
| `astra_ai.memory.test_enhanced_memory` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.transcript_controls` | Reachable from backend |
| `astra_ai.memory.unified_memory_adapters` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.updated_mem0_memory_system` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.validate_enhanced_memory` | Manual/dynamic/compatibility review required |
| `astra_ai.memory.validate_implementation` | Manual/dynamic/compatibility review required |
| `astra_ai.nova-memory-server.scripts.unified_memory_integration` | Manual/dynamic/compatibility review required |
| `astra_ai.ui.backend.chat_stream` | Reachable from backend |
| `astra_ai.ui.backend.gemini_live` | Reachable from backend |
| `astra_ai.ui.backend.test_backend file.test_background_learning` | Manual/dynamic/compatibility review required |
| `astra_ai.ui.backend.test_backend file.test_gemini_live` | Manual/dynamic/compatibility review required |
| `astra_ai.ui.backend.test_backend file.test_learning_boundaries` | Manual/dynamic/compatibility review required |

## Existing parse failures outside the new implementation

- `astra_ai/speech/temp_end.py`
- `astra_ai/tests/check_standalone_file.py`
- `astra_ai/tests/check_storage_file.py`
- `astra_ai/tests/debug_file_paths.py`
- `astra_ai/tests/demonstrate_organizer.py`
- `astra_ai/tests/fixed_Mem0_ai_organizer.py`
- `astra_ai/tests/test_complete_integration.py`

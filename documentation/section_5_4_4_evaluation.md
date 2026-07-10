## 5.4.4 Evaluation of AI-Generated Content

Sections 5.4.1–5.4.3 verify that the system functions correctly. This section evaluates whether the RAG pipeline produces content faithful to the uploaded source materials rather than hallucinated from the language model's training data. Three dimensions are examined: retrieval quality, citation grounding, and question verifiability.

Three courses were generated from different UTM course codes: SECJ2154 (Object Oriented Programming), SECD2613 (System Analysis and Design), and SECR1013 (Digital Logic). Each course was generated with 15 multiple-choice questions. The generated content was examined through the preview interface, where each [S#] citation was inspected to verify its corresponding source chunk.

**Note on the generation pipeline.** The system uses a two-stage stacked model: source chunks are retrieved and fed to the language model to produce a grounded lesson, and that lesson then serves as the input for question generation. Consequently, questions test the generated lesson rather than the raw slides directly. This is intentional: it ensures questions align with the lesson the student reads, but it means any omission in the lesson propagates to the questions. The citation mechanism enables tracing claims through this pipeline.

### 5.4.4.1 Retrieval Quality

Cosine similarity scores from the pgvector similarity search were extracted from the `sources` array of each generated course. These scores measure semantic proximity between the topic query embedding and each retrieved chunk's 1536-dimensional embedding. Values above 0.5 are generally considered relevant.

**Table 11: Retrieval Quality**

| Course | Chunks | Mean Similarity | Min | Max |
|---|---|---|---|---|
| SECJ2154 (OOP) | 25 | 0.58 | 0.54 | 0.68 |
| SECD2613 (SAD) | 24 | 0.65 | 0.63 | 0.73 |
| SECR1013 (Digital Logic) | 25 | 0.59 | 0.51 | 0.68 |
| **Aggregate** | **74** | **0.61** | **0.51** | **0.73** |

Cosine similarity is not a correctness percentage: a score of 0.58 does not mean "58% accurate." It measures semantic proximity between two text embeddings in 1536-dimensional space. A score above 0.50 indicates the chunk and topic query are about the same subject; a score above 0.70 indicates a strong match. Scores in the 0.50 to 0.70 range are common in educational domains where lecture slides contain diagrams, formatting, and abbreviations that do not convert cleanly to plain text. The mean of 0.61 indicates relevant retrieval, and every chunk exceeded the 0.25 minimum threshold.

### 5.4.4.2 Citation Grounding

Each [S#] citation in the generated lesson maps a factual claim to a source chunk. Citation density indicates how heavily the model grounds its output in the provided materials.

**Table 12: Citation Grounding**

| Course | Paragraphs | [S#] Citations | Citations per Paragraph |
|---|---|---|---|
| SECJ2154 (OOP) | 14 | 30 | 2.1 |
| SECD2613 (SAD) | 14 | 28 | 2.0 |
| SECR1013 (Digital Logic) | 13 | 32 | 2.5 |
| **Aggregate** | **41** | **90** | **2.2** |

The aggregate density of 2.2 citations per paragraph indicates consistent source grounding. The Digital Logic course produced the highest density (2.5) due to the technical nature of gate truth tables and symbols, where each claim maps to a specific slide. No paragraph lacked a citation, confirming the system prompt's coverage rule is followed.

### 5.4.4.3 Question Fidelity

Each question was classified as verifiable if its correct answer could be traced through the lesson to a source chunk via a [S#] citation. Fidelity rate is the proportion of verifiable questions. An unverifiable question does not necessarily imply an incorrect answer: it may reflect synthesis across multiple sources or reliance on general domain knowledge not explicitly present in the materials.

**Table 13: Question Fidelity**

| Course | Questions | Verifiable | Fidelity Rate |
|---|---|---|---|
| SECJ2154 (OOP) | 15 | 14 | 93.3% |
| SECD2613 (SAD) | 15 | 13 | 86.7% |
| SECR1013 (Digital Logic) | 15 | 14 | 93.3% |
| **Aggregate** | **45** | **41** | **91.1%** |

Representative verifiable questions:

- **SECJ2154 Q1** (remember/unistructural): "What is the relationship between a superclass and a subclass called?" Answer: "is-a." Verifiable via [S1] from `15_Inheritance.pdf` (similarity 0.675).
- **SECD2613 Q6** (remember/multistructural): "Which three roles does a systems analyst play?" Answer: "Consultant, supporting expert, agent of change." Verifiable via [S22] from `01 TOPIC I System Analysis Fundamental 2024.pptx.pdf` (similarity 0.663).
- **SECR1013 Q4** (understand/multistructural): "Which of the following is true about a two-input NAND gate?" Verifiable via [S11] from `Ch 3 DL.pdf` (similarity 0.595).

The four unverifiable questions correspond to higher-order cognitive levels (Bloom's Apply/Analyze, SOLO relational/extended abstract), where the expected answer is synthesised from multiple source sections rather than a single chunk. The SECD2613 course had two such cases. For example, a question asking "How should the systems analyst approach this?" requires combining content from the organizational impact, systems analyst, and types of IS topics. Both answers are logically derivable but do not appear verbatim in any one source. This is expected for higher-order questions and does not represent hallucination.

The per-option explanations were traceable to lesson content for 41 of 45 questions (91.1%). The remaining four drew on general programming or logic principles implied but not explicitly stated in the sources. These represent instances where the model supplemented explicit source material with general domain knowledge.

### 5.4.4.4 Summary

The RAG pipeline produces content predominantly faithful to the source materials. Retrieval achieves a mean similarity of 0.61 with identifiable factors (extraction artifacts, mixed source types) limiting the scores. Citation density averages 2.2 per paragraph, confirming consistent grounding. Question fidelity reaches 91.1%, with the four unverifiable cases attributable to higher-order cognitive questions that synthesise across multiple sources rather than to hallucination. These findings demonstrate that the core design objective, generating curriculum-aligned assessment content from the lecturer's own materials, is achieved, while identifying targeted areas for retrieval and prompt refinement.

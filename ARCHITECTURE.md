# Prototype Architecture

```text
Customer
   ↓
Chatbot Interface
   ↓
Text Normalisation
   ↓
Simple Intent Recognition ─────→ Customer-support intent
   ↓
Frustration/Anger Recognition
   ↓
Appropriate Response
   ↓
Human Escalation Guidance when required
```

## Design rationale
The dissertation calls for a **simple AI chatbot prototype** to showcase basic AI functions, including recognising whether a customer is angry and responding accordingly. The architecture therefore stays deliberately simple, transparent and reproducible.

The prototype does not claim to be a production large-language-model system. Its intention/sentiment rules are explicit so that the marker can inspect, reproduce and test the behaviour.

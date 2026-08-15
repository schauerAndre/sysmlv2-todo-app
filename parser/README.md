# sysml-todo-json-extractor

A purpose-built, minimal extractor — **not a SysML v2 parser**. It reads the specific comment/keyword conventions used in `../spec/*.sysml` (the tool specification: use cases, requirements, architecture, traceability, test cases, physical architecture) and `../data/*.sysml` (the data model, its metadata extensions, and task-list instance data) — `@id`, `@trace`, `use case def`, `requirement def`, `occurrence ... : Task`, `verification def` — and turns them into `../generated/todo-model.generated.json`.

It will not work on arbitrary SysML v2 source, and it does not validate the model. The "professional path" described in the top-level README (e.g. Sensmetry Syside Automator) is what a real, spec-compliant extraction would look like.

## Run

```bash
node extract.js
```

No dependencies, no build step — plain Node.js, regex-based, on purpose. That's the entire point of the "public demo path": anyone can run this without a commercial license.

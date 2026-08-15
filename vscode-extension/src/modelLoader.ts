import * as fs from "fs";
import * as path from "path";

export interface TodoTask {
  id: string;
  title: string;
  description: string;
  status: "open" | "inProgress" | "completed";
  priority: "low" | "medium" | "high";
  // The actual data-model relationship (which TodoList this Task occurrence
  // belongs to, from that list's `tasks = (...)` tuple) -- see
  // parser/extract.js. Deliberately not a requirement/use-case link: those
  // aren't part of the data model, see specs/001-task-panel-redesign's
  // superseded Decision 4 in research.md.
  listId: string | null;
}

export interface TodoList {
  id: string;
  name: string;
}

export interface MetadataTag {
  tag: string;
  targetId: string | null;
}

export interface TodoModel {
  useCases: { id: string; name: string; description: string | null }[];
  requirements: { id: string; name: string; text: string | null }[];
  tasks: TodoTask[];
  lists: TodoList[];
  testCases: { id: string; name: string; description: string | null; implementedBy: string | null }[];
  // type is "derive" (use case -> requirement), "satisfy" (requirement -> the
  // app/system, id ARCH-APP — NOT any individual task), or "verify"
  // (requirement -> test case) — see spec/03-architecture.sysml and
  // spec/04-traceability.sysml. Tasks are example content the app manages; they
  // are never the "to" of a satisfy link, so there is intentionally no
  // relatedRequirementsForTask() here.
  traceability: { from: string; to: string; type: "derive" | "satisfy" | "verify" }[];
  metadataTags: MetadataTag[];
}

const EMPTY_MODEL: TodoModel = {
  useCases: [],
  requirements: [],
  tasks: [],
  lists: [],
  testCases: [],
  traceability: [],
  metadataTags: [],
};

/**
 * Loads the JSON produced by parser/extract.js.
 * This does not read .sysml files directly — the extractor is a separate,
 * explicit step. The extension only ever consumes its output.
 */
export function loadTodoModel(workspaceRoot: string): TodoModel {
  const generatedPath = path.join(workspaceRoot, "generated", "todo-model.generated.json");
  if (!fs.existsSync(generatedPath)) {
    return EMPTY_MODEL;
  }
  const raw = fs.readFileSync(generatedPath, "utf8");
  return { ...EMPTY_MODEL, ...(JSON.parse(raw) as Partial<TodoModel>) };
}


#!/usr/bin/env node
/**
 * sysml-todo-json-extractor
 *
 * Purpose-built demo extractor for the SysML v2 To-Do digital thread series.
 * This is NOT a SysML v2 parser. It reads the specific `@id` comment
 * convention (for stable IDs) plus REAL SysML v2 relationship syntax --
 * `satisfy requirement ... by ...`, `verify requirement ...`, and
 * `dependency ... from ... to ...` -- and turns them into JSON.
 *
 * It will not work on arbitrary SysML v2 source: it assumes the specific
 * layout used in this repo's spec/*.sysml (tool specification) and
 * data/*.sysml (data model + instance data) files.
 *
 * Usage: node extract.js
 */
const fs = require("fs");
const path = require("path");

const specDir = path.join(__dirname, "..", "spec");
const dataDir = path.join(__dirname, "..", "data");
const outFile = path.join(__dirname, "..", "generated", "todo-model.generated.json");

function readSpec(fileName) {
  return fs.readFileSync(path.join(specDir, fileName), "utf8");
}

function readData(fileName) {
  return fs.readFileSync(path.join(dataDir, fileName), "utf8");
}

// A qualified name like `TodoRequirements::CreateTaskRequirement` or
// `TodoUseCases::CreateTask` -- we only ever need the last segment to look
// elements up by name.
function lastSegment(qualifiedName) {
  const parts = qualifiedName.split("::");
  return parts[parts.length - 1];
}

function extractUseCases(src) {
  const results = [];
  const re = /\/\/ @id: (UC-\d+)\s*\n\s*use case def (\w+)\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, id, name, body] = m;
    const doc = /doc \/\*([\s\S]*?)\*\//.exec(body);
    results.push({ id, name, description: doc ? doc[1].trim() : null });
  }
  return results;
}

function extractRequirements(src) {
  const results = [];
  const re = /\/\/ @id: (REQ-[\w-]+)\s*\n\s*requirement def (\w+)\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, id, name, body] = m;
    const doc = /doc \/\*([\s\S]*?)\*\//.exec(body);
    results.push({ id, name, text: doc ? doc[1].trim() : null });
  }
  return results;
}

function extractParts(src, metaTag) {
  // Matches `// @id: XXX` + `#<metaTag> occurrence <varName> { ... };`
  // (the language-extension metadata usage form -- see TaskMeta/TodoListMeta
  // in 01-data-model.sysml -- which replaced the plain `occurrence x : Type`
  // usage form these specs used previously).
  const results = [];
  const re = new RegExp(
    `\\/\\/ @id: ([\\w-]+)\\s*\\n\\s*#${metaTag} occurrence (\\w+)\\s*\\{([\\s\\S]*?)\\n\\s*\\};?`,
    "g"
  );
  let m;
  while ((m = re.exec(src))) {
    const [, id, varName, body] = m;
    const field = (name) => {
      const fm = new RegExp(`:>>\\s*${name}\\s*=\\s*"([^"]*)"`).exec(body);
      return fm ? fm[1] : null;
    };
    const enumField = (name) => {
      const fm = new RegExp(`:>>\\s*${name}\\s*=\\s*\\w+::(\\w+)`).exec(body);
      return fm ? fm[1] : null;
    };
    results.push({ id, varName, body, field, enumField });
  }
  return results;
}

function extractTasks(src) {
  return extractParts(src, "task").map(({ id, varName, field, enumField }) => ({
    id,
    varName,
    title: field("title"),
    description: field("description"),
    status: enumField("status"),
    priority: enumField("priority"),
  }));
}

function extractLists(src) {
  // Also captures the `occurrence :>> tasks = (task001, task002);` tuple --
  // this is the actual data-model relationship (a TodoList's member Task
  // occurrences), used by main() to tag each task with its containing
  // list's id.
  return extractParts(src, "toDoList").map(({ id, varName, field, body }) => {
    const tasksMatch = /:>>\s*tasks\s*=\s*\(([^)]*)\)/.exec(body);
    const taskVarNames = tasksMatch
      ? tasksMatch[1]
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
    return { id, varName, name: field("name"), taskVarNames };
  });
}

function extractSatisfyLinks(src) {
  const results = [];
  const re = /satisfy requirement \w+\s*:\s*([\w:]+)\s+by\s+(\w+)\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    results.push({ reqName: lastSegment(m[1]), subjectVarName: m[2] });
  }
  return results;
}

// Matches `// @id: ARCH-XXX` + `part <varName>` (typed or untyped) -- used to
// resolve the subject of `satisfy ... by <varName>;` in 03-architecture.sysml
// back to a stable ID.
function extractArchPartIds(src) {
  const results = [];
  // `(?!def\b)` excludes `part def X` (a definition, not a usage) -- only
  // plain `part <name>` usages are valid satisfy subjects. `(?:\/\/.*\n\s*)*`
  // skips over any additional explanatory comment lines between the @id tag
  // and the actual `part` declaration.
  const re = /\/\/ @id: (ARCH-[\w-]+)\s*\n(?:\s*\/\/.*\n)*\s*part (?!def\b)(\w+)/g;
  let m;
  while ((m = re.exec(src))) {
    results.push({ id: m[1], varName: m[2] });
  }
  return results;
}

function extractMetadataTags(src) {
  // Matches the inline `@tagName;` annotation as the first statement inside
  // a `#metaTag occurrence <varName> { ... }` body (e.g. `@criticalPath;`,
  // `@sprintBacklog;`), keyed to the usage it annotates.
  const results = [];
  const re = /#\w+ occurrence (\w+)\s*\{\s*\n\s*@(\w+);/g;
  let m;
  while ((m = re.exec(src))) {
    results.push({ tag: m[2], targetVarName: m[1] });
  }
  return results;
}

function extractDependencies(src) {
  const results = [];
  const re = /dependency \w+ from ([\w:]+) to ([\w:]+)\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    results.push({ fromName: lastSegment(m[1]), toName: lastSegment(m[2]) });
  }
  return results;
}

// Implements the KerML doc-body cleanup rule (BNF Documentation notes): strip
// leading whitespace per line, then a leading "*", then one leading space.
function cleanDocBody(rawBody) {
  return rawBody
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trimEnd())
    .filter((line) => line.length > 0)
    .join(" ")
    .trim();
}

function extractTestCases(src) {
  // Each verification def's objective carries `verify requirement
  // verifiedRequirement : <ReqDefName>;` -- the def-level (unbound) REQ ->
  // TEST link. This is the real source of the "verify" trace type: the
  // matching bound usage in 03-architecture.sysml (`verify satisfies... :>>
  // verifiedRequirement;`) only re-confirms the same link against a concrete
  // subject, it doesn't carry the target requirement's name itself.
  const results = [];
  const verifyLinks = [];
  const re = /\/\/ @id: (TEST-\d+)\s*\n\s*verification def (\w+)\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, id, name, body] = m;
    const doc = /doc\s*\n?\s*\/\*([\s\S]*?)\*\//.exec(body);
    const implementedBy = /\/\/ @implementedBy:\s*(\S+)/.exec(body);
    results.push({
      id,
      name,
      description: doc ? cleanDocBody(doc[1]) : null,
      implementedBy: implementedBy ? implementedBy[1] : null,
    });

    const verifyMatch = /verify requirement \w+\s*:\s*([\w:]+)\s*;/.exec(body);
    if (verifyMatch) {
      verifyLinks.push({ testId: id, reqName: lastSegment(verifyMatch[1]) });
    }
  }
  return { testCases: results, verifyLinks };
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((l) => {
    const key = `${l.from}->${l.to}:${l.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function main() {
  const useCasesSrc = readSpec("01-use-cases.sysml");
  const requirementsSrc = readSpec("02-requirements.sysml");
  const architectureSrc = readSpec("03-architecture.sysml");
  const traceabilitySrc = readSpec("04-traceability.sysml");
  const testCasesSrc = readSpec("05-test-cases.sysml");
  const taskListSrc = readData("02-task-list-specification.sysml");

  const useCases = extractUseCases(useCasesSrc);
  const requirements = extractRequirements(requirementsSrc);
  const tasks = extractTasks(taskListSrc);
  const lists = extractLists(taskListSrc);
  const { testCases, verifyLinks } = extractTestCases(testCasesSrc);
  // REQ -> system satisfaction lives in 03-architecture.sysml: the running
  // app satisfies its requirements, not any individual example task.
  const satisfyLinks = extractSatisfyLinks(architectureSrc);
  const archPartIds = extractArchPartIds(architectureSrc);
  const dependencyLinks = extractDependencies(traceabilitySrc);
  const metadataTagRefs = extractMetadataTags(taskListSrc);

  // Name -> ID lookup tables, built from what we already extracted.
  const ucIdByName = Object.fromEntries(useCases.map((u) => [u.name, u.id]));
  const reqIdByName = Object.fromEntries(requirements.map((r) => [r.name, r.id]));
  const taskIdByVar = Object.fromEntries(tasks.map((t) => [t.varName, t.id]));
  const listIdByVar = Object.fromEntries(lists.map((l) => [l.varName, l.id]));
  const archIdByVar = Object.fromEntries(archPartIds.map((a) => [a.varName, a.id]));
  const idByVar = { ...taskIdByVar, ...listIdByVar, ...archIdByVar };

  // Task -> containing TodoList, from each list's own `tasks = (...)` tuple
  // (the real data-model relationship -- see extractLists).
  const listIdByTaskVar = {};
  for (const list of lists) {
    for (const taskVarName of list.taskVarNames) {
      listIdByTaskVar[taskVarName] = list.id;
    }
  }

  const traceability = dedupeLinks([
    // UC -> REQ, from `dependency ... from <req> to <uc>;` in 04-traceability.sysml
    ...dependencyLinks.map((d) => ({
      from: ucIdByName[d.toName],
      to: reqIdByName[d.fromName],
      type: "derive",
    })),
    // REQ -> SYSTEM, from `satisfy requirement <ref> by <subject>;` in 03-architecture.sysml
    ...satisfyLinks.map((s) => ({
      from: reqIdByName[s.reqName],
      to: archIdByVar[s.subjectVarName],
      type: "satisfy",
    })),
    // REQ -> TEST, from `verify requirement verifiedRequirement : <ReqDef>;`
    // inside each verification def's objective, in 05-test-cases.sysml
    ...verifyLinks.map((v) => ({
      from: reqIdByName[v.reqName],
      to: v.testId,
      type: "verify",
    })),
  ]);

  const metadataTags = metadataTagRefs.map((t) => ({
    tag: t.tag,
    targetId: idByVar[t.targetVarName] || null,
  }));

  const output = {
    useCases,
    requirements: requirements.map(({ id, name, text }) => ({ id, name, text })),
    tasks: tasks.map(({ id, varName, title, description, status, priority }) => ({
      id,
      title,
      description,
      status,
      priority,
      listId: listIdByTaskVar[varName] || null,
    })),
    lists: lists.map(({ id, name }) => ({ id, name })),
    testCases,
    traceability,
    metadataTags,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(
    `Extracted ${output.useCases.length} use cases, ${output.requirements.length} requirements, ` +
      `${output.tasks.length} tasks, ${output.lists.length} lists, ${output.testCases.length} test cases, ` +
      `${output.traceability.length} trace links (derive/satisfy/verify), ${output.metadataTags.length} metadata tags ` +
      `-> ${path.relative(process.cwd(), outFile)}`
  );

  const unresolved = output.traceability.filter((l) => !l.from || !l.to);
  if (unresolved.length) {
    console.warn(`WARNING: ${unresolved.length} trace link(s) could not be fully resolved:`, unresolved);
  }
}

main();

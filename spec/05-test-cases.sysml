package TodoTestCases {
    private import TodoUseCases::*;
    private import TodoRequirements::*;

    // These are DEFINITIONS: templates that say "a test of this kind verifies
    // a requirement of that kind" (subject unbound, verify target unbound to
    // any real requirement instance). `verify` only makes a real trace link
    // once both sides are USAGES with a concrete subject -- see the
    // `verifies...` verification usages in 03-architecture.sysml, which
    // redefine `verifiedRequirement` against the `satisfies...` requirement
    // usages there (mirroring how `satisfy` is done in the same file). The
    // @id comment below only exists so this demo's own extractor can assign
    // a stable, human-friendly ID.
    //
    // `@implementedBy` closes the other end of the thread: it points at the
    // real, runnable software test (../tests/todo-app.test.js) that actually
    // exercises the app against this verification case's Given/When/Then. Run
    // `node --test tests/` from the repo root to execute them for real.

    // @id: TEST-001
    verification def CreateTaskTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : CreateTaskRequirement;
        }
        doc
        /*
         * Given an empty task list,
         * when the user creates a task with the title "Buy milk",
         * then the list contains exactly one task with that title and status "open".
         */
        // @implementedBy: tests/todo-app.test.js#CreateTaskTest
    }

    // @id: TEST-002
    verification def ViewTasksTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : ViewTasksRequirement;
        }
        doc
        /*
         * Given a list with one open and one completed task,
         * when the user views the task list,
         * then both tasks are shown, each with its correct status.
         */
        // @implementedBy: tests/todo-app.test.js#ViewTasksTest
    }

    // @id: TEST-003
    verification def CompleteTaskTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : CompleteTaskRequirement;
        }
        doc
        /*
         * Given a list with one open task,
         * when the user marks that task as completed,
         * then the task's status changes to "completed" and no other task is affected.
         */
        // @implementedBy: tests/todo-app.test.js#CompleteTaskTest
    }

    // @id: TEST-004
    verification def DeleteTaskTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : DeleteTaskRequirement;
        }
        doc
        /*
         * Given a list with two tasks,
         * when the user deletes one of them,
         * then the list contains exactly the remaining task.
         */
        // @implementedBy: tests/todo-app.test.js#DeleteTaskTest
    }

    // @id: TEST-005
    verification def PersistTasksTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : PersistTasksRequirement;
        }
        doc
        /*
         * Given a list with two tasks,
         * when the application is restarted,
         * then both tasks are still present with their prior status and priority unchanged.
         */
        // @implementedBy: tests/todo-app.test.js#PersistTasksTest
    }

    // Added by specs/001-task-panel-redesign's tasks-sync hook. Only
    // EditTaskFieldsRequirement gets an automated test case here at this
    // point: BrowseTaskPanelRequirement/ViewTaskDetailsRequirement were
    // validated manually via that feature's quickstart.md (see research.md
    // Decision 5), since no webview test harness existed yet. TEST-012/013
    // below close that gap once tests/webview-harness.js was added.

    // @id: TEST-006
    verification def EditTaskFieldsTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : EditTaskFieldsRequirement;
        }
        doc
        /*
         * Given a task's current status or priority value in
         * data/02-task-list-specification.sysml,
         * when the panel patches that task's status or priority field,
         * then only the targeted line in the file changes and the new value
         * round-trips correctly through parser/extract.js.
         */
        // @implementedBy: tests/sysml-task-writer.test.js#patchTask
    }

    // Added by specs/002-create-delete-tasks's tasks-sync hook.
    // REQ-TODO-001/REQ-TODO-004 already had TEST-001/TEST-004 verifying them
    // via the app/todoApp.js reference implementation; these two add a
    // second, independent verification via the extension's own SysML writer
    // path (data/02-task-list-specification.sysml -> parser/extract.js),
    // which is a genuinely different code path exercising the same
    // requirement -- not a duplicate.

    // @id: TEST-007
    verification def CreateTaskViaPanelTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : CreateTaskRequirement;
        }
        doc
        /*
         * Given the current contents of data/02-task-list-specification.sysml,
         * when the panel's writer adds a new task occurrence and appends it
         * to the backlog's tasks list,
         * then the new task gets a fresh, non-colliding id and the file
         * round-trips correctly through parser/extract.js.
         */
        // @implementedBy: tests/sysml-task-writer.test.js#addTask
    }

    // @id: TEST-008
    verification def DeleteTaskViaPanelTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : DeleteTaskRequirement;
        }
        doc
        /*
         * Given a task's occurrence block and its reference in the backlog's
         * tasks list in data/02-task-list-specification.sysml,
         * when the panel's writer deletes that task,
         * then both the occurrence block and its tasks-list reference are
         * removed with no dangling reference left behind.
         */
        // @implementedBy: tests/sysml-task-writer.test.js#deleteTask
    }

    // Added by specs/003-model-explorer's tasks-sync hook. All three new
    // requirements have explicit test tasks (tasks.md T004/T009/T013), so
    // unlike 001's BrowseTaskPanel/ViewTaskDetails (manual-quickstart-only),
    // all three get real TEST-* cases here.

    // @id: TEST-009
    verification def BrowseModelTreeTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : BrowseModelTreeRequirement;
        }
        doc
        /*
         * Given a model with a known number of use cases, requirements, and
         * test cases,
         * when buildTree() groups them,
         * then each group has the correct count and child list, and an empty
         * model produces three empty groups rather than an error.
         */
        // @implementedBy: tests/model-explorer.test.js#buildTree
    }

    // @id: TEST-010
    verification def NavigateToModelSourceTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : NavigateToModelSourceRequirement;
        }
        doc
        /*
         * Given a fixture source file's text and a known element id,
         * when resolveSourceLocation() searches for that id's "// @id:" line,
         * then it returns the correct line, and throws a descriptive error
         * for an id that isn't present.
         */
        // @implementedBy: tests/model-explorer.test.js#resolveSourceLocation
    }

    // @id: TEST-011
    verification def ViewTraceabilityAsTreeTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : ViewTraceabilityAsTreeRequirement;
        }
        doc
        /*
         * Given a requirement with both a derive and a verify link and one
         * with neither,
         * when buildTree() computes its trace-link children,
         * then only the linked requirement gets "Derived from"/"Verified by"
         * children, and the unlinked one gets none, not an error.
         */
        // @implementedBy: tests/model-explorer.test.js#buildTree
    }

    // Added retroactively, once tests/webview-harness.js (a real Playwright
    // driver for the extension's actual webview markup) existed to make
    // BrowseTaskPanelRequirement/ViewTaskDetailsRequirement's coverage equal
    // to every other requirement's -- see the note on TEST-006 above. Before
    // this, those two were the only requirements verified solely by manual
    // quickstart steps, not a runnable test.

    // @id: TEST-012
    verification def BrowseTaskPanelTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : BrowseTaskPanelRequirement;
        }
        doc
        /*
         * Given the panel rendered with two demo tasks, one of which matches
         * the text "linkedin",
         * when the user types "linkedin" into the filter box,
         * then only the matching task row remains and the tab counts update
         * to reflect the filtered set.
         */
        // @implementedBy: tests/webview-harness.js#"filter narrows the list and updates tab counts"
    }

    // @id: TEST-013
    verification def ViewTaskDetailsTest {
        subject app : TodoApp;
        objective {
            verify requirement verifiedRequirement : ViewTaskDetailsRequirement;
        }
        doc
        /*
         * Given the panel rendered with two demo tasks, each belonging to
         * the "Backlog" TodoList,
         * when the user clicks a task row,
         * then the Task Details view shows that task's full details,
         * including the containing TodoList's id and name.
         */
        // @implementedBy: tests/webview-harness.js#"clicking a row populates Task Details with its containing list"
    }
}

package TodoRequirements {
    private import TodoUseCases::*;
    private import TodoTestCases::*;

    // Note: SysML v2 (this release) has no dedicated `derive` keyword for
    // linking a use case to a requirement (the library's `Derivation`
    // connection type only relates requirement-to-requirement). The UC -> REQ
    // link is therefore expressed as a generic `dependency` in
    // 04-traceability.sysml, not here. `verify`, below, IS a first-class
    // requirement-body construct (see BNF RequirementBodyItem ->
    // RequirementVerificationMember) and is used directly.

    // @id: REQ-TODO-001
    requirement def CreateTaskRequirement {
        doc /* The user shall be able to create a new task with a title. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-002
    requirement def ViewTasksRequirement {
        doc /* The system shall display all tasks together with their status. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-003
    requirement def CompleteTaskRequirement {
        doc /* The user shall be able to mark a task as completed. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-004
    requirement def DeleteTaskRequirement {
        doc /* The user shall be able to delete a task. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-005
    requirement def PersistTasksRequirement {
        doc /* The system shall persist tasks between application restarts. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-006
    requirement def BrowseTaskPanelRequirement {
        doc /* The system shall provide a dedicated panel for browsing and filtering tasks by status and free-text search. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-007
    requirement def ViewTaskDetailsRequirement {
        doc /* The system shall show each task's full details, including which TodoList it belongs to, derived from the actual data model relationship -- not requirements/use cases, which are not part of the data model. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-008
    requirement def EditTaskFieldsRequirement {
        doc /* The system shall allow editing a task's status and priority from the panel, persisting changes back to the SysML model. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-009
    requirement def BrowseModelTreeRequirement {
        doc /* The system shall provide a tree view of the model's use cases, requirements, and test cases. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-010
    requirement def NavigateToModelSourceRequirement {
        doc /* The system shall let the user navigate from a tree element to its declaration in the SysML source. */
        subject app : TodoApp;
    }

    // @id: REQ-TODO-011
    requirement def ViewTraceabilityAsTreeRequirement {
        doc /* The system shall show a requirement's derive/verify traceability links as tree children. */
        subject app : TodoApp;
    }
}

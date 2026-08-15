package TodoTraceability {
    private import TodoUseCases::*;
    private import TodoRequirements::*;

    doc
    /*
     * This file only carries the UC -> REQ links. REQ -> TASK ("satisfy") and
     * REQ -> TEST ("verify") both live in 03-architecture.sysml, as usages
     * bound to the actual system instance `todoDigitalThread` -- `satisfy`
     * and `verify` only form a real trace link between usages with a
     * concrete subject, not between the bare definitions in
     * 02-requirements.sysml / 05-test-cases.sysml. Both are first-class
     * SysML v2 constructs, so they're declared where the satisfying/verifying
     * element is defined, not centralized here.
     *
     * UC -> REQ uses a generic `dependency`, not `satisfy`/`verify`/`Derivation`:
     * this SysML v2 release has no dedicated use-case-to-requirement relationship
     * kind. `dependency ... from client to supplier` is the general-purpose,
     * always-valid fallback for a link that doesn't fit a more specific construct.
     */

    dependency deriveReq001 from TodoRequirements::CreateTaskRequirement to TodoUseCases::CreateTask;
    dependency deriveReq002 from TodoRequirements::ViewTasksRequirement to TodoUseCases::ViewTasks;
    dependency deriveReq003 from TodoRequirements::CompleteTaskRequirement to TodoUseCases::CompleteTask;
    dependency deriveReq004 from TodoRequirements::DeleteTaskRequirement to TodoUseCases::DeleteTask;
    dependency deriveReq005 from TodoRequirements::PersistTasksRequirement to TodoUseCases::PersistTasks;
    dependency deriveReq006 from TodoRequirements::BrowseTaskPanelRequirement to TodoUseCases::BrowseTaskPanel;
    dependency deriveReq007 from TodoRequirements::ViewTaskDetailsRequirement to TodoUseCases::ViewTaskDetails;
    dependency deriveReq008 from TodoRequirements::EditTaskFieldsRequirement to TodoUseCases::EditTaskFields;
    dependency deriveReq009 from TodoRequirements::BrowseModelTreeRequirement to TodoUseCases::BrowseModelTree;
    dependency deriveReq010 from TodoRequirements::NavigateToModelSourceRequirement to TodoUseCases::NavigateToModelSource;
    dependency deriveReq011 from TodoRequirements::ViewTraceabilityAsTreeRequirement to TodoUseCases::ViewTraceabilityAsTree;
}

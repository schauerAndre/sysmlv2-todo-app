package TodoDataModel {
    private import ScalarValues::*;
    private import Metaobjects::SemanticMetadata;

    enum def TaskStatus {
        enum open;
        enum inProgress;
        enum completed;
    }

    enum def TaskPriority {
        enum low;
        enum medium;
        enum high;
    }

    // @id: DM-TASK
    abstract occurrence def Task {
        attribute id : String;
        attribute title : String;
        attribute description : String;
        attribute status : TaskStatus;
        attribute priority : TaskPriority;
        attribute createdAt : String;
        attribute updatedAt : String;
    }

    abstract occurrence tasks : Task [0..*] nonunique;

    metadata def <task> TaskMeta :> SemanticMetadata {
        :> annotatedElement : SysML::OccurrenceUsage;
        :>> baseType = tasks meta SysML::Usage;
    }

    // @id: DM-TODOLIST
    abstract occurrence def TodoList {
        attribute id : String;
        attribute name : String;
        occurrence tasks : Task [0..*];
    }

    abstract occurrence lists : TodoList [0..*] nonunique;

    metadata def <toDoList> TodoListMeta :> SemanticMetadata {
        :> annotatedElement : SysML::OccurrenceUsage;
        :>> baseType = lists meta SysML::Usage;
    }

    // Language-extension metadata for Task and TodoList usages, following the exact
    // pattern the standard library itself uses in
    // "Domain Libraries/Requirement Derivation/RequirementDerivation.sysml"
    // (metadata def <alias> Name :> SemanticMetadata { :> annotatedElement ...; :>> baseType ...; }).
    //
    // These are project-management concepts (critical path, active sprint) kept
    // as bolt-on tags on specific Task/TodoList usages rather than as attributes
    // on the part defs above, since not every task/list needs them.

    occurrence taggedTasks : Task [0..*];
    occurrence taggedLists : TodoList [0..*];

    metadata def <criticalPath> CriticalPathTaskMetadata :> SemanticMetadata {
        doc
        /* Tags a Task usage as being on the critical path to a working
         * end-to-end demo of the digital thread.
         */

        :> annotatedElement : SysML::Usage;
        :>> baseType = taggedTasks meta SysML::Usage;
    }

    metadata def <sprintBacklog> SprintBacklogListMetadata :> SemanticMetadata {
        doc
        /* Tags a TodoList usage as the currently active sprint backlog, as
         * opposed to e.g. an icebox or archive list.
         */

        :> annotatedElement : SysML::Usage;
        :>> baseType = taggedLists meta SysML::Usage;
    }
} // package TodoDataModel

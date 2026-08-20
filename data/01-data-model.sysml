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

    // Plain metadata tags for Task and TodoList usages, following the simple
    // metadata def pattern the standard library uses for annotations like
    // StatusInfo/Issue/Rationale in
    // "Domain Libraries/Metadata/ModelingMetadata.sysml" — a bare `metadata def`
    // with no base-type restriction, since these are just markers rather than
    // semantic type assertions (contrast with TaskMeta/TodoListMeta above, which
    // use :> SemanticMetadata because they assert what counts as a Task/TodoList
    // Usage in the first place).
    //
    // These are project-management concepts (critical path, active sprint) kept
    // as bolt-on tags on specific Task/TodoList usages rather than as attributes
    // on the part defs above, since not every task/list needs them.

    metadata def <criticalPath> CriticalPathTaskMetadata {
        doc
        /* Tags a Task usage as being on the critical path to a working
         * end-to-end demo of the digital thread.
         */
    }

    metadata def <sprintBacklog> SprintBacklogListMetadata {
        doc
        /* Tags a TodoList usage as the currently active sprint backlog, as
         * opposed to e.g. an icebox or archive list.
         */
    }
} // package TodoDataModel

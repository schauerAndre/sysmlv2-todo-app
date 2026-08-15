package TodoTaskListSpecification {
    private import TodoDataModel::*;

    // @id: TASK-001
    #task occurrence task001 {
        :>> id = "TASK-001";
        :>> title = "Write LinkedIn article";
        :>> description = "Create the first blog post for the SysML v2 To-Do series.";
        :>> status = TaskStatus::open;
        :>> priority = TaskPriority::high;
        :>> createdAt = "2026-05-16T09:15:00.000Z";
        :>> updatedAt = "2026-05-16T09:45:00.000Z";
    }

    // @id: TASK-002
    #task occurrence task002 {
        @criticalPath;
        :>> id = "TASK-002";
        :>> title = "Build the demo extractor";
        :>> description =
            "Implement the purpose-built SysML v2 to JSON extractor for this example.";
        :>> status = TaskStatus::open;
        :>> priority = TaskPriority::medium;
        :>> createdAt = "2026-05-16T09:15:00.000Z";
        :>> updatedAt = "2026-05-16T09:45:00.000Z";
    }

    // @id: LIST-001
    #toDoList occurrence backlog {
        @sprintBacklog;
        :>> id = "LIST-001";
        :>> name = "Backlog";
        occurrence :>> tasks = (task001, task002);
    }
} // package TodoTaskListSpecification

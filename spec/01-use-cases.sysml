package TodoUseCases {

    occurrence def User;
    part def TodoApp;

    // @id: UC-01
    use case def CreateTask {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to add
                 * a new task to a list.
               */
        }
    }

    // @id: UC-02
    use case def ViewTasks {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to see
                 * all open and completed tasks.
               */
        }
    }

    // @id: UC-03
    use case def CompleteTask {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to mark
                 * a task as completed.
               */
        }
    }

    // @id: UC-04
    use case def DeleteTask {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to remove
                 * a task permanently.
               */
        }
    }

    // @id: UC-05
    use case def PersistTasks {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user expects tasks to
                 * survive an application restart.
               */
        }
    }

    // @id: UC-06
    use case def BrowseTaskPanel {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to browse and filter
                 * all tasks in a dedicated panel.
               */
        }
    }

    // @id: UC-07
    use case def ViewTaskDetails {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to see a task's full details,
                 * including which list it belongs to.
               */
        }
    }

    // @id: UC-08
    use case def EditTaskFields {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to change a task's status
                 * or priority directly from the panel.
               */
        }
    }

    // @id: UC-09
    use case def BrowseModelTree {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to browse the SysML model's
                 * structure without opening files individually.
               */
        }
    }

    // @id: UC-10
    use case def NavigateToModelSource {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to jump from a tree element
                 * to its declaration in the SysML source.
               */
        }
    }

    // @id: UC-11
    use case def ViewTraceabilityAsTree {
        subject app : TodoApp;
        actor user : User;
        objective {
            doc /*
                 * The user wants to see a requirement's
                 * derive/verify links as navigable tree children.
               */
        }
    }
}

package TodoArchitecture {
    private import TodoUseCases::TodoApp;
    private import TodoRequirements::*;
    private import TodoTestCases::*;

    doc
    /*
     * This is the LOGICAL architecture: three functional roles (model, parser,
     * extension) and how data flows between them, independent of any concrete
     * technology. It intentionally says nothing about Node.js, TypeScript, or
     * file formats -- that mapping is the job of the physical architecture in
     * 06-physical-architecture.sysml, which allocates each logical part here to
     * a concrete software element.
     */

    // @id: ARCH-MODEL
    part def SysmlModel;

    // @id: ARCH-PARSER
    part def Parser {
        port modelIn;
        port jsonOut;
    }

    // @id: ARCH-EXTENSION
    part def VsCodeExtension {
        port jsonIn;
    }

    // @id: ARCH-APP
    // Typed by TodoApp: this is the concrete system that IS the subject every
    // requirement in 02-requirements.sysml declares (`subject app : TodoApp;`).
    part todoDigitalThread : TodoApp {
        part model : SysmlModel;
        part parser : Parser;
        part extension : VsCodeExtension;

        connect model to parser.modelIn;
        connect parser.jsonOut to extension.jsonIn;
    }

    // Requirement satisfaction belongs here, not in
    // data/02-task-list-specification.sysml: the system satisfies its requirements,
    // not any individual example task in the backlog. `task001` /
    // `task002` are content the running app manages; they are not the thing
    // that fulfills "the user shall be able to create a task."
    satisfy requirement satisfiesCreate : CreateTaskRequirement by todoDigitalThread;
    satisfy requirement satisfiesView : ViewTasksRequirement by todoDigitalThread;
    satisfy requirement satisfiesComplete : CompleteTaskRequirement by todoDigitalThread;
    satisfy requirement satisfiesDelete : DeleteTaskRequirement by todoDigitalThread;
    satisfy requirement satisfiesPersist : PersistTasksRequirement by todoDigitalThread;
    // Added by specs/001-task-panel-redesign's plan-sync hook: the redesigned
    // panel is still implemented inside the existing ARCH-EXTENSION role, not
    // a new architectural component, so these bind to the same system.
    satisfy requirement satisfiesBrowsePanel : BrowseTaskPanelRequirement by todoDigitalThread;
    satisfy requirement satisfiesViewDetails : ViewTaskDetailsRequirement by todoDigitalThread;
    satisfy requirement satisfiesEditFields : EditTaskFieldsRequirement by todoDigitalThread;
    // Added by specs/003-model-explorer's plan-sync hook: same reasoning --
    // the Model Explorer tree is implemented inside ARCH-EXTENSION too.
    satisfy requirement satisfiesBrowseModel : BrowseModelTreeRequirement by todoDigitalThread;
    satisfy requirement satisfiesNavigateSource : NavigateToModelSourceRequirement by todoDigitalThread;
    satisfy requirement satisfiesTraceTree : ViewTraceabilityAsTreeRequirement by todoDigitalThread;

    // Verification, at the usage level: `verify` (like `satisfy` above) only
    // forms a real trace link between usages with a concrete subject, not
    // between definitions. Each usage here redefines its def's unbound
    // `verifiedRequirement` (05-test-cases.sysml) against the concrete
    // `satisfies...` requirement usage above, with its subject bound to the
    // actual system instance `todoDigitalThread`.
    verification verifiesCreate : CreateTaskTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesCreate :>> verifiedRequirement; }
    }
    verification verifiesView : ViewTasksTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesView :>> verifiedRequirement; }
    }
    verification verifiesComplete : CompleteTaskTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesComplete :>> verifiedRequirement; }
    }
    verification verifiesDelete : DeleteTaskTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesDelete :>> verifiedRequirement; }
    }
    verification verifiesPersist : PersistTasksTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesPersist :>> verifiedRequirement; }
    }

    // Added by specs/001-task-panel-redesign's tasks-sync hook, binding
    // spec/05-test-cases.sysml's TEST-006 to the concrete satisfiesEditFields
    // requirement usage added by the plan-sync hook above.
    verification verifiesEditFields : EditTaskFieldsTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesEditFields :>> verifiedRequirement; }
    }

    // Added by specs/002-create-delete-tasks's tasks-sync hook, binding
    // TEST-007/TEST-008 to the existing satisfiesCreate/satisfiesDelete
    // requirement usages above -- a second verification path for the same
    // requirements, alongside verifiesCreate/verifiesDelete.
    verification verifiesCreateViaPanel : CreateTaskViaPanelTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesCreate :>> verifiedRequirement; }
    }
    verification verifiesDeleteViaPanel : DeleteTaskViaPanelTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesDelete :>> verifiedRequirement; }
    }

    // Added by specs/003-model-explorer's tasks-sync hook.
    verification verifiesBrowseModel : BrowseModelTreeTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesBrowseModel :>> verifiedRequirement; }
    }
    verification verifiesNavigateSource : NavigateToModelSourceTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesNavigateSource :>> verifiedRequirement; }
    }
    verification verifiesTraceTree : ViewTraceabilityAsTreeTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesTraceTree :>> verifiedRequirement; }
    }

    // Added retroactively, binding TEST-012/013 (spec/05-test-cases.sysml) to
    // the satisfiesBrowsePanel/satisfiesViewDetails requirement usages above,
    // which previously had a satisfy link but no verify link -- see the note
    // on TEST-006 in spec/05-test-cases.sysml for why.
    verification verifiesBrowsePanel : BrowseTaskPanelTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesBrowsePanel :>> verifiedRequirement; }
    }
    verification verifiesViewDetails : ViewTaskDetailsTest {
        subject app :> todoDigitalThread;
        objective { verify satisfiesViewDetails :>> verifiedRequirement; }
    }
}

package TodoPhysicalArchitecture {
    private import ScalarValues::*;
    private import TodoArchitecture::*;

    doc
    /*
     * Refines the logical architecture (03-architecture.sysml) into the concrete
     * software realization of this repo: which OS process, language, and file
     * each logical part is actually allocated to. This is the part that makes
     * "SysML v2 as a software architecture specification language" a real claim
     * rather than a slide -- it says exactly which file on disk realizes which
     * logical role, and that mapping can go stale-check the same way any other
     * part of the model can.
     */

    // @id: PHYS-SYSML-FILES
    part def SysmlSourceFiles {
        attribute location : String = "spec/*.sysml, data/*.sysml";
        // Added by specs/001-task-panel-redesign: the extension host now
        // writes back to data/02-task-list-specification.sysml (via
        // vscode-extension/src/sysmlTaskWriter.ts's patchTask()) on every
        // Status/Priority edit in the panel -- this is no longer a
        // read-only source for the extractor.
        port editIn;
        // Added by specs/003-model-explorer: the extension host now also
        // reads spec/*.sysml directly (a plain text search for a known
        // "// @id: ..." line, per that feature's research.md Decision 2) to
        // navigate from a Model Explorer tree item to its source location --
        // a second, independent read path alongside the extractor's own.
        port navSourceOut;
    }

    // @id: PHYS-EXTRACTOR-PROCESS
    part def ExtractorProcess {
        attribute runtime : String = "Node.js (no dependencies)";
        attribute entryPoint : String = "parser/extract.js";
        // Added by specs/001-task-panel-redesign: besides the manual
        // `cd parser && node extract.js` invocation, the extension host now
        // also spawns this same process as a child process (see
        // vscode-extension/src/taskPanelProvider.ts's `cp.exec("node
        // extract.js", ...)`) after every successful edit round-trip -- two
        // invocation triggers, same physical process/entry point.
        port modelFilesIn;
        port jsonFileOut;
    }

    // @id: PHYS-GENERATED-JSON
    part def GeneratedJsonFile {
        attribute path : String = "generated/todo-model.generated.json";
    }

    // @id: PHYS-EXTENSION-HOST
    part def VsCodeExtensionHost {
        attribute 'language' : String = "TypeScript, compiled to CommonJS";
        attribute entryPoint : String = "vscode-extension/src/extension.ts";
        port jsonFileIn;
        // Added by specs/001-task-panel-redesign: the write side of the new
        // edit round-trip (taskPanelProvider.ts -> sysmlTaskWriter.ts).
        port editOut;
        // Added by specs/003-model-explorer: read side of the navigation
        // path (modelExplorerProvider.ts's resolveSourceLocation()).
        port navSourceIn;
    }

    // @id: PHYS-APP
    part physicalRealization {
        part sysmlFiles : SysmlSourceFiles;
        part extractorProcess : ExtractorProcess;
        part generatedJson : GeneratedJsonFile;
        part extensionHost : VsCodeExtensionHost;

        connect sysmlFiles to extractorProcess.modelFilesIn;
        connect extractorProcess.jsonFileOut to generatedJson;
        connect generatedJson to extensionHost.jsonFileIn;
        // Added by specs/001-task-panel-redesign: closes the loop -- edits
        // made in the panel flow back from the extension host into the
        // SysML source files, which the extractor (re-invoked as a child
        // process from extensionHost, not shown as a separate connection
        // since it's the same modelFilesIn port either way) then re-reads.
        connect extensionHost.editOut to sysmlFiles.editIn;
        // Added by specs/003-model-explorer: the navigation read path,
        // independent of the extractor's own read of the same files.
        connect sysmlFiles.navSourceOut to extensionHost.navSourceIn;

        // Allocation of logical role -> physical realization (real SysML v2
        // `allocate ... to ...;`, backed by the standard Allocations library).
        // Note the mixed path: `::` reaches `todoDigitalThread` as a named
        // member of the TodoArchitecture package; `.` then reaches `model` as
        // a feature owned BY that usage, not a namespace member itself.
        allocate TodoArchitecture::todoDigitalThread.model to sysmlFiles;
        allocate TodoArchitecture::todoDigitalThread.parser to extractorProcess;
        allocate TodoArchitecture::todoDigitalThread.extension to extensionHost;
    }
}

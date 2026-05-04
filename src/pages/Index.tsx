import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ProcessingDashboard } from "@/components/ProcessingDashboard";
import { FileTable } from "@/components/FileTable";
import { LogsPanel } from "@/components/LogsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { useAppStore } from "@/store/useAppStore";

const Index = () => {
  const store = useAppStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          currentView={store.currentView}
          onViewChange={store.setCurrentView}
          stats={{
            total: store.totalFiles,
            completed: store.completedFiles,
            failed: store.failedFiles,
          }}
        />

        <main className="flex-1 no-scrollbar overflow-y-auto">
          <AppHeader
            globalSearch={store.globalSearch}
            onGlobalSearchChange={store.setGlobalSearch}
            handleFileChange={store.importFiles}
          />
          <div className="p-4 space-y-4">
            {(store.currentView === "dashboard" ||
              store.currentView === "files") && (
              <>
                <ProcessingDashboard
                  overallProgress={store.overallProgress}
                  totalFiles={store.totalFiles}
                  completedFiles={store.completedFiles}
                  processingFile={store.processingFile}
                  isProcessing={store.isProcessing}
                  isPaused={store.isPaused}
                  onPause={store.pauseProcessing}
                  onResume={store.resumeProcessing}
                  onCancel={store.cancelProcessing}
                  onStart={store.startProcessing}
                  eventErr={store.eventErr}
                />

                <FileTable
                  files={store.files}
                  selectedFiles={store.selectedFiles}
                  onRemove={store.removeFile}
                  onRetry={store.retryFile}
                  dropFiles={store.dropFiles}
                />

                <LogsPanel
                  logs={store.logs}
                  autoscroll={store.logsAutoscroll}
                  onToggleAutoscroll={() =>
                    store.setLogsAutoscroll(!store.logsAutoscroll)
                  }
                  saveLog={store.saveLog}
                />
              </>
            )}

            {store.currentView === "search" && (
              <SearchPanel
                query={store.searchQuery}
                onQueryChange={store.setSearchQuery}
                results={store.searchResults}
              />
            )}

            {store.currentView === "settings" && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Global Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure processing settings in the right panel →
                </p>
              </div>
            )}
          </div>
        </main>

        <SettingsPanel
          settings={store.settings}
          applyAll={store.applyAll}
          onUpdate={store.updateSetting}
          onAllUpdate={store.updateAllSetting}
        />
      </div>
    </div>
  );
};

export default Index;

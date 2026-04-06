import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { ProcessingDashboard } from '@/components/ProcessingDashboard';
import { FileTable } from '@/components/FileTable';
import { LogsPanel } from '@/components/LogsPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { SearchPanel } from '@/components/SearchPanel';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
  const store = useAppStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader
        globalSearch={store.globalSearch}
        onGlobalSearchChange={store.setGlobalSearch}
        onImportFiles={() => store.addFiles([`document-${Date.now().toString(36)}.pdf`])}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          currentView={store.currentView}
          onViewChange={store.setCurrentView}
          stats={{ total: store.totalFiles, completed: store.completedFiles, failed: store.failedFiles }}
        />

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {(store.currentView === 'dashboard' || store.currentView === 'files') && (
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
              />

              <FileTable
                files={store.files}
                selectedFiles={store.selectedFiles}
                onToggleSelect={store.toggleFileSelection}
                onSelectAll={store.selectAllFiles}
                onRemove={store.removeFile}
                onRetry={store.retryFile}
                onAddFiles={store.addFiles}
              />

              <LogsPanel
                logs={store.logs}
                autoscroll={store.logsAutoscroll}
                onToggleAutoscroll={() => store.setLogsAutoscroll(!store.logsAutoscroll)}
              />
            </>
          )}

          {store.currentView === 'search' && (
            <SearchPanel
              query={store.searchQuery}
              onQueryChange={store.setSearchQuery}
              results={store.searchResults}
            />
          )}

          {store.currentView === 'settings' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Global Settings</h2>
              <p className="text-sm text-muted-foreground">Configure processing settings in the right panel →</p>
            </div>
          )}
        </main>

        <SettingsPanel settings={store.settings} onUpdate={store.updateSetting} />
      </div>
    </div>
  );
};

export default Index;

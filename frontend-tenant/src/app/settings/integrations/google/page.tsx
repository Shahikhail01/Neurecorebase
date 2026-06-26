'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Calendar,
  FolderOpen,
  Inbox,
  Send,
  ChevronLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import { useTenantAuth } from '@/hooks/useTenantAuth';
import {
  integrationsService,
  type GmailMessage,
  type GmailMessageBody,
  type CalendarEvent,
  type DriveFile,
  type AgentFolder,
} from '@/services/integrations.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'inbox' | 'calendar' | 'drive';

function GoogleWorkspaceContent() {
  const user = useTenantAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('inbox');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inbox state
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [messageBody, setMessageBody] = useState<GmailMessageBody | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);

  // Calendar state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Drive state
  const [agentFolders, setAgentFolders] = useState<AgentFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [settingUpAgent, setSettingUpAgent] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const status = await integrationsService.getGoogleStatus();
      setConnected(status.connected);
      if (!status.connected) {
        setError('Google Workspace is not connected');
      }
    } catch (err) {
      setError('Failed to check Google connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInbox = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const result = await integrationsService.getInbox({ maxResults: 25 });
      setMessages(result.messages);
    } catch (err) {
      console.error('Failed to fetch inbox', err);
      setError('Failed to load Gmail inbox');
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const result = await integrationsService.getCalendarEvents({
        maxResults: 20,
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
      });
      setEvents(result);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setError('Failed to load Calendar events');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchDrive = useCallback(async () => {
    setLoadingDrive(true);
    try {
      const result = await integrationsService.listAgentFolders();
      setAgentFolders(result.agents);
    } catch (err) {
      console.error('Failed to fetch drive', err);
      setError('Failed to load Drive folders');
    } finally {
      setLoadingDrive(false);
    }
  }, []);

  const fetchFolderFiles = useCallback(async (folderId: string) => {
    try {
      const files = await integrationsService.listDriveFiles(folderId);
      setDriveFiles(files);
    } catch (err) {
      console.error('Failed to fetch folder files', err);
    }
  }, []);

  useEffect(() => {
    if (user?.tenantId) {
      checkConnection();
    }
  }, [user, checkConnection]);

  useEffect(() => {
    if (connected && tab === 'inbox') fetchInbox();
    if (connected && tab === 'calendar') fetchEvents();
    if (connected && tab === 'drive') fetchDrive();
  }, [connected, tab, fetchInbox, fetchEvents, fetchDrive]);

  const handleSelectMessage = async (msg: GmailMessage) => {
    setSelectedMessage(msg);
    setLoadingBody(true);
    try {
      const body = await integrationsService.getMessageBody(msg.id);
      setMessageBody(body);
    } catch (err) {
      console.error('Failed to fetch message body', err);
    } finally {
      setLoadingBody(false);
    }
  };

  const handleSetupAgentFolder = async (agentId: string, agentName: string) => {
    setSettingUpAgent(agentId);
    try {
      await integrationsService.setupAgentFolders(agentId, agentName);
      await fetchDrive();
    } catch (err) {
      console.error('Failed to setup agent folder', err);
      setError('Failed to create Drive folder for agent');
    } finally {
      setSettingUpAgent(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/settings/integrations" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Integrations
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
          <h2 className="text-lg font-semibold mb-2">Google Workspace Not Connected</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect Google Workspace from the integrations page to access Gmail, Calendar, and Drive.
          </p>
          <Link href="/settings/integrations">
            <Button>Go to Integrations</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Link href="/settings/integrations" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back to Integrations
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Google Workspace</h1>
          <p className="text-sm text-muted-foreground">Gmail · Drive · Calendar</p>
        </div>
        <Badge variant="default" className="gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Connected
        </Badge>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto underline opacity-70">Dismiss</button>
        </div>
      )}

      <div className="border-b border-border flex gap-1">
        {[
          { id: 'inbox' as Tab, label: 'Inbox', icon: Inbox },
          { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar },
          { id: 'drive' as Tab, label: 'Drive', icon: FolderOpen },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedMessage(null); setMessageBody(null); }}
              className={`px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Inbox ({messages.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchInbox} disabled={loadingInbox}>
                  {loadingInbox ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Refresh
                </Button>
                <Link href="/settings/integrations/google/compose">
                  <Button size="sm">
                    <Send className="w-3 h-3" /> Compose
                  </Button>
                </Link>
              </div>
            </div>
            {loadingInbox ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages in inbox</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMessage?.id === msg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-sm truncate ${msg.isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {msg.from || '(no sender)'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`text-sm truncate ${msg.isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                      {msg.subject || '(no subject)'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {msg.snippet}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            {selectedMessage ? (
              <>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{selectedMessage.subject || '(no subject)'}</h3>
                  <div className="text-xs text-muted-foreground">
                    <div>From: {selectedMessage.from}</div>
                    <div>To: {selectedMessage.to}</div>
                    <div>Date: {new Date(selectedMessage.date).toLocaleString()}</div>
                  </div>
                </div>
                {loadingBody ? (
                  <Skeleton className="h-48 w-full" />
                ) : messageBody ? (
                  <div className="border-t border-border pt-3 mt-3">
                    {messageBody.html ? (
                      <iframe
                        srcDoc={messageBody.html}
                        className="w-full min-h-[400px] border rounded"
                        sandbox="allow-same-origin"
                        title="Email body"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {messageBody.plainText || '(empty)'}
                      </pre>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No body</p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select a message to read</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'calendar' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Upcoming Events ({events.length})</h3>
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loadingEvents}>
              {loadingEvents ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </Button>
          </div>
          {loadingEvents ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming events in the next 30 days</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.summary}</h4>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <div>{new Date(event.start).toLocaleDateString()}</div>
                      <div>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'drive' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Agent Folders ({agentFolders.length})</h3>
              <Button variant="outline" size="sm" onClick={fetchDrive} disabled={loadingDrive}>
                {loadingDrive ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </Button>
            </div>
            {loadingDrive ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : agentFolders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No agent folders yet</p>
                <p className="text-xs text-muted-foreground">Set up folders for your agents to give them Drive storage.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {agentFolders.map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() => {
                      setSelectedFolder(agent.folderId);
                      fetchFolderFiles(agent.folderId);
                    }}
                    className={`w-full text-left p-2 rounded flex items-center justify-between gap-2 transition-colors ${
                      selectedFolder === agent.folderId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{agent.agentName}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 lg:col-span-2 space-y-3">
            {selectedFolder ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Folder Contents</h3>
                  {agentFolders.find(a => a.folderId === selectedFolder) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const agent = agentFolders.find(a => a.folderId === selectedFolder);
                        if (agent) handleSetupAgentFolder(agent.agentId, agent.agentName);
                      }}
                      disabled={settingUpAgent !== null}
                    >
                      {settingUpAgent ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Setup Subfolders'}
                    </Button>
                  )}
                </div>
                {driveFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No files in this folder</p>
                ) : (
                  <div className="space-y-1">
                    {driveFiles.map((file) => (
                      <div key={file.id} className="p-2 border border-border rounded flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <FolderOpen className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        {file.webViewLink && (
                          <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select an agent folder to view its contents</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default function GoogleWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <GoogleWorkspaceContent />
    </Suspense>
  );
}
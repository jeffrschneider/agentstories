'use client';

import * as React from 'react';
import {
  Github,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  KeyRound,
  FolderGit2,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { HarnessExportResult } from '@/lib/export';

interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
}

interface GitHubRepo {
  fullName: string;
  name: string;
  defaultBranch: string;
  private: boolean;
}

interface GitHubPublishProps {
  exportResult: HarnessExportResult | null;
  onExportNeeded: () => void;
}

export function GitHubPublish({ exportResult, onExportNeeded }: GitHubPublishProps) {
  const [token, setToken] = React.useState('');
  const [user, setUser] = React.useState<GitHubUser | null>(null);
  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState<string>('');
  const [branch, setBranch] = React.useState('main');
  const [commitMessage, setCommitMessage] = React.useState('Add agent harness configs from AgentStories');

  const [isValidating, setIsValidating] = React.useState(false);
  const [isPushing, setIsPushing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<{ commitUrl: string; filesCount: number } | null>(null);

  // Try to load token from localStorage
  React.useEffect(() => {
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    setIsValidating(true);
    setError(null);
    setUser(null);
    setRepos([]);

    try {
      const response = await fetch('/api/github/push', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to validate token');
      }

      const data = await response.json();
      setUser(data.user);
      setRepos(data.repos);

      // Save token to localStorage
      localStorage.setItem('github_pat', tokenToValidate);

      // Auto-select first repo if available
      if (data.repos.length > 0) {
        setSelectedRepo(data.repos[0].fullName);
        setBranch(data.repos[0].defaultBranch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate token');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnect = () => {
    if (token.trim()) {
      validateToken(token.trim());
    }
  };

  const handleDisconnect = () => {
    setToken('');
    setUser(null);
    setRepos([]);
    setSelectedRepo('');
    setError(null);
    setSuccess(null);
    localStorage.removeItem('github_pat');
  };

  const handlePush = async () => {
    if (!exportResult || !selectedRepo || !token) return;

    setIsPushing(true);
    setError(null);
    setSuccess(null);

    try {
      // Collect all files from the export result
      const files: { path: string; content: string }[] = [];
      for (const [, output] of Object.entries(exportResult.outputs)) {
        for (const file of output.files) {
          files.push({ path: file.path, content: file.content });
        }
      }

      // Add source.json if present
      if (exportResult.source) {
        files.push({ path: '.agentstories/source.json', content: exportResult.source });
      }

      const [owner, repo] = selectedRepo.split('/');

      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          owner,
          repo,
          branch,
          files,
          commitMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to push to GitHub');
      }

      const data = await response.json();
      setSuccess({
        commitUrl: data.commitUrl,
        filesCount: data.filesCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push to GitHub');
    } finally {
      setIsPushing(false);
    }
  };

  const handleRepoChange = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    const repo = repos.find((r) => r.fullName === repoFullName);
    if (repo) {
      setBranch(repo.defaultBranch);
    }
    setSuccess(null);
  };

  // If no export result, show prompt to generate first
  if (!exportResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Github className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Generate Configs First</h3>
        <p className="max-w-md text-sm text-muted-foreground mb-4">
          Before publishing to GitHub, you need to generate the harness configuration files.
        </p>
        <Button onClick={onExportNeeded}>
          Go to Export Configs
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        {/* Connection Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <Label className="text-base font-medium">GitHub Connection</Label>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter a GitHub Personal Access Token with <code className="bg-muted px-1 rounded">repo</code> scope to push configs.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleConnect} disabled={!token.trim() || isValidating}>
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=AgentStories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  Create a new token <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="font-medium">{user.name || user.login}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </div>

        {user && (
          <>
            <Separator />

            {/* Repository Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4" />
                <Label className="text-base font-medium">Target Repository</Label>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="repo" className="text-sm">Repository</Label>
                  <Select value={selectedRepo} onValueChange={handleRepoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.fullName} value={repo.fullName}>
                          <div className="flex items-center gap-2">
                            <span>{repo.fullName}</span>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">Private</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="branch" className="text-sm flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Branch
                  </Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm">Commit Message</Label>
                  <Input
                    id="message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Add agent harness configs"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Files to Push */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Files to Push</Label>
              <div className="border rounded-lg p-3 bg-muted/30">
                <ul className="text-sm space-y-1">
                  {Object.entries(exportResult.outputs).map(([adapterId, output]) =>
                    output.files.map((file) => (
                      <li key={file.path} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{adapterId}</span>
                        <span className="font-mono text-xs">{file.path}</span>
                      </li>
                    ))
                  )}
                  {exportResult.source && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">meta</span>
                      <span className="font-mono text-xs">.agentstories/source.json</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {success && (
              <Alert className="border-green-300 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-300">Success!</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Pushed {success.filesCount} files to GitHub.{' '}
                  <a
                    href={success.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    View commit <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Push Button */}
            <div className="flex justify-end">
              <Button
                onClick={handlePush}
                disabled={!selectedRepo || isPushing}
                size="lg"
              >
                {isPushing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Push to GitHub
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

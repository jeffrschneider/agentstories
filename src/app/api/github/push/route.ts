/**
 * API route for pushing harness configs to a GitHub repository.
 *
 * This endpoint accepts generated harness files and pushes them to a
 * user-specified GitHub repository using a Personal Access Token.
 */

import { NextRequest, NextResponse } from 'next/server';

interface GitHubFile {
  path: string;
  content: string;
}

interface PushRequest {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  files: GitHubFile[];
  commitMessage?: string;
}

interface GitHubTreeItem {
  path: string;
  mode: '100644';
  type: 'blob';
  sha: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PushRequest = await request.json();
    const { token, owner, repo, branch = 'main', files, commitMessage = 'Add agent harness configs' } = body;

    if (!token || !owner || !repo || !files?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: token, owner, repo, files' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Step 1: Get the current commit SHA for the branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers }
    );

    if (!refResponse.ok) {
      if (refResponse.status === 404) {
        return NextResponse.json(
          { error: `Branch '${branch}' not found. Make sure the repository and branch exist.` },
          { status: 404 }
        );
      }
      const error = await refResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to get branch reference' },
        { status: refResponse.status }
      );
    }

    const refData = await refResponse.json();
    const currentCommitSha = refData.object.sha;

    // Step 2: Get the current commit to find the tree SHA
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`,
      { headers }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to get current commit' },
        { status: commitResponse.status }
      );
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3: Create blobs for each file
    const blobPromises = files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      };
    });

    const treeItems: GitHubTreeItem[] = await Promise.all(blobPromises);

    // Step 4: Create a new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to create tree' },
        { status: treeResponse.status }
      );
    }

    const treeData = await treeResponse.json();

    // Step 5: Create a new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [currentCommitSha],
        }),
      }
    );

    if (!newCommitResponse.ok) {
      const error = await newCommitResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to create commit' },
        { status: newCommitResponse.status }
      );
    }

    const newCommitData = await newCommitResponse.json();

    // Step 6: Update the branch reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to update branch reference' },
        { status: updateRefResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      commitSha: newCommitData.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
      filesCount: files.length,
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Validate a GitHub token and get user info
 */
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid token or authentication failed' },
        { status: 401 }
      );
    }

    const userData = await response.json();

    // Also get user's repos
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const repos = reposResponse.ok ? await reposResponse.json() : [];

    return NextResponse.json({
      user: {
        login: userData.login,
        name: userData.name,
        avatarUrl: userData.avatar_url,
      },
      repos: repos.map((r: { full_name: string; name: string; default_branch: string; private: boolean }) => ({
        fullName: r.full_name,
        name: r.name,
        defaultBranch: r.default_branch,
        private: r.private,
      })),
    });
  } catch (error) {
    console.error('GitHub validation error:', error);
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
  }
}

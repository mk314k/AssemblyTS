import axios from 'axios';
import { StateVar } from 'statebinderk';
import { CodeEditor } from './editor';
import { consoleBox } from './consoleBox';

const GITHUB_CLIENT_ID: string = 'Ov23liZl7f0TzzDD0CSA';
const TOKEN_URI: string = 'https://purpletreeauth.netlify.app/.netlify/functions/api/auth/github/callback';
const REDIRECT_URI: string = 'https://mk314k.github.io/AssemblyTS/';

interface RepoFileInfo {
  name: string;
  url: string;
  sha?: string;
}

interface RepoFileContent {
  name: string;
  content: string;
  sha?: string;
}

export class GitUser {
  public static userName: string = '';
  private static token: string = '';
  public static repo: string = '';
  public static authLabelState = new StateVar<string>('Login', 'gitStatus', (elem, label) => {
    elem.innerText = label;
  });

  constructor() {}

  public static hasWriteAccess(): boolean {
    return this.token !== '' && this.userName !== '' && this.repo !== '';
  }

  public static reset(): void {
    GitUser.userName = '';
    GitUser.repo = '';
    GitUser.token = '';
    GitUser.authLabelState.transition('Login');
    codeTabPane.repoCodes.clear();
    codeTabPane.repoShas.clear();
    codeTabPane.currentFile = '';
    codeTabPane.showHTML();
  }

  public static addRepo(): void {
    const repoInput = document.getElementById('repository') as HTMLInputElement | null;
    let repo = repoInput ? repoInput.value.trim() : '';
    if (repo === '') {
      repo = 'AssemblyTS_codes';
    }
    GitUser.repo = repo;
  }

  public static setToken(pat: string): void {
    GitUser.token = pat.trim();
  }

  public static async syncDOM(auth = false): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (GitUser.token) {
        headers['Authorization'] = `token ${GitUser.token}`;
      }
      const repoResponse = await fetch(
        `https://api.github.com/repos/${GitUser.userName}/${GitUser.repo}/contents/`,
        { headers }
      );
      if (repoResponse.status === 200) {
        GitUser.authLabelState.transition('Logout');
        const repoFiles: RepoFileInfo[] = await repoResponse.json();
        await codeTabPane.fetchRepoContents(repoFiles);
        consoleBox.log(`Connected to GitHub repository: ${GitUser.userName}/${GitUser.repo}`, 'info');
      } else if (auth) {
        await this.createRepo();
        await this.syncDOM();
      } else {
        consoleBox.log(`Could not find repository "${GitUser.userName}/${GitUser.repo}".`, 'error');
        GitUser.reset();
      }
    } catch (err) {
      consoleBox.log('Failed to connect to GitHub API.', 'error');
      GitUser.reset();
    }
  }

  public static async loginAuth(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
      window.location.href = authUrl;
      return;
    }

    try {
      const res = await axios.get(TOKEN_URI, { params: { code } });
      GitUser.token = res.data.token;
      if (GitUser.token) {
        const user = await GitUser.getUserInfo(GitUser.token);
        GitUser.userName = user;
      }
      await this.syncDOM(true);
    } catch (error) {
      console.error('Error getting token:', error);
    }
  }

  private static getUserInfo = async (token: string): Promise<string> => {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`
      }
    });
    return typeof response.data === 'string' ? response.data : response.data.login;
  };

  private static createRepo = async (): Promise<void> => {
    if (this.token !== '') {
      await axios.post(
        'https://api.github.com/user/repos',
        {
          name: this.repo,
          private: false
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };

  public static writeFileToRepo = async (path: string, content: string): Promise<void> => {
    if (this.token && this.userName && this.repo) {
      const base64Content = btoa(content);
      const existingSha = codeTabPane.repoShas.get(path);
      const payload: Record<string, string> = {
        message: `Update ${path} via AssemblyTS`,
        content: base64Content,
      };
      if (existingSha) {
        payload.sha = existingSha;
      }

      const res = await axios.put(
        `https://api.github.com/repos/${this.userName}/${this.repo}/contents/${path}`,
        payload,
        {
          headers: {
            Authorization: `token ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newSha = res.data?.content?.sha;
      if (newSha) {
        codeTabPane.repoShas.set(path, newSha);
      }
      codeTabPane.repoCodes.set(path, content);
    }
  };
}

export class codeTabPane {
  public static repoCodes = new Map<string, string>();
  public static repoShas = new Map<string, string>();
  public static localCodes = new Map<string, string>();
  public static currentFile = '';

  constructor() {}

  public static async fetchRepoContents(repoFiles: RepoFileInfo[]): Promise<void> {
    codeTabPane.repoCodes.clear();
    codeTabPane.repoShas.clear();
    for (const file of repoFiles) {
      if (file.name.endsWith('.asm') || file.name.endsWith('.s')) {
        const response = await fetch(file.url);
        if (response.status === 200) {
          const fileData: RepoFileContent = await response.json();
          codeTabPane.repoCodes.set(fileData.name, atob(fileData.content));
          if (fileData.sha) {
            codeTabPane.repoShas.set(fileData.name, fileData.sha);
          }
        }
      }
    }
    const firstFile = Array.from(codeTabPane.repoCodes.keys())[0] || 'main.asm';
    codeTabPane.currentFile = firstFile;
    codeTabPane.showHTML();
  }

  public static showHTML(): void {
    const codeTab = document.getElementById('codeTab');
    if (!codeTab) return;

    if (GitUser.repo !== '' && GitUser.userName !== '') {
      const fileItems = Array.from(codeTabPane.repoCodes.keys())
        .map(fname => {
          const isActive = fname === codeTabPane.currentFile ? ' active-file' : '';
          return `<div id="tab-${fname}" class="code-tab-layer file-item${isActive}"><i class="fa-regular fa-file-code"></i> ${fname}</div>`;
        })
        .join('');

      const saveControls = GitUser.hasWriteAccess()
        ? `
          <div class="repo-save-box">
            <input type="text" id="saveFileName" class="repo-save-input" value="${codeTabPane.currentFile || 'main.asm'}" placeholder="filename.asm">
            <button id="saveToGitBtn" class="repo-save-btn" title="Commit & push current editor code to GitHub">
              <i class="fa-solid fa-cloud-arrow-up"></i> Save to GitHub
            </button>
          </div>
        `
        : '';

      codeTab.innerHTML = `
        <div class="explorer-header">GITHUB REPO</div>
        <div class="code-tab-layer repo-user">
          <div class="repo-meta"><i class="fa-brands fa-github"></i> ${GitUser.userName} / <strong>${GitUser.repo}</strong></div>
          <div class="explorer-list">
            ${fileItems || '<div class="explorer-empty">No .asm files found</div>'}
          </div>
        </div>
        ${saveControls}
      `;

      this.repoCodes.forEach((content, fname) => {
        const tabf = document.getElementById(`tab-${fname}`);
        if (tabf) {
          tabf.addEventListener('click', () => {
            codeTabPane.currentFile = fname;
            document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active-file'));
            tabf.classList.add('active-file');
            const saveInput = document.getElementById('saveFileName') as HTMLInputElement | null;
            if (saveInput) saveInput.value = fname;
            CodeEditor.changeCode(content);
          });
        }
      });

      const saveBtn = document.getElementById('saveToGitBtn');
      saveBtn?.addEventListener('click', async () => {
        const saveInput = document.getElementById('saveFileName') as HTMLInputElement | null;
        let targetName = saveInput ? saveInput.value.trim() : codeTabPane.currentFile || 'main.asm';
        if (!targetName.endsWith('.asm') && !targetName.endsWith('.s')) {
          targetName += '.asm';
        }
        try {
          consoleBox.log(`Saving "${targetName}" to ${GitUser.userName}/${GitUser.repo}...`, 'info');
          await GitUser.writeFileToRepo(targetName, CodeEditor.code);
          codeTabPane.currentFile = targetName;
          codeTabPane.showHTML();
          consoleBox.log(`Saved "${targetName}" to GitHub successfully.`, 'info');
        } catch (err) {
          consoleBox.log(`Failed to save "${targetName}" to GitHub.`, 'error');
        }
      });
    } else {
      codeTab.innerHTML = `
        <div class="explorer-header">WORKSPACE</div>
        <div class="code-tab-layer file-item active-file" id="tab-main-asm">
          <i class="fa-regular fa-file-code"></i> main.asm
        </div>
        <div class="explorer-hint">
          <i class="fa-brands fa-github"></i>
          <span>Connect GitHub from the sidebar to browse & load remote <code>.asm</code> files.</span>
        </div>
      `;
    }
  }
}

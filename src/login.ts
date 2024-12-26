import { StateVar, StyleVar } from "statebinderk";
import { GitUser } from "./github";

export const loginHTML = `
  <div class="pop-header">
    <h2 class="pop-title"><i class="fa-brands fa-github"></i> GitHub Integration</h2>
    <button id="closePop" class="pop-close" title="Close">&times;</button>
  </div>
  <p class="pop-subtitle">Sync or browse assembly files from a GitHub repository</p>
  <div class="pop-field">
    <label for="repository" class="pop-label">Repository Name</label>
    <input type="text" id="repository" class="pop-input" placeholder="AssemblyTS_codes">
  </div>
  <div class="pop-actions">
    <button id="loginGit" class="pop-button github-auth"><i class="fa-brands fa-github"></i> Login using GitHub OAuth</button>
    <button id="loginPAT" class="pop-button pat-auth"><i class="fa-solid fa-key"></i> Login using Personal Access Token</button>
    <button id="loginUser" class="pop-button username-auth"><i class="fa-solid fa-user"></i> Read-Only via Username</button>
  </div>
`;

export const loginPAT = `
  <div class="pop-header">
    <h2 class="pop-title"><i class="fa-solid fa-key"></i> PAT Authentication</h2>
    <button id="closePop" class="pop-close" title="Close">&times;</button>
  </div>
  <p class="pop-subtitle">Enter your GitHub username and Personal Access Token</p>
  <div class="pop-field">
    <input type="text" id="userName" class="pop-input" placeholder="GitHub Username" required>
    <input type="password" id="PAT" class="pop-input" placeholder="Personal Access Token (ghp_...)" required>
  </div>
  <div class="pop-actions">
    <button id="login" class="pop-button pat-auth">Connect Repository</button>
  </div>
`;

export const loginUser = `
  <div class="pop-header">
    <h2 class="pop-title"><i class="fa-solid fa-user"></i> Public Read-Only Access</h2>
    <button id="closePop" class="pop-close" title="Close">&times;</button>
  </div>
  <div class="pop-note">
    Read-only mode: browse and load public <code>.asm</code> files without a token.
  </div>
  <div class="pop-field">
    <input type="text" id="userName" class="pop-input" placeholder="GitHub Username" required>
  </div>
  <div class="pop-actions">
    <button id="login" class="pop-button username-auth">Load Repository</button>
  </div>
`;

// Reactive state bindings for the dialog modal using statebinderk
const dialogVisibility = new StyleVar<boolean>(
  false,
  'dialogBox',
  'display',
  (isOpen) => (isOpen ? 'flex' : 'none')
);

const dialogContent = new StateVar<string>(
  '',
  'dialogBox',
  (elem, html) => {
    elem.innerHTML = html;
  }
);

const hidePopBox = (): void => {
  dialogContent.transition('');
  dialogVisibility.transition(false);
  window.removeEventListener('click', handleClickOut);
};

const handleClickOut = (e: MouseEvent): void => {
  const popBox: HTMLElement | null = document.getElementById('dialogBox');
  if (popBox && e.target !== popBox && !popBox.contains(e.target as Node)) {
    hidePopBox();
  }
};

const bindCloseButton = (): void => {
  document.getElementById('closePop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hidePopBox();
  });
};

const handleUserOrPAT = async (e: MouseEvent, isPAT: boolean): Promise<void> => {
  e.stopPropagation();
  GitUser.addRepo();
  dialogContent.transition(isPAT ? loginPAT : loginUser);
  bindCloseButton();

  document.getElementById('login')?.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    const userName = (document.getElementById('userName') as HTMLInputElement).value.trim();
    if (!userName) return;
    GitUser.userName = userName;
    if (isPAT) {
      const token = (document.getElementById('PAT') as HTMLInputElement).value.trim();
      GitUser.setToken(token);
    }
    await GitUser.syncDOM();
    hidePopBox();
  });
};

export const handleLogin = (): void => {
  if (GitUser.repo === '') {
    dialogVisibility.transition(true);
    dialogContent.transition(loginHTML);
    window.addEventListener('click', handleClickOut);
    bindCloseButton();

    document.getElementById('loginGit')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      GitUser.addRepo();
      await GitUser.loginAuth();
      hidePopBox();
    });
    document.getElementById('loginPAT')?.addEventListener('click', (e) => {
      handleUserOrPAT(e, true);
    });
    document.getElementById('loginUser')?.addEventListener('click', (e) => {
      handleUserOrPAT(e, false);
    });
  } else {
    GitUser.reset();
  }
};

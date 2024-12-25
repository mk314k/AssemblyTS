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
    <h2 class="pop-title">Login</h2>
    <div class="pop-label">
        * This will be read-only access. You will not be able to save your code.
    </div>
    <input type="text" id="userName" class="pop-input" placeholder="Username" required>
    <button id="login" class="pop-button github-auth">Login</button>
`
const hidePopBox = (popBox:HTMLElement) => {
    popBox.innerHTML = '';
    popBox.style.display = 'none';
    window.removeEventListener('click', handleClickOut);
}

const handleClickOut = (e:MouseEvent) =>{
    const popBox:HTMLElement|null = document.getElementById('dialogBox');
    if (popBox && e.target !== popBox && !popBox.contains(e.target as Node)){
        hidePopBox(popBox);
    }
}
const handleUserOrPAT = async(e:MouseEvent, popBox:HTMLElement, isPAT:boolean) =>{
    e.stopPropagation();
    GitUser.addRepo();
    popBox.innerHTML = isPAT ? loginPAT : loginUser;
    document.getElementById('login')?.addEventListener('click', async(ev)=>{
        ev.stopPropagation();
        const userName = (document.getElementById('userName') as HTMLInputElement).value;
        GitUser.userName = userName;
        if (isPAT){
            const token = (document.getElementById('PAT') as HTMLInputElement).value;
            GitUser.setToken(token);
        }
        await GitUser.syncDOM();
        hidePopBox(popBox);
    })
}

export const handleLogin = () => {
    if (GitUser.repo === ''){
        const popBox = document.getElementById('dialogBox');
        if (popBox){
            popBox.style.display = 'flex';
            window.addEventListener('click', handleClickOut);
            popBox.innerHTML = loginHTML;
            document.getElementById('loginGit')?.addEventListener('click', async(e)=>{
                e.stopPropagation();
                GitUser.addRepo();
                await GitUser.loginAuth();
                hidePopBox(popBox);
            })
            document.getElementById('loginPAT')?.addEventListener('click', (e)=>{
                handleUserOrPAT(e, popBox, true);
            })
            document.getElementById('loginUser')?.addEventListener('click', (e)=>{
                handleUserOrPAT(e, popBox, false);
            })
        }
    }else{
        const gitStatus = document.getElementById('gitStatus');
        if(gitStatus){
            gitStatus.innerText = 'Login';
            GitUser.reset();
        }
    }
    
}





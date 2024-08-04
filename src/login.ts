import { GitUser } from "./github";

export const loginHTML = `
    <h2 class="pop-title">Login</h2>
    <div class="flex-horizontal">
        <label for="repository" class="pop-label">Repository</label>
        <input type="text" id="repository" class="pop-input" placeholder="AssemblyTS_codes">
    </div>
    <button id="loginGit" class="pop-button github-auth">Login using GithubAuth</button>
    <button id="loginPAT" class="pop-button pat-auth">Login using PAT</button>
    <button id="loginUser" class="pop-button username-auth">Login using Username</button>
`

export const loginPAT = `
    <h2 class="pop-title">Login</h2>
    <input type="text" id="userName" class="pop-input" placeholder="Username" required>
    <input type="password" id="PAT" class="pop-input" placeholder="Personal Access Token" required>
    <button id="login" class="pop-button github-auth">Login</button>
`
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





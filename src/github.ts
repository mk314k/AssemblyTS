import axios from 'axios';
import { CodeEditor } from './editor';

const GITHUB_CLIENT_ID: string = 'Ov23liZl7f0TzzDD0CSA';
const TOKEN_URI: string = 'https://purpletreeauth.netlify.app/.netlify/functions/api/auth/github/callback';
const REDIRECT_URI: string = 'https://mk314k.github.io/AssemblyTS/';

interface RepoFileInfo{
    name:string;
    url:string;
}
interface RepoFileContent{
    name:string;
    content:string;
}

export class GitUser{
    public static userName:string = '';
    private static token:string = '';
    public static repo:string = '';

    constructor(){}

    public static reset(){
        GitUser.userName = '';
        GitUser.repo = '';
        GitUser.token = '';
    }

    public static addRepo(){
        let repo = (document.getElementById('repository') as HTMLInputElement).value;
        if (repo === ''){
            repo = 'AssemblyTS_codes'
        }
        GitUser.repo = repo;
    }

    public static setToken(pat:string){
        GitUser.token = pat;
    }
    public static async syncDOM(auth=false){
        const gitStatus = document.getElementById('gitStatus');
        if (gitStatus){
            const repoResponse = await fetch(`https://api.github.com/repos/${GitUser.userName}/${GitUser.repo}/contents/`);
            if (repoResponse.status === 200){
                gitStatus.innerText = 'Logout';
                const repoFiles:RepoFileInfo[] = await repoResponse.json();
                codeTabPane.fetchRepoContents(repoFiles);
            }else if(auth){
                await this.createRepo();
                await this.syncDOM();
            }else{
                GitUser.reset();
            }
        }   
    }
    public static async loginAuth(){
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
        window.location.href = authUrl;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            window.location.href = REDIRECT_URI;
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

    }
    private static getUserInfo = async (token: string): Promise<string> => {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${token}`
            }
        });
        return response.data;
    };

    private static createRepo = async (): Promise<void> => {
        if (this.token !== ''){
            await axios.post('https://api.github.com/user/repos', {
                name: this.repo,
                private: false
            }, {
                headers: {
                    Authorization: `token ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    };
    public static writeFileToRepo = async (path: string, content: string): Promise<void> => {
        if (this.token){
            const base64Content = btoa(content); // Encode content to Base64
            await axios.put(`https://api.github.com/repos/${this.repo}/contents/${path}`, {
                message: `Editing ${path}`,
                content: base64Content
            }, {
                headers: {
                    Authorization: `token ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    };


}

export class codeTabPane{
    public static repoCodes = new Map<string, string>;
    public static localCodes = new Map<string, string>;
    constructor(){}
    public static async fetchRepoContents(repoFiles:RepoFileInfo[]){
        for (const file of repoFiles){
            if (file.name.endsWith('.asm')){
                const response = await fetch(file.url);
                if (response.status === 200){
                    const fileData:RepoFileContent = await response.json();
                    codeTabPane.repoCodes.set(fileData.name, atob(fileData.content))
                }
            }
        }
    }
    public static showHTML(){
        if (GitUser.repo !== '' && GitUser.userName !== ''){
            const codeTab = document.getElementById('codeTab');
            if (codeTab){
                codeTab.innerHTML = `
                    <div class="code-tab-layer">
                        ${GitUser.userName}
                        <div class="code-tab-layer">
                            ${GitUser.repo}
                            ${codeTabPane.repoCodes.forEach(
                                (_, fname)=>{
                                    return `<div id="tab-${fname}" class="code-tab-layer">${fname}</div>`
                                }
                            )}
                        </div>
                    </div>
                `
                this.repoCodes.forEach(
                    (content, fname)=>{
                        const tabf = document.getElementById(`tab-${fname}`);
                        if (tabf){
                            tabf.addEventListener('click', ()=>{
                                tabf.style.color = 'blue';
                                CodeEditor.changeCode(content);
                            });
                        }
                    }
                );
            }

        }
    }
    
}

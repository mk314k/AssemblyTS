import axios from 'axios';
import { CodeEditor } from './editor';

const GITHUB_CLIENT_ID: string = 'Ov23liZl7f0TzzDD0CSA';
const TOKEN_URI: string = 'https://purpletreeauth.netlify.app/.netlify/functions/api/auth/github/callback';
const REDIRECT_URI: string = 'http://localhost:5173/';

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
    public static async syncDOM(){
        const gitStatus = document.getElementById('gitStatus');
        if (gitStatus){
            const repoResponse = await fetch(`https://api.github.com/repos/${GitUser.userName}/${GitUser.repo}/contents/`);
            if (repoResponse.status === 200){
                gitStatus.innerText = 'Logout';
                const codeTab = document.getElementById('codeTab');
                const repoFiles:RepoFileInfo[] = await repoResponse.json();
                if (codeTab){
                    codeTab.innerText = `${GitUser.userName}\n${GitUser.repo}`
                    for (const file of repoFiles){
                        if (file.name.endsWith('.asm')){
                            codeTab.innerText += `\n${file.name}`
                        }
                    }
                }
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




const fetchRepos = async (token: string): Promise<any[]> => {
    const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
            Authorization: `token ${token}`
        }
    });
    return response.data;
};

const checkRepoExists = async (token: string, repoName: string): Promise<boolean> => {
    const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
            Authorization: `token ${token}`
        }
    });
    return response.data.some((repo: any) => repo.name === repoName);
};

const createRepo = async (token: string, repoName: string): Promise<any> => {
    const response = await axios.post('https://api.github.com/user/repos', {
        name: repoName,
        private: false
    }, {
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const listFilesInRepo = async (token: string, repoName: string, extension: string): Promise<any[]> => {
    const response = await axios.get(`https://api.github.com/repos/${repoName}/contents`, {
        headers: {
            Authorization: `token ${token}`
        }
    });
    return response.data.filter((file: any) => file.name.endsWith(`.${extension}`));
};

const writeFileToRepo = async (token: string, repoName: string, path: string, content: string): Promise<any> => {
    const base64Content = btoa(content); // Encode content to Base64
    const response = await axios.put(`https://api.github.com/repos/${repoName}/contents/${path}`, {
        message: `Add ${path}`,
        content: base64Content
    }, {
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const displayRepos = (repos: any[]) => {
    const reposList = document.getElementById('repos');
    reposList!.innerHTML = '';
    repos.forEach((repo: any) => {
        const listItem = document.createElement('li');
        listItem.textContent = repo.name;
        reposList!.appendChild(listItem);
    });
};
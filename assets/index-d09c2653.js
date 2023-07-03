(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const i of t.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function n(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=n(e);fetch(e.href,t)}})();function c(){const r=document.getElementById("root");r&&(r.innerHTML=`
    <div class="registers" id="registers"></div>
    <div class="flex-horizontal">
        <div class="memory" id="instruction-memory"></div>
        <div class="code-container flex-vertical" id="code-container">
            <textarea name="code" id="code" cols="30" rows="10"></textarea>
            <div class="flex-horizontal">
                <button>Compile</button>
            </div>
        </div>
        <div class="memory" id="data-memory"></div>
    </div>
  `)}document.addEventListener("DOMContentLoaded",c);

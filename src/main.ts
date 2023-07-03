import './style.css'


function main(): void {
  const root:HTMLElement|null = document.getElementById("root");
  if (root){
    root.innerHTML = `
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
  `;
  }
  
}

// Call the main function when the DOM is ready
document.addEventListener("DOMContentLoaded", main);


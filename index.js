// document.addEventListener('DOMContentLoaded', function() {
//     const textarea = document.getElementById('code');

//     textarea.addEventListener('keydown', function(event) {
//         const lineNumber = textarea.value.substr(0, textarea.selectionStart).split('\n').length;
        
//         if (event.keyCode === 8 && lineNumber <= 3) {
//             // Prevent backspace deletion for lines 1 to 3
//             event.preventDefault();
//         }
//     });
// });

// // Get the textarea elements
// const codeTextarea = document.getElementById('code');
// const consoleTextarea = document.getElementById('console');

// // Store the initial heights of the textareas
// let codeHeight = codeTextarea.clientHeight;
// let consoleHeight = consoleTextarea.clientHeight;

// // Add event listeners for textarea resize
// codeTextarea.addEventListener('resize', handleResize);
// consoleTextarea.addEventListener('resize', handleResize);

// function handleResize(event) {
//     // Calculate the difference in heights
//     const codeDiff = codeTextarea.clientHeight - codeHeight;
//     const consoleDiff = consoleTextarea.clientHeight - consoleHeight;

//     // Adjust the heights to keep the sum constant
//     codeHeight -= codeDiff;
//     consoleHeight -= consoleDiff;

//     // Set the heights
//     codeTextarea.style.height = `${codeHeight}px`;
//     consoleTextarea.style.height = `${consoleHeight}px`;
// }


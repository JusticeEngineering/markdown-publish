import { createWysimark } from "@wysimark/standalone"

const container = document.getElementById("editor-container")

/**
 * Create the Wysimark component
 */
const wysimark = createWysimark(container, {
  initialMarkdown: "# Hello World",
})

debugger;
console.log('the object: ', wysimark);
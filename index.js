/* global customElements */

// import { createWysimark } from "@wysimark/standalone"
import { AutoIPFSOptions } from "./components/ipfs-options"
import { AutoIPFSUpload } from "./components/ipfs-upload"
import { initialMarkdown } from "./initial-markdown"

customElements.define('auto-ipfs-options', AutoIPFSOptions)
customElements.define('auto-ipfs-upload', AutoIPFSUpload)

const autoIpfsOptionsEl = document.createElement('auto-ipfs-options')
const autoIpfsUploadEl = document.createElement('auto-ipfs-upload')
const settingsContainer = document.getElementById("settings-container")

settingsContainer.appendChild(autoIpfsOptionsEl)
settingsContainer.appendChild(autoIpfsUploadEl)

const container = document.getElementById("editor-container")
autoIpfsUploadEl.wysimark = createWysimark(container, { initialMarkdown })
/* global HTMLElement */
// http://localhost:5001 ipfs-desktop
import generateFullListHTML from '../wrapper-template'
const apiURL = new URL('http://localhost:45004')
const linkListExtensionId = "oippibkapdadgfngkegdbfooknnmnogc";


export class AutoIPFSUpload extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button>Publish to IPFS</button>
      <ul class="filelist"></ul>
    `

    this.uploadButton.addEventListener('click', async (e) => {
      const innerHTML = document.querySelector('#editor-container div[role="textbox"]').innerHTML;

      const blob = new Blob([generateFullListHTML(innerHTML)], { type: 'text/html' })
      blob.name = 'index.html'
      await this.uploadFile(blob)
    })
  }

  get uploadButton() {
    return this.querySelector('button')
  }

  get list() {
    return this.querySelector('ul')
  }

  listFile(name, url) {
    const li = document.createElement('li')
    li.innerHTML = `<a href="${url}">${name}: ${url}</a>`

    this.list.appendChild(li)
  }

  showLinkListCreatorButton(url) {
    const button = document.createElement('button')
    button.textContent = 'Create Link List including this link'
    button.addEventListener('click', (ev) => {
      ev.preventDefault()
      chrome.runtime.sendMessage(linkListExtensionId, {url},
        function(response) {
          console.log('message to link list extension response: ', response);
        }
      );
    })
    this.list.appendChild(button)
  }

  async uploadFile(file) {
    const apiCall = `${apiURL}api/v0/add`
    const xhr = new XMLHttpRequest() // older XHR API us used because window.fetch appends Origin which causes error 403 in go-ipfs
    // synchronous mode with small timeout
    // (it is okay, because we do it only once, then it is cached and read via readAndCacheDnslink)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const cid = JSON.parse(xhr.response)['Hash']
        const url = `ipfs://${cid}/`
        this.listFile(file.name, url)

        this.showLinkListCreatorButton(url)
      }
    };
    xhr.open('POST', apiCall, true);
    var formData = new FormData();
    formData.append("thefile", file);
    console.log('uploading file: ', file);
    console.log('uploading file: ', formData);
    console.log(xhr);
    console.log(apiCall)
    xhr.send(formData);
  }
}
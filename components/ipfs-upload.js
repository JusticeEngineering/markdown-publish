/* global HTMLElement */
// http://localhost:5001 ipfs-desktop
const apiURL = new URL('http://localhost:48083')

export class AutoIPFSUpload extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button>Publish to IPFS</button>
      <ul class="filelist"></ul>
    `

    this.uploadButton.addEventListener('click', async (e) => {
      const blob = new Blob([this.wysimark.getMarkdown()], { type: 'text/markdown' })
      blob.name = 'index.md'
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

  async uploadFile(file) {
    const apiCall = `${apiURL}/api/v0/add`
    const xhr = new XMLHttpRequest() // older XHR API us used because window.fetch appends Origin which causes error 403 in go-ipfs
    // synchronous mode with small timeout
    // (it is okay, because we do it only once, then it is cached and read via readAndCacheDnslink)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        this.listFile(file.name, `ipfs://${JSON.parse(xhr.response)['Hash']}/`)
      }
    };
    xhr.open('post', apiCall, true)
    var formData = new FormData();
    formData.append("thefile", file);
    xhr.send(formData);
  }
}
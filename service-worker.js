// Allows users to open the side panel by clicking on the action toolbar icon
chrome.action.onClicked.addListener(
   () => chrome.tabs.create({
    url: 'index.html'
  })
)
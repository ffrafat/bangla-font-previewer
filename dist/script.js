const selectFolderBtn = document.getElementById('select-folder-btn');
const folderPickerContainer = document.getElementById('folder-picker-container');
const sentenceContainer = document.getElementById('sentence-container');
const customSentenceInput = document.getElementById('custom-sentence');

const utilityBar = document.getElementById('utility-bar');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const fontPreviews = document.getElementById('font-previews');

let currentFonts = [];
let currentSentence = '';
let currentSearchTerm = '';
let currentSortOrder = 'az';

async function loadFontFolder(folderPath) {
  if (!folderPath) return;

  const fontFiles = await window.electronAPI.readFontFiles(folderPath);
  if (fontFiles.length === 0) {
    alert('No font files found in the selected folder');
    return;
  }

  folderPickerContainer.style.display = 'none';
  sentenceContainer.style.display = 'flex';
  utilityBar.style.display = 'flex';

  currentFonts = fontFiles;
  currentSentence = customSentenceInput.value;
  currentSearchTerm = '';
  searchInput.value = '';
  renderPreviews(currentSentence, currentSearchTerm);
}

// Manual folder selection
selectFolderBtn.addEventListener('click', async () => {
  fontPreviews.innerHTML = '';
  const folderPath = await window.electronAPI.selectFontFolder();
  if (!folderPath) {
    alert('No folder selected');
    return;
  }
  loadFontFolder(folderPath);
});

// React to folder change from menu
window.electronAPI.onFontFolderUpdated((folderPath) => {
  fontPreviews.innerHTML = '';
  loadFontFolder(folderPath);
});

// Load saved folder on app start
(async () => {
  const savedFolder = await window.electronAPI.getSavedFontFolder();
  if (savedFolder) {
    loadFontFolder(savedFolder);
  }
})();

// Sentence change
customSentenceInput.addEventListener('input', () => {
  currentSentence = customSentenceInput.value;
  renderPreviews(currentSentence, currentSearchTerm);
});

// Search input
searchInput.addEventListener('input', () => {
  currentSearchTerm = searchInput.value.toLowerCase();
  renderPreviews(currentSentence, currentSearchTerm);
});

// Sort change
sortSelect.addEventListener('change', () => {
  currentSortOrder = sortSelect.value;
  renderPreviews(currentSentence, currentSearchTerm);
});

function renderPreviews(sentence, searchTerm) {
  fontPreviews.innerHTML = '';

  let filteredFonts = currentFonts.filter(({ name }) =>
    name.toLowerCase().includes(searchTerm)
  );

  filteredFonts.sort((a, b) => {
    if (currentSortOrder === 'az') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  filteredFonts.forEach(({ path: fontPath, name: fontName }) => {
    const fontUrl = `file://${fontPath.replace(/\\/g, '/')}`;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${fontUrl}');
      }
    `;
    document.head.appendChild(style);

    const previewBlock = document.createElement('div');
    previewBlock.className = 'font-preview';

    const nameEl = document.createElement('div');
    nameEl.className = 'font-name';
    nameEl.textContent = fontName;

    const sampleEl = document.createElement('div');
    sampleEl.className = 'font-sample';
    sampleEl.style.fontFamily = fontName;
    sampleEl.textContent = sentence;

    previewBlock.appendChild(nameEl);
    previewBlock.appendChild(sampleEl);
    fontPreviews.appendChild(previewBlock);
  });
}

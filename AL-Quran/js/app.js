/* ============================================================
   app.js — navigation, rendering, bookmarks, settings, search
   ============================================================ */

(() => {
  const els = {
    surahList: document.getElementById('surahList'),
    homeLoading: document.getElementById('homeLoading'),
    homeError: document.getElementById('homeError'),
    retryBtn: document.getElementById('retryBtn'),
    searchInput: document.getElementById('searchInput'),
    continueCard: document.getElementById('continueCard'),
    continueTitle: document.getElementById('continueTitle'),
    continueBtn: document.getElementById('continueBtn'),

    readerBack: document.getElementById('readerBack'),
    readerNumber: document.getElementById('readerNumber'),
    readerArabicName: document.getElementById('readerArabicName'),
    readerEnglishName: document.getElementById('readerEnglishName'),
    readerMeta: document.getElementById('readerMeta'),
    bismillah: document.getElementById('bismillah'),
    ayahList: document.getElementById('ayahList'),
    readerLoading: document.getElementById('readerLoading'),

    bookmarkList: document.getElementById('bookmarkList'),
    bookmarksEmpty: document.getElementById('bookmarksEmpty'),

    translationSelect: document.getElementById('translationSelect'),
    reciterSelect: document.getElementById('reciterSelect'),
    translationToggle: document.getElementById('translationToggle'),
    arabicSizeRange: document.getElementById('arabicSizeRange'),
    settingsShortcut: document.getElementById('settingsShortcut'),

    navBtns: document.querySelectorAll('.nav-btn'),
  };

  const STORAGE_KEYS = {
    bookmarks: 'noor.bookmarks',
    settings: 'noor.settings',
    lastRead: 'noor.lastRead',
  };

  let allSurahs = [];
  let currentSurah = null;   // metadata of surah open in reader
  let currentAyahs = [];     // ayahs of surah open in reader

  const settings = loadSettings();
  applySettingsToUI();

  // ---------------- storage helpers ----------------
  function loadSettings() {
    try {
      return Object.assign(
        { translation: 'en.asad', reciter: 'ar.alafasy', showTranslation: true, arabicSize: 28 },
        JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}')
      );
    } catch { return { translation: 'en.asad', reciter: 'ar.alafasy', showTranslation: true, arabicSize: 28 }; }
  }
  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }
  function loadBookmarks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookmarks) || '[]'); }
    catch { return []; }
  }
  function saveBookmarks(list) {
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(list));
  }
  function saveLastRead(surahNumber, surahNameEn) {
    localStorage.setItem(STORAGE_KEYS.lastRead, JSON.stringify({ surahNumber, surahNameEn }));
  }
  function loadLastRead() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.lastRead) || 'null'); }
    catch { return null; }
  }

  function applySettingsToUI() {
    els.translationSelect.value = settings.translation;
    els.reciterSelect.value = settings.reciter;
    els.translationToggle.checked = settings.showTranslation;
    els.arabicSizeRange.value = settings.arabicSize;
    document.documentElement.style.setProperty('--ayah-arabic-size', settings.arabicSize + 'px');
    Player.setReciter(settings.reciter);
  }

  // ---------------- navigation ----------------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${name}`).classList.remove('hidden');
    els.navBtns.forEach(b => b.classList.toggle('active', b.dataset.screen === name));
    if (name === 'bookmarks') renderBookmarks();
    document.getElementById('appMain').scrollTop = 0;
  }

  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });
  els.settingsShortcut.addEventListener('click', () => showScreen('settings'));
  els.readerBack.addEventListener('click', () => showScreen('home'));

  // ---------------- home: surah list ----------------
  async function loadSurahs() {
    els.homeLoading.classList.remove('hidden');
    els.homeError.classList.add('hidden');
    els.surahList.innerHTML = '';
    try {
      allSurahs = await QuranAPI.getSurahList();
      renderSurahList(allSurahs);
      const last = loadLastRead();
      if (last) {
        els.continueCard.classList.remove('hidden');
        els.continueTitle.textContent = last.surahNameEn;
        els.continueBtn.onclick = () => openSurah(last.surahNumber);
      }
    } catch (err) {
      els.homeError.classList.remove('hidden');
    } finally {
      els.homeLoading.classList.add('hidden');
    }
  }

  function renderSurahList(list) {
    els.surahList.innerHTML = '';
    if (list.length === 0) {
      els.surahList.innerHTML = `<p style="color:var(--muted);text-align:center;padding:30px 0;">No surah matches your search.</p>`;
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(surah => {
      const li = document.createElement('li');
      li.className = 'surah-item';
      li.innerHTML = `
        <div class="surah-badge">${surah.number}</div>
        <div class="surah-info">
          <div class="surah-info-top">
            <span class="surah-name-en">${surah.englishName}</span>
            <span class="surah-name-ar">${surah.name}</span>
          </div>
          <div class="surah-info-bottom">
            <span>${surah.revelationType}</span>
            <span>&middot;</span>
            <span>${surah.numberOfAyahs} verses</span>
          </div>
        </div>`;
      li.addEventListener('click', () => openSurah(surah.number));
      frag.appendChild(li);
    });
    els.surahList.appendChild(frag);
  }

  els.retryBtn.addEventListener('click', loadSurahs);

  els.searchInput.addEventListener('input', () => {
    const q = els.searchInput.value.trim().toLowerCase();
    if (!q) { renderSurahList(allSurahs); return; }
    const filtered = allSurahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(q) ||
      String(s.number) === q
    );
    renderSurahList(filtered);
  });

  // ---------------- reader ----------------
  async function openSurah(number) {
    currentSurah = allSurahs.find(s => s.number === number);
    showScreen('reader');
    els.readerLoading.classList.remove('hidden');
    els.ayahList.innerHTML = '';

    if (currentSurah) {
      els.readerNumber.textContent = `Surah ${currentSurah.number} of 114`;
      els.readerArabicName.textContent = currentSurah.name;
      els.readerEnglishName.textContent = `${currentSurah.englishName} — ${currentSurah.englishNameTranslation}`;
      els.readerMeta.textContent = `${currentSurah.revelationType} · ${currentSurah.numberOfAyahs} verses`;
      els.bismillah.classList.toggle('hidden', currentSurah.number === 1 || currentSurah.number === 9);
      saveLastRead(currentSurah.number, currentSurah.englishName);
    }

    try {
      currentAyahs = await QuranAPI.getSurah(number, settings.translation);
      renderAyahs();
    } catch (err) {
      els.ayahList.innerHTML = `<p style="color:var(--muted);text-align:center;padding:30px 0;">Couldn't load this surah. Please try again.</p>`;
    } finally {
      els.readerLoading.classList.add('hidden');
    }
  }

  function isBookmarked(surahNumber, ayahNumberInSurah) {
    return loadBookmarks().some(b => b.surahNumber === surahNumber && b.ayahNumberInSurah === ayahNumberInSurah);
  }

  function toggleBookmark(ayah, btn) {
    const list = loadBookmarks();
    const idx = list.findIndex(b => b.surahNumber === currentSurah.number && b.ayahNumberInSurah === ayah.numberInSurah);
    if (idx >= 0) {
      list.splice(idx, 1);
      btn.classList.remove('active');
    } else {
      list.unshift({
        surahNumber: currentSurah.number,
        surahNameEn: currentSurah.englishName,
        surahNameAr: currentSurah.name,
        ayahNumberInSurah: ayah.numberInSurah,
        arabic: ayah.arabic,
        translation: ayah.translation,
      });
      btn.classList.add('active');
    }
    saveBookmarks(list);
  }

  function renderAyahs() {
    els.ayahList.innerHTML = '';
    const frag = document.createDocumentFragment();
    currentAyahs.forEach((ayah, i) => {
      const block = document.createElement('div');
      block.className = 'ayah-block';
      block.dataset.ayahNumber = ayah.numberInSurah;
      block.innerHTML = `
        <div class="ayah-head">
          <span class="ayah-number">${ayah.numberInSurah}</span>
          <div class="ayah-actions">
            <button class="play-btn" aria-label="Play ayah">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="bookmark-btn ${isBookmarked(currentSurah.number, ayah.numberInSurah) ? 'active' : ''}" aria-label="Bookmark ayah">
              <svg viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1Z"/></svg>
            </button>
          </div>
        </div>
        <p class="ayah-arabic" style="font-size:var(--ayah-arabic-size)">${ayah.arabic}</p>
        <p class="ayah-translation ${settings.showTranslation ? '' : 'hidden'}">${ayah.translation}</p>
      `;
      block.querySelector('.play-btn').addEventListener('click', () => {
        Player.playQueue(currentAyahs, i, currentSurah.englishName);
      });
      block.querySelector('.bookmark-btn').addEventListener('click', (e) => {
        toggleBookmark(ayah, e.currentTarget);
      });
      frag.appendChild(block);
    });
    els.ayahList.appendChild(frag);
  }

  Player.setOnAyahChange((ayah) => {
    document.querySelectorAll('.ayah-block').forEach(b => {
      b.classList.toggle('playing', Number(b.dataset.ayahNumber) === ayah.numberInSurah);
    });
  });

  // ---------------- bookmarks screen ----------------
  function renderBookmarks() {
    const list = loadBookmarks();
    els.bookmarksEmpty.classList.toggle('hidden', list.length > 0);
    els.bookmarkList.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(b => {
      const li = document.createElement('li');
      li.className = 'bookmark-item';
      li.innerHTML = `
        <div class="bookmark-item-top">
          <span>${b.surahNameEn} ${b.ayahNumberInSurah}</span>
          <button class="bookmark-remove">Remove</button>
        </div>
        <p class="bookmark-item-arabic">${b.arabic}</p>
      `;
      li.querySelector('.bookmark-item-arabic').addEventListener('click', () => openSurah(b.surahNumber));
      li.querySelector('.bookmark-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = loadBookmarks().filter(x =>
          !(x.surahNumber === b.surahNumber && x.ayahNumberInSurah === b.ayahNumberInSurah));
        saveBookmarks(updated);
        renderBookmarks();
      });
      frag.appendChild(li);
    });
    els.bookmarkList.appendChild(frag);
  }

  // ---------------- settings ----------------
  els.translationSelect.addEventListener('change', () => {
    settings.translation = els.translationSelect.value;
    saveSettings();
    if (currentSurah) openSurah(currentSurah.number);
  });
  els.reciterSelect.addEventListener('change', () => {
    settings.reciter = els.reciterSelect.value;
    saveSettings();
    Player.setReciter(settings.reciter);
  });
  els.translationToggle.addEventListener('change', () => {
    settings.showTranslation = els.translationToggle.checked;
    saveSettings();
    document.querySelectorAll('.ayah-translation').forEach(p => p.classList.toggle('hidden', !settings.showTranslation));
  });
  els.arabicSizeRange.addEventListener('input', () => {
    settings.arabicSize = Number(els.arabicSizeRange.value);
    saveSettings();
    document.documentElement.style.setProperty('--ayah-arabic-size', settings.arabicSize + 'px');
  });

  // ---------------- init ----------------
  loadSurahs();
})();

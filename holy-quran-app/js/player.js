/* ============================================================
   player.js — controls the <audio> element and the mini-player UI
   for sequential ayah-by-ayah playback.
   ============================================================ */

const Player = (() => {
  const audioEl = document.getElementById('audioEl');
  const miniPlayer = document.getElementById('miniPlayer');
  const miniSurah = document.getElementById('miniPlayerSurah');
  const miniAyah = document.getElementById('miniPlayerAyah');
  const miniPlayPause = document.getElementById('miniPlayPause');
  const miniPlayIcon = document.getElementById('miniPlayIcon');
  const miniPrev = document.getElementById('miniPrev');
  const miniNext = document.getElementById('miniNext');

  let queue = [];       // [{globalNumber, numberInSurah, surahName}, ...]
  let index = -1;
  let reciter = 'ar.alafasy';
  let onAyahChange = null; // callback(ayah) fired when active ayah changes

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  function setReciter(r) { reciter = r; }
  function setOnAyahChange(fn) { onAyahChange = fn; }

  function playQueue(ayahs, startIndex, surahName) {
    queue = ayahs.map(a => ({ ...a, surahName }));
    index = startIndex;
    playCurrent();
  }

  function playCurrent() {
    if (index < 0 || index >= queue.length) return;
    const ayah = queue[index];
    audioEl.src = QuranAPI.ayahAudioUrl(ayah.globalNumber, reciter);
    audioEl.play().catch(() => {});
    miniSurah.textContent = ayah.surahName;
    miniAyah.textContent = `Ayah ${ayah.numberInSurah}`;
    miniPlayer.classList.remove('hidden');
    miniPlayIcon.innerHTML = ICON_PAUSE;
    if (onAyahChange) onAyahChange(ayah);
  }

  function togglePlayPause() {
    if (!audioEl.src) return;
    if (audioEl.paused) {
      audioEl.play();
      miniPlayIcon.innerHTML = ICON_PAUSE;
    } else {
      audioEl.pause();
      miniPlayIcon.innerHTML = ICON_PLAY;
    }
  }

  function next() {
    if (index < queue.length - 1) {
      index++;
      playCurrent();
    }
  }

  function prev() {
    if (index > 0) {
      index--;
      playCurrent();
    }
  }

  audioEl.addEventListener('ended', next);
  miniPlayPause.addEventListener('click', togglePlayPause);
  miniNext.addEventListener('click', next);
  miniPrev.addEventListener('click', prev);

  return { playQueue, togglePlayPause, next, prev, setReciter, setOnAyahChange };
})();

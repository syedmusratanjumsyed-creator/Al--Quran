/* ============================================================
   api.js — thin wrapper around the free AlQuran Cloud API
   Docs: https://alquran.cloud/api
   No API key required.
   ============================================================ */

const QuranAPI = (() => {
  const BASE = 'https://api.alquran.cloud/v1';
  const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    if (json.code !== 200) throw new Error(json.status || 'API error');
    return json.data;
  }

  /** List of all 114 surahs with metadata */
  function getSurahList() {
    return getJSON(`${BASE}/surah`);
  }

  /**
   * Full surah text, Arabic (Uthmani script) + a chosen translation,
   * fetched together via the "editions" endpoint in one request.
   */
  async function getSurah(number, translationEdition) {
    const data = await getJSON(
      `${BASE}/surah/${number}/editions/quran-uthmani,${translationEdition}`
    );
    // data is an array: [arabicEdition, translationEdition]
    const [arabic, translation] = data;
    return arabic.ayahs.map((ayah, i) => ({
      numberInSurah: ayah.numberInSurah,
      globalNumber: ayah.number,
      arabic: ayah.text,
      translation: translation.ayahs[i] ? translation.ayahs[i].text : ''
    }));
  }

  /** Audio URL for a single ayah, by its GLOBAL ayah number (1-6236) */
  function ayahAudioUrl(globalAyahNumber, reciter) {
    return `${AUDIO_CDN}/128/${reciter}/${globalAyahNumber}.mp3`;
  }

  return { getSurahList, getSurah, ayahAudioUrl };
})();

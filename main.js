(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    /* ---------- 1. ПРЕЛОАДЕР ---------- */
    (function initPreloader() {
        const scene = $('vinylScene');
        const vinyl = $('vinyl');
        if (!scene || !vinyl) return;

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const finish = () => {
            scene.classList.add('is-zooming');
            document.body.classList.add('is-loaded');
            setTimeout(() => scene.classList.add('is-done'), 300);
            setTimeout(() => { scene.style.display = 'none'; }, 900);
        };

        if (reduce) { setTimeout(finish, 400); return; }
        setTimeout(() => vinyl.classList.add('is-playing'), 100);
        setTimeout(finish, 1900);
    })();

    /* ---------- 2. REVEAL ---------- */
    (function initReveal() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const els = document.querySelectorAll('.reveal');
        if (els.length) {
            if (reduce) {
                els.forEach(el => el.classList.add('is-visible'));
            } else {
                const io = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            io.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
                els.forEach(el => io.observe(el));
            }
        }

        const lines = document.querySelectorAll('.reveal-line');
        if (!lines.length) return;

        if (reduce) {
            lines.forEach(el => el.classList.add('is-visible'));
            return;
        }

        document.querySelectorAll('.about-text, .about-facts').forEach(group => {
            const children = group.querySelectorAll(':scope > .reveal-line');
            children.forEach((el, i) => {
                el.style.transitionDelay = (i * 120) + 'ms';
            });
        });

        const ioLines = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    ioLines.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

        lines.forEach(el => ioLines.observe(el));
    })();

    /* ---------- 3. NAV ---------- */
    (function initNav() {
        const nav = $('nav');
        if (nav) {
            const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                const hash = link.getAttribute('href');
                if (!hash || !hash.startsWith('#')) return;
                const target = document.querySelector(hash);
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - 72;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    })();

    /* ---------- 4. ПАРАЛЛАКС ФОНА ---------- */
    (function initParallax() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        if (window.matchMedia('(max-width: 900px)').matches) return;

        const g1 = document.querySelector('.bg-glow-1');
        const g2 = document.querySelector('.bg-glow-2');
        if (!g1 || !g2) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                g1.style.transform = `translate(${y * 0.05}px, ${y * 0.08}px)`;
                g2.style.transform = `translate(${-y * 0.04}px, ${-y * 0.06}px)`;
                ticking = false;
            });
        }, { passive: true });
    })();

    /* ---------- 5. TOAST ---------- */
    const toastEl = $('toast');
    let toastTimer = null;
    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
    }

    /* ---------- 6. ДАННЫЕ ТРЕКОВ ---------- */
    const TRACKS = [
        { id: 'odin',         title: 'Один',            src: 'tracks/odin.mp3',         cover: 'images/odin.jpg',         explicit: false, isNew: true,  year: 2026, download: 'https://disk.yandex.ru/d/O2IQDn6LCaRTMg' },
        { id: 'krasnypamad',  title: 'Красная помада',  src: 'tracks/krasnypamad.mp3',  cover: 'images/krasnypamad.jpg',  explicit: false, isNew: false, year: 2026, download: 'https://disk.yandex.ru/d/OmnzTJW66Z8C5Q' },
        { id: 'mac',          title: 'Мак',             src: 'tracks/mac.mp3',          cover: 'images/mac.jpg',          explicit: true,  isNew: false, year: 2026, download: 'https://disk.yandex.ru/d/ORYaVaVEi3cD4w' },
        { id: 'svetotekrany', title: 'Свет от экрана',  src: 'tracks/svetotekrany.mp3', cover: 'images/svetotekrany.jpg', explicit: false, isNew: false, year: 2026, download: 'https://disk.yandex.ru/d/yk3YBEAlWYv8IQ' },
        { id: 'snovavigre',   title: 'Снова в игре',    src: 'tracks/snovavigre.mp3',   cover: 'images/snovavigre.jpg',   explicit: true,  isNew: false, year: 2026, download: 'https://disk.yandex.ru/d/-g5wbqh_AKJrZA' },
        { id: 'tretiychas',   title: 'Третий час',      src: 'tracks/tretiychas.mp3',   cover: 'images/tretiychas.jpg',   explicit: true,  isNew: false, year: 2026, download: 'https://disk.yandex.ru/d/eDFlIXMeme-U4Q' }
    ];

    /* ---------- 7. ПЛЕЕР ---------- */
    (function initPlayer() {
        const playerEl = $('player');
        const playerList = $('playerList');
        if (!playerEl || !playerList) return;

        const isAdultConfirmed = () => localStorage.getItem('yaha_adult') === 'yes';
        const formatTime = (sec) => {
            if (isNaN(sec) || sec < 0) return '0:00';
            return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
        };

        const audioMap = new Map();
        const durationCache = new Map();
        let currentId = null;
        let savedVolume = parseFloat(localStorage.getItem('yaha_volume') || '1');
        if (isNaN(savedVolume) || savedVolume < 0 || savedVolume > 1) savedVolume = 1;
        let fadeTimer = null;
        let fadeTimeout = null;
        let currentFilter = 'all';
        let currentSearch = '';

        const playerCover = $('playerCover');
        const playerTitle = $('playerTitle');
        const playerMeta = $('playerMeta');
        const playerPlay = $('playerPlay');
        const playerFill = $('playerFill');
        const playerProgress = $('playerProgress');
        const playerTimeCur = $('playerTimeCur');
        const playerTimeDur = $('playerTimeDur');
        const playerDownload = $('playerDownload');
        const playerShare = $('playerShare');
        const playerSide = $('playerSide');
        const playerPrevEl = $('playerPrev');
        const playerNextEl = $('playerNext');
        const playerSearch = $('playerSearch');
        const playerShuffleEl = $('playerShuffle');

        const mini = $('miniPlayer');
        const miniCover = $('miniCover');
        const miniTitle = $('miniTitle');
        const miniMeta = $('miniMeta');
        const miniPlayBtn = $('miniPlay');
        const miniFill = $('miniFill');
        const miniProgress = $('miniProgress');
        const miniTimeCur = $('miniTimeCurrent');
        const miniTimeDur = $('miniTimeDuration');
        const miniPrevEl = $('miniPrev');
        const miniNextEl = $('miniNext');
        const miniCloseEl = $('miniClose');
        const miniCoverBtnEl = $('miniCoverBtn');

        const sheet = $('sheetPlayer');
        const sheetBackdrop = $('sheetBackdrop');
        const sheetCover = $('sheetCover');
        const sheetTitle = $('sheetTitle');
        const sheetMeta = $('sheetMeta');
        const sheetFill = $('sheetFill');
        const sheetCur = $('sheetCur');
        const sheetDur = $('sheetDur');
        const sheetProgress = $('sheetProgress');
        const sheetPlay = $('sheetPlay');
        const sheetDownload = $('sheetDownload');
        const sheetShare = $('sheetShare');
        const sheetCloseEl = $('sheetClose');
        const sheetPrevEl = $('sheetPrev');
        const sheetNextEl = $('sheetNext');

        const ageModal = $('ageModal');
        const ageConfirm = $('ageConfirm');
        const ageCancel = $('ageCancel');
        let pendingId = null;

        let lastCoverSrc = '';

        function getFilteredTracks() {
            let list = TRACKS;
            if (currentFilter === 'safe') list = list.filter(t => !t.explicit);
            if (currentSearch.trim()) {
                const q = currentSearch.trim().toLowerCase();
                list = list.filter(t => t.title.toLowerCase().includes(q));
            }
            return list;
        }

        function renderList() {
            playerList.innerHTML = '';
            const list = getFilteredTracks();
            if (!list.length) {
                const p = document.createElement('p');
                p.className = 'player-list-empty';
                p.textContent = 'Ничего не найдено.';
                playerList.appendChild(p);
                return;
            }
            list.forEach((t) => {
                const i = TRACKS.indexOf(t);
                const row = document.createElement('div');
                row.className = 'player-row';
                row.dataset.id = t.id;
                row.setAttribute('role', 'button');
                row.setAttribute('tabindex', '0');
                row.setAttribute('aria-label', `${t.title} — The Yaha`);
                row.innerHTML = `
                    <span class="player-row-num">${i + 1}</span>
                    <img class="player-row-cover" src="${t.cover}" alt="${t.title}" loading="lazy" width="48" height="48">
                    <div class="player-row-info">
                        <span class="player-row-title">${t.title}${t.isNew ? ' <span class="player-row-badge">Новое</span>' : ''}</span>
                        <span class="player-row-artist">The Yaha${t.explicit ? ' · <span class="player-row-explicit">18+</span>' : ''}</span>
                    </div>
                    <span class="player-row-album">${t.year}</span>
                    <span class="player-row-dur" data-dur>${durationCache.has(t.id) ? formatTime(durationCache.get(t.id)) : '—:—'}</span>
                    <button class="player-row-play" aria-label="Play">
                        <svg class="icon icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        <svg class="icon icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                    </button>
                `;
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.player-row-play')) return;
                    if (currentId === t.id) togglePlay();
                    else requestPlay(t.id);
                });
                row.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (currentId === t.id) togglePlay();
                        else requestPlay(t.id);
                    }
                });
                row.querySelector('.player-row-play').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentId === t.id) togglePlay();
                    else requestPlay(t.id);
                });
                playerList.appendChild(row);
            });
            syncListUI();
            preloadDurations();
        }

        function preloadDurations() {
            TRACKS.forEach(t => {
                if (!t.src || durationCache.has(t.id)) return;
                const a = new Audio();
                a.preload = 'metadata';
                a.src = t.src;
                const cleanup = () => { try { a.src = ''; a.load(); } catch (e) {} };
                a.addEventListener('loadedmetadata', () => {
                    durationCache.set(t.id, a.duration);
                    const row = playerList.querySelector(`.player-row[data-id="${t.id}"]`);
                    if (row) {
                        const durEl = row.querySelector('[data-dur]');
                        if (durEl) durEl.textContent = formatTime(a.duration);
                    }
                    cleanup();
                }, { once: true });
                a.addEventListener('error', cleanup, { once: true });
            });
        }

        function syncListUI() {
            if (!playerList) return;
            playerList.querySelectorAll('.player-row').forEach(row => {
                const id = row.dataset.id;
                const isCurrent = id === currentId;
                const audio = audioMap.get(id);
                const playing = isCurrent && audio && !audio.paused;
                row.classList.toggle('is-active', isCurrent);
                row.classList.toggle('is-playing', !!playing);
                if (audio && audio.duration) {
                    const durEl = row.querySelector('[data-dur]');
                    if (durEl) durEl.textContent = formatTime(audio.duration);
                }
            });
        }

        function getAudio(id) {
            if (!audioMap.has(id)) {
                const t = TRACKS.find(x => x.id === id);
                if (!t || !t.src) return null;
                const a = new Audio();
                a.preload = 'auto';
                a.volume = savedVolume;

                a.addEventListener('play', () => {
                    syncListUI(); syncSide(); syncMini(); syncSheet();
                    updateMediaSession(id); updateDocumentTitle(id, true); saveState();
                    if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
                });
                a.addEventListener('pause', () => {
                    syncListUI(); syncSide(); syncMini(); syncSheet();
                    updateDocumentTitle(id, false); saveState();
                    if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
                });
                a.addEventListener('timeupdate', () => {
                    if (id !== currentId) return;
                    syncSide(); syncMini(); syncSheet(); updatePositionState(a);
                });
                a.addEventListener('loadedmetadata', () => {
                    syncListUI();
                    if (id === currentId) { syncSide(); syncSheet(); }
                    updatePositionState(a);
                });
                a.addEventListener('ended', () => playNext());
                a.addEventListener('error', () => {
                    const err = a.error;
                    if (!err) return;
                    if (err.code === MediaError.MEDIA_ERR_ABORTED) return;
                    showToast('Не удалось загрузить трек.');
                    console.warn('audio error:', err.code, a.src);
                });

                a.src = t.src;
                audioMap.set(id, a);
            }
            return audioMap.get(id);
        }

        function requestPlay(id) {
            const t = TRACKS.find(x => x.id === id);
            if (!t) return;
            if (t.explicit && !isAdultConfirmed()) { openAgeModal(id); return; }
            startTrack(id);
        }

        function startTrack(id) {
            currentId = id;
            audioMap.forEach((a, k) => { if (k !== id && !a.paused) a.pause(); });
            const a = getAudio(id);
            if (!a) return;

            const tryPlay = () => {
                a.play().catch(err => {
                    if (err.name === 'NotAllowedError') {
                        showToast('Нажмите ещё раз — браузер заблокировал автоплей.');
                    } else if (err.name !== 'AbortError') {
                        showToast('Не удалось воспроизвести.');
                        console.warn('play error:', err);
                    }
                });
            };

            if (a.readyState >= 2) {
                tryPlay();
            } else {
                let done = false;
                const onReady = () => { if (!done) { done = true; tryPlay(); } };
                a.addEventListener('canplay', onReady, { once: true });
                a.addEventListener('loadeddata', onReady, { once: true });
                setTimeout(() => { if (!done) { done = true; tryPlay(); } }, 5000);
            }

            syncListUI(); syncSide(); syncMini(); syncSheet();
            showMiniIfMobile();
        }

        function togglePlay() {
            if (!currentId) return;
            const a = audioMap.get(currentId);
            if (!a) return;
            if (a.paused) {
                a.play().catch(err => {
                    if (err.name !== 'AbortError') {
                        showToast('Не удалось воспроизвести.');
                        console.warn(err);
                    }
                });
            } else {
                a.pause();
            }
        }

        function playNext() {
            const list = getFilteredTracks();
            if (!list.length) return;
            const idx = list.findIndex(x => x.id === currentId);
            const next = list[(idx + 1) % list.length];
            if (next) fadeTo(next.id);
        }
        function playPrev() {
            const list = getFilteredTracks();
            if (!list.length) return;
            const idx = list.findIndex(x => x.id === currentId);
            const prev = list[(idx - 1 + list.length) % list.length];
            if (prev) fadeTo(prev.id);
        }

        function fadeTo(id) {
            clearTimeout(fadeTimeout);
            clearInterval(fadeTimer);
            if (currentId) {
                const old = audioMap.get(currentId);
                if (old && !old.paused) {
                    let v = old.volume;
                    fadeTimer = setInterval(() => {
                        v = Math.max(0, v - 0.1);
                        old.volume = v;
                        if (v <= 0) { clearInterval(fadeTimer); old.pause(); old.volume = savedVolume; }
                    }, 40);
                }
            }
            fadeTimeout = setTimeout(() => startTrack(id), 200);
        }

        function syncSide() {
            if (!currentId) return;
            const t = TRACKS.find(x => x.id === currentId);
            const a = audioMap.get(currentId);
            if (!t || !a) return;
            if (lastCoverSrc !== t.cover) {
                lastCoverSrc = t.cover;
                if (playerCover) { playerCover.classList.remove('cover-fade'); void playerCover.offsetWidth; playerCover.classList.add('cover-fade'); }
            }
            if (playerCover && playerCover.getAttribute('src') !== t.cover) { playerCover.src = t.cover; playerCover.alt = t.title; }
            if (playerTitle) playerTitle.textContent = t.title;
            if (playerMeta) playerMeta.textContent = `The Yaha · ${t.year}`;
            if (playerPlay) { playerPlay.classList.toggle('is-playing', !a.paused); playerPlay.setAttribute('aria-label', a.paused ? 'Play' : 'Pause'); }
            if (playerDownload) {
                playerDownload.href = t.download || t.src;
                if (t.download) {
                    playerDownload.removeAttribute('download');
                    playerDownload.setAttribute('target', '_blank');
                    playerDownload.setAttribute('rel', 'noopener');
                } else {
                    playerDownload.setAttribute('download', `The Yaha — ${t.title}.mp3`);
                    playerDownload.removeAttribute('target');
                    playerDownload.removeAttribute('rel');
                }
            }
            if (a.duration) {
                if (playerFill) playerFill.style.width = ((a.currentTime / a.duration) * 100) + '%';
                if (playerTimeCur) playerTimeCur.textContent = formatTime(a.currentTime);
                if (playerTimeDur) playerTimeDur.textContent = formatTime(a.duration);
            }
            if (playerEl) playerEl.classList.toggle('is-playing', !a.paused);
            if (playerSide) playerSide.classList.toggle('is-playing', !a.paused);
        }

        if (playerPlay) playerPlay.addEventListener('click', togglePlay);
        if (playerPrevEl) playerPrevEl.addEventListener('click', playPrev);
        if (playerNextEl) playerNextEl.addEventListener('click', playNext);
        if (playerProgress) playerProgress.addEventListener('click', (e) => {
            if (!currentId) return;
            const a = audioMap.get(currentId);
            if (!a || !a.duration) return;
            const rect = playerProgress.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
        });
        if (playerShare) playerShare.addEventListener('click', () => { if (currentId) shareTrack(currentId); });

        async function shareTrack(id) {
            const t = TRACKS.find(x => x.id === id);
            if (!t) return;
            const url = location.origin + location.pathname + '?track=' + id;
            const data = { title: `The Yaha — ${t.title}`, text: `Слушай трек «${t.title}» от The Yaha`, url };
            try {
                if (navigator.share) await navigator.share(data);
                else { await navigator.clipboard.writeText(url); showToast('Ссылка скопирована'); }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    try { await navigator.clipboard.writeText(url); showToast('Ссылка скопирована'); } catch (e) {}
                }
            }
        }

        function syncMini() {
            if (!currentId || !mini) return;
            const t = TRACKS.find(x => x.id === currentId);
            const a = audioMap.get(currentId);
            if (!t || !a) return;
            if (miniCover && miniCover.getAttribute('src') !== t.cover) { miniCover.src = t.cover; miniCover.alt = t.title; }
            if (miniTitle) miniTitle.textContent = t.title;
            if (miniMeta) miniMeta.textContent = `The Yaha · ${t.year}`;
            mini.classList.toggle('is-playing', !a.paused);
            if (miniPlayBtn) { miniPlayBtn.classList.toggle('is-playing', !a.paused); miniPlayBtn.setAttribute('aria-label', a.paused ? 'Play' : 'Pause'); }
            if (a.duration) {
                if (miniFill) miniFill.style.width = ((a.currentTime / a.duration) * 100) + '%';
                if (miniTimeCur) miniTimeCur.textContent = formatTime(a.currentTime);
                if (miniTimeDur) miniTimeDur.textContent = formatTime(a.duration);
            }
        }

        if (miniPlayBtn) miniPlayBtn.addEventListener('click', togglePlay);
        if (miniPrevEl) miniPrevEl.addEventListener('click', playPrev);
        if (miniNextEl) miniNextEl.addEventListener('click', playNext);
        if (miniCloseEl) miniCloseEl.addEventListener('click', () => {
            if (currentId) { const a = audioMap.get(currentId); if (a) a.pause(); }
            if (mini) mini.hidden = true;
        });
        if (miniProgress) miniProgress.addEventListener('click', (e) => {
            if (!currentId) return;
            const a = audioMap.get(currentId);
            if (!a || !a.duration) return;
            const rect = miniProgress.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
        });
        if (miniCoverBtnEl) miniCoverBtnEl.addEventListener('click', openSheet);

        function showMiniIfMobile() {
            if (window.matchMedia('(max-width: 900px)').matches && mini) mini.hidden = false;
        }

        function openSheet() {
            if (!currentId || !sheet) return;
            sheet.hidden = false;
            requestAnimationFrame(() => sheet.classList.add('is-open'));
            document.body.classList.add('full-open');
            syncSheet();
        }
        function closeSheet() {
            if (!sheet) return;
            sheet.classList.remove('is-open');
            document.body.classList.remove('full-open');
            setTimeout(() => { sheet.hidden = true; }, 350);
        }
        function syncSheet() {
            if (!currentId || !sheet) return;
            const t = TRACKS.find(x => x.id === currentId);
            const a = audioMap.get(currentId);
            if (!t || !a) return;
            if (sheetCover && sheetCover.getAttribute('src') !== t.cover) { sheetCover.src = t.cover; sheetCover.alt = t.title; }
            if (sheetTitle) sheetTitle.textContent = t.title;
            if (sheetMeta) sheetMeta.textContent = `The Yaha · ${t.year}`;
            if (sheetPlay) {
                sheetPlay.classList.toggle('is-playing', !a.paused);
                sheetPlay.setAttribute('aria-label', a.paused ? 'Play' : 'Pause');
            }
            if (sheetDownload) {
                sheetDownload.href = t.download || t.src;
                if (t.download) {
                    sheetDownload.removeAttribute('download');
                    sheetDownload.setAttribute('target', '_blank');
                    sheetDownload.setAttribute('rel', 'noopener');
                } else {
                    sheetDownload.setAttribute('download', `The Yaha — ${t.title}.mp3`);
                    sheetDownload.removeAttribute('target');
                    sheetDownload.removeAttribute('rel');
                }
            }
            if (a.duration) {
                if (sheetFill) sheetFill.style.width = ((a.currentTime / a.duration) * 100) + '%';
                if (sheetCur) sheetCur.textContent = formatTime(a.currentTime);
                if (sheetDur) sheetDur.textContent = formatTime(a.duration);
            }
        }

        if (sheetBackdrop) sheetBackdrop.addEventListener('click', closeSheet);
        if (sheetCloseEl) sheetCloseEl.addEventListener('click', closeSheet);
        if (sheetPlay) sheetPlay.addEventListener('click', togglePlay);
        if (sheetPrevEl) sheetPrevEl.addEventListener('click', playPrev);
        if (sheetNextEl) sheetNextEl.addEventListener('click', playNext);
        if (sheetProgress) sheetProgress.addEventListener('click', (e) => {
            if (!currentId) return;
            const a = audioMap.get(currentId);
            if (!a || !a.duration) return;
            const r = sheetProgress.getBoundingClientRect();
            a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
        });
        if (sheetShare) sheetShare.addEventListener('click', () => { if (currentId) shareTrack(currentId); });

        function openAgeModal(id) {
            pendingId = id;
            if (ageModal) ageModal.hidden = false;
        }
        function closeAgeModal() {
            if (ageModal) ageModal.hidden = true;
            pendingId = null;
        }

        if (ageConfirm) ageConfirm.addEventListener('click', () => {
            localStorage.setItem('yaha_adult', 'yes');
            const id = pendingId;
            closeAgeModal();
            if (id) startTrack(id);
        });
        if (ageCancel) ageCancel.addEventListener('click', closeAgeModal);
        if (ageModal) ageModal.addEventListener('click', (e) => { if (e.target === ageModal) closeAgeModal(); });

        if (playerSearch) {
            let searchTimer = null;
            playerSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => { currentSearch = e.target.value; renderList(); }, 150);
            });
        }
        document.querySelectorAll('.player-chip').forEach(chip => {
            if (chip.id === 'playerShuffle') return;
            chip.addEventListener('click', () => {
                document.querySelectorAll('.player-chip').forEach(c => {
                    if (c.id === 'playerShuffle') return;
                    c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false');
                });
                chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
                currentFilter = chip.dataset.filter; renderList();
            });
        });
        if (playerShuffleEl) playerShuffleEl.addEventListener('click', () => {
            const pool = getFilteredTracks().filter(t => !t.explicit || isAdultConfirmed());
            if (!pool.length) { showToast('Нет доступных треков.'); return; }
            const pick = pool[Math.floor(Math.random() * pool.length)];
            requestPlay(pick.id);
        });

        function saveState() {
            if (!currentId) return;
            const a = audioMap.get(currentId);
            if (!a) return;
            try { localStorage.setItem('yaha_last', JSON.stringify({ id: currentId, time: a.currentTime })); } catch (e) {}
        }
        function restoreLast() {
            let last;
            try { last = JSON.parse(localStorage.getItem('yaha_last') || 'null'); } catch (e) { last = null; }
            if (!last || !last.id) return;
            const t = TRACKS.find(x => x.id === last.id);
            if (!t) return;
            currentId = last.id;
            const a = getAudio(last.id);
            if (!a) return;
            const restoreTime = () => {
                if (last.time && isFinite(last.time)) { try { a.currentTime = last.time; } catch (e) {} }
                syncSide(); syncListUI();
            };
            if (a.readyState >= 1) restoreTime();
            else a.addEventListener('loadedmetadata', restoreTime, { once: true });
            syncSide(); syncListUI();
        }
        function openFromQuery() {
            const params = new URLSearchParams(location.search);
            const id = params.get('track');
            if (!id) return false;
            const t = TRACKS.find(x => x.id === id);
            if (!t) return false;
            currentId = t.id;
            getAudio(t.id);
            syncSide(); syncListUI();
            setTimeout(() => {
                const row = playerList.querySelector(`.player-row[data-id="${t.id}"]`);
                if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 300);
            return true;
        }

        const originalTitle = document.title;
        function updateDocumentTitle(id, playing) {
            const t = TRACKS.find(x => x.id === id);
            if (!t) return;
            document.title = playing ? `▶ ${t.title} — The Yaha` : originalTitle;
        }

        function updateMediaSession(id) {
            if (!('mediaSession' in navigator)) return;
            const t = TRACKS.find(x => x.id === id);
            if (!t) return;
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: t.title, artist: 'The Yaha', album: `The Yaha · ${t.year}`,
                    artwork: [
                        { src: t.cover, sizes: '512x512', type: 'image/jpeg' },
                        { src: t.cover, sizes: '256x256', type: 'image/jpeg' }
                    ]
                });
            } catch (e) {}
        }
        function updatePositionState(a) {
            if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
            if (!a.duration || a.duration === Infinity) return;
            try {
                navigator.mediaSession.setPositionState({
                    duration: a.duration, playbackRate: a.playbackRate,
                    position: Math.min(a.currentTime, a.duration)
                });
            } catch (e) {}
        }
        if ('mediaSession' in navigator) {
            try { navigator.mediaSession.setActionHandler('play', () => { if (currentId) togglePlay(); }); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('pause', () => { if (currentId) { const a = audioMap.get(currentId); if (a) a.pause(); } }); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('previoustrack', playPrev); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('nexttrack', playNext); } catch (e) {}
        }

        renderList();
        const fromQuery = openFromQuery();
        if (!fromQuery) restoreLast();
    })();
})();
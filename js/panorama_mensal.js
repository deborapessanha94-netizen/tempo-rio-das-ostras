/**
 * Retrospectiva / Panorama Mensal do Clima - Rio das Ostras, RJ
 * Módulo interativo para exibição de Vídeo Reels, Carrossel Feed 4:5, Stories 9:16 e Legendas.
 * Versão 211
 */

(function() {
  'use strict';

  const PANORAMA_STATE = {
    activeTab: 'video', // 'video' | 'feed' | 'stories' | 'legenda'
    feedSlide: 1,
    storySlide: 1,
    totalSlides: 6,
    slideTitles: [
      'Abertura Oficial • Os 3 Grandes Números',
      'Volume Total de Chuva e Pico do Mês',
      'Ranking de Chuva por Bairro / Estação',
      'Ventos e Extremos Térmicos',
      'O Que Comandou o Tempo (Sistemas)',
      'Encerramento Oficial e Chamada de Ação'
    ],
    slideFiles: [
      'lamina_01_abertura_outubro_2026.png',
      'lamina_02_volume_chuva_outubro_2026.png',
      'lamina_03_ranking_estacoes_outubro_2026.png',
      'lamina_04_ventos_extremos_termicos_outubro_2026.png',
      'lamina_05_sistemas_meteorologicos_outubro_2026.png',
      'lamina_06_encerramento_oficial_outubro_2026.png'
    ]
  };

  /**
   * Altera a aba de visualização (Vídeo, Feed, Stories, Legenda)
   */
  window.switchPanoramaMode = function(mode) {
    PANORAMA_STATE.activeTab = mode;
    
    // Atualiza botões seletores
    document.querySelectorAll('.panorama-mode-btn').forEach(btn => {
      const bMode = btn.getAttribute('data-mode');
      if (bMode === mode) {
        btn.className = 'panorama-mode-btn px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-all bg-[#FF8244] text-black border-[#FF8244] shadow-md cursor-pointer flex items-center gap-1.5';
      } else {
        btn.className = 'panorama-mode-btn px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all bg-[#1D1F26] text-[#CDDAEE] border-[#3C7BC4]/40 hover:bg-[#283964] shadow-xs cursor-pointer flex items-center gap-1.5';
      }
    });

    // Exibe/oculta painéis
    const panels = ['video', 'feed', 'stories', 'legenda'];
    panels.forEach(p => {
      const panelEl = document.getElementById(`panorama-panel-${p}`);
      if (panelEl) {
        if (p === mode) {
          panelEl.classList.remove('hidden');
        } else {
          panelEl.classList.add('hidden');
        }
      }
    });

    // Pausa vídeo se trocar de aba
    const vid = document.getElementById('panorama-reels-video');
    if (vid && mode !== 'video') {
      vid.pause();
    }
  };

  /**
   * Navega no Carrossel Feed (4:5)
   */
  window.navigatePanoramaFeed = function(delta) {
    let next = PANORAMA_STATE.feedSlide + delta;
    if (next < 1) next = PANORAMA_STATE.totalSlides;
    if (next > PANORAMA_STATE.totalSlides) next = 1;
    window.setPanoramaFeedSlide(next);
  };

  window.setPanoramaFeedSlide = function(idx) {
    PANORAMA_STATE.feedSlide = idx;
    const imgEl = document.getElementById('panorama-feed-image');
    const titleEl = document.getElementById('panorama-feed-title');
    const counterEl = document.getElementById('panorama-feed-counter');
    const downloadBtn = document.getElementById('panorama-feed-download-btn');

    const fileName = PANORAMA_STATE.slideFiles[idx - 1];
    const title = PANORAMA_STATE.slideTitles[idx - 1];
    const path = `img/panorama/feed/${fileName}?v=211`;

    if (imgEl) {
      imgEl.src = path;
      imgEl.alt = title;
    }
    if (titleEl) titleEl.textContent = title;
    if (counterEl) counterEl.textContent = `Lâmina ${idx} de ${PANORAMA_STATE.totalSlides}`;
    if (downloadBtn) {
      downloadBtn.href = `img/panorama/feed/${fileName}`;
      downloadBtn.download = fileName;
    }

    // Atualiza bolinhas indicadoras
    document.querySelectorAll('.panorama-feed-dot').forEach((dot, dIdx) => {
      if (dIdx + 1 === idx) {
        dot.className = 'panorama-feed-dot w-6 h-2.5 rounded-full bg-[#FF8244] transition-all cursor-pointer';
      } else {
        dot.className = 'panorama-feed-dot w-2.5 h-2.5 rounded-full bg-[#3C7BC4]/40 hover:bg-[#3C7BC4] transition-all cursor-pointer';
      }
    });
  };

  /**
   * Navega nos Stories (9:16)
   */
  window.navigatePanoramaStory = function(delta) {
    let next = PANORAMA_STATE.storySlide + delta;
    if (next < 1) next = PANORAMA_STATE.totalSlides;
    if (next > PANORAMA_STATE.totalSlides) next = 1;
    window.setPanoramaStorySlide(next);
  };

  window.setPanoramaStorySlide = function(idx) {
    PANORAMA_STATE.storySlide = idx;
    const imgEl = document.getElementById('panorama-story-image');
    const titleEl = document.getElementById('panorama-story-title');
    const counterEl = document.getElementById('panorama-story-counter');
    const downloadBtn = document.getElementById('panorama-story-download-btn');

    const fileName = PANORAMA_STATE.slideFiles[idx - 1];
    const title = PANORAMA_STATE.slideTitles[idx - 1];
    const path = `img/panorama/stories/${fileName}?v=211`;

    if (imgEl) {
      imgEl.src = path;
      imgEl.alt = title;
    }
    if (titleEl) titleEl.textContent = title;
    if (counterEl) counterEl.textContent = `Story ${idx} de ${PANORAMA_STATE.totalSlides}`;
    if (downloadBtn) {
      downloadBtn.href = `img/panorama/stories/${fileName}`;
      downloadBtn.download = fileName;
    }

    // Atualiza bolinhas indicadoras
    document.querySelectorAll('.panorama-story-dot').forEach((dot, dIdx) => {
      if (dIdx + 1 === idx) {
        dot.className = 'panorama-story-dot w-6 h-2.5 rounded-full bg-[#FF8244] transition-all cursor-pointer';
      } else {
        dot.className = 'panorama-story-dot w-2.5 h-2.5 rounded-full bg-[#3C7BC4]/40 hover:bg-[#3C7BC4] transition-all cursor-pointer';
      }
    });
  };

  /**
   * Copia a legenda oficial do Instagram para a Área de Transferência
   */
  window.copyPanoramaCaption = function() {
    const textEl = document.getElementById('panorama-caption-content');
    const btn = document.getElementById('panorama-copy-caption-btn');
    if (!textEl) return;

    const textToCopy = textEl.innerText || textEl.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (btn) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = `
          <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          <span class="text-emerald-300 font-black">Legenda Copiada com Sucesso!</span>
        `;
        btn.classList.add('bg-emerald-800', 'border-emerald-500');
        setTimeout(() => {
          btn.innerHTML = origHTML;
          btn.classList.remove('bg-emerald-800', 'border-emerald-500');
        }, 3000);
      }
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
  };

  /**
   * Controle do Modal Global do Panorama
   */
  window.openPanoramaModal = function(initialMode) {
    const modal = document.getElementById('modal-panorama-mensal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (initialMode) {
      window.switchPanoramaMode(initialMode);
    }
    if (window.lucide) window.lucide.createIcons();
  };

  window.closePanoramaModal = function() {
    const modal = document.getElementById('modal-panorama-mensal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    const vid = document.getElementById('panorama-reels-video');
    if (vid) vid.pause();
  };

  // Suporte a teclado no carrossel (setas esquerda e direita)
  document.addEventListener('keydown', (e) => {
    const viewTab = document.getElementById('view-tab-panorama');
    const isVisible = viewTab && !viewTab.classList.contains('hidden');
    if (!isVisible) return;

    if (PANORAMA_STATE.activeTab === 'feed') {
      if (e.key === 'ArrowLeft') window.navigatePanoramaFeed(-1);
      if (e.key === 'ArrowRight') window.navigatePanoramaFeed(1);
    } else if (PANORAMA_STATE.activeTab === 'stories') {
      if (e.key === 'ArrowLeft') window.navigatePanoramaStory(-1);
      if (e.key === 'ArrowRight') window.navigatePanoramaStory(1);
    }
  });

})();

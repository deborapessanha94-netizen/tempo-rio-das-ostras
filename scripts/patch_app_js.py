with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace switchAppTab
old_switch = '''window.switchAppTab = function(tabName) {
  const viewPrevisao = document.getElementById('view-tab-previsao');
  const viewChuva = document.getElementById('view-tab-chuva');
  const btnPrevisao = document.getElementById('nav-tab-previsao');
  const btnChuva = document.getElementById('nav-tab-chuva');
  const btnOrla = document.getElementById('nav-tab-orla');

  if (tabName === 'orla') {
    if (viewPrevisao) viewPrevisao.classList.remove('hidden');
    if (viewChuva) viewChuva.classList.add('hidden');

    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'true');
    }
    if (btnChuva) {
      btnChuva.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'false');
    }

    const orlaEl = document.getElementById('card-condicoes-orla');
    if (orlaEl) {
      orlaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#orla');
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (tabName === 'chuva') {
    if (viewPrevisao) viewPrevisao.classList.add('hidden');
    if (viewChuva) viewChuva.classList.remove('hidden');

    if (btnChuva) {
      btnChuva.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'true');
    }
    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'false');
    }

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#chuva');
    }

    if (state.acumuladosDataset || state.acumuladosEstacoes) {
      renderAcumuladosChuva(state.acumuladosDataset || state.acumuladosEstacoes);
    }
  } else {
    // Default: 'previsao'
    if (viewPrevisao) viewPrevisao.classList.remove('hidden');
    if (viewChuva) viewChuva.classList.add('hidden');

    if (btnPrevisao) {
      btnPrevisao.className = 'app-nav-tab active flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs flex-1 sm:flex-none';
      btnPrevisao.setAttribute('aria-selected', 'true');
    }
    if (btnChuva) {
      btnChuva.className = 'app-nav-tab flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer flex-1 sm:flex-none';
      btnChuva.setAttribute('aria-selected', 'false');
    }

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, '#previsao');
    }
  }

  if (window.lucide) window.lucide.createIcons();
};'''

new_switch = '''window.switchAppTab = function(tabName) {
  const ALL_TABS = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'];
  const target = ALL_TABS.includes(tabName) ? tabName : 'previsao';

  ALL_TABS.forEach(t => {
    const view = document.getElementById('view-tab-' + t);
    const btn = document.getElementById('nav-tab-' + t);

    if (t === target) {
      if (view) view.classList.remove('hidden');
      if (btn) {
        btn.className = 'app-nav-tab active flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center';
        btn.setAttribute('aria-selected', 'true');
      }
    } else {
      if (view) view.classList.add('hidden');
      if (btn) {
        btn.className = 'app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center';
        btn.setAttribute('aria-selected', 'false');
      }
    }
  });

  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, null, '#' + target);
  }

  if (target === 'chuva') {
    if (state.acumuladosDataset || state.acumuladosEstacoes) {
      renderAcumuladosChuva(state.acumuladosDataset || state.acumuladosEstacoes);
    }
  } else if (target === 'previsao') {
    if (state.boletimData) {
      updateBulletinChart();
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
};'''

old_hash = '''window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#chuva') {
    window.switchAppTab('chuva');
  } else if (window.location.hash === '#orla') {
    window.switchAppTab('orla');
  }
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#chuva') {
    window.switchAppTab('chuva');
  } else if (window.location.hash === '#orla') {
    window.switchAppTab('orla');
  } else if (window.location.hash === '#previsao') {
    window.switchAppTab('previsao');
  }
});'''

new_hash = '''const handleUrlHash = () => {
  const rawHash = (window.location.hash || '').replace('#', '').trim();
  const ALL_TABS = ['previsao', 'chuva', 'rio', 'orla', 'alertas', 'boletim'];
  if (ALL_TABS.includes(rawHash)) {
    window.switchAppTab(rawHash);
  }
};

window.addEventListener('DOMContentLoaded', handleUrlHash);
window.addEventListener('hashchange', handleUrlHash);'''

# Normalize newlines
code_norm = code.replace('\r\n', '\n')
old_switch_norm = old_switch.replace('\r\n', '\n')
new_switch_norm = new_switch.replace('\r\n', '\n')
old_hash_norm = old_hash.replace('\r\n', '\n')
new_hash_norm = new_hash.replace('\r\n', '\n')

if old_switch_norm in code_norm:
    code_norm = code_norm.replace(old_switch_norm, new_switch_norm)
    print("Replaced old_switch successfully!")
else:
    print("ERROR: old_switch not found in js/app.js!")

if old_hash_norm in code_norm:
    code_norm = code_norm.replace(old_hash_norm, new_hash_norm)
    print("Replaced old_hash successfully!")
else:
    print("ERROR: old_hash not found in js/app.js!")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code_norm)

print("Updated js/app.js successfully!")

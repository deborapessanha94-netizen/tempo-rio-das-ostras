import sys, re, os, shutil
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Backups
backup_dir = os.path.join(BASE_DIR, "backups_v218")
os.makedirs(backup_dir, exist_ok=True)
for f in ["index.html", "css/styles.css", "js/app.js", "sw.js"]:
    src = os.path.join(BASE_DIR, f)
    dst = os.path.join(backup_dir, os.path.basename(f))
    shutil.copy2(src, dst)
print("Backups saved to backups_v218")

# 2. Update css/styles.css
css_path = os.path.join(BASE_DIR, "css", "styles.css")
with open(css_path, "r", encoding="utf-8") as fp:
    css_content = fp.read()

sidebar_css = """
/* ========================================================================= */
/* GOOGLE AI STUDIO INTERFACE THEME & SIDEBAR RAIL (v219)                    */
/* ========================================================================= */

#app-workspace-shell {
  min-height: calc(100vh - 4.5rem);
}

#app-sidebar-nav {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-tab-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.85rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border: 1px solid transparent;
  text-align: left;
}

/* Light Mode: Inactive tab */
html:not(.dark) .sidebar-tab-btn {
  color: #334155 !important;
  background-color: transparent !important;
}
html:not(.dark) .sidebar-tab-btn:hover {
  background-color: #F1F5F9 !important;
  color: #0F172A !important;
}
html:not(.dark) .sidebar-tab-btn .sidebar-icon,
html:not(.dark) .sidebar-tab-btn .sidebar-chevron {
  color: #64748B !important;
  stroke: #64748B !important;
}

/* Light Mode: Active tab */
html:not(.dark) .sidebar-tab-btn.active,
html:not(.dark) .sidebar-tab-btn.active span {
  background-color: #14213D !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px rgba(20, 33, 61, 0.18);
}
html:not(.dark) .sidebar-tab-btn.active .sidebar-icon,
html:not(.dark) .sidebar-tab-btn.active .sidebar-chevron {
  color: #FCA311 !important;
  stroke: #FCA311 !important;
}

/* Dark Mode: Inactive tab */
html.dark .sidebar-tab-btn {
  color: #E2E8F0 !important;
  background-color: transparent !important;
}
html.dark .sidebar-tab-btn:hover {
  background-color: #0B1324 !important;
  color: #FFFFFF !important;
}
html.dark .sidebar-tab-btn .sidebar-icon,
html.dark .sidebar-tab-btn .sidebar-chevron {
  color: rgba(229, 229, 229, 0.6) !important;
  stroke: rgba(229, 229, 229, 0.6) !important;
}

/* Dark Mode: Active tab */
html.dark .sidebar-tab-btn.active,
html.dark .sidebar-tab-btn.active span {
  background-color: #FCA311 !important;
  color: #000000 !important;
  font-weight: 800 !important;
  box-shadow: 0 1px 3px rgba(252, 163, 17, 0.3);
}
html.dark .sidebar-tab-btn.active .sidebar-icon,
html.dark .sidebar-tab-btn.active .sidebar-chevron {
  color: #000000 !important;
  stroke: #000000 !important;
}

/* Sub-sections tree */
.sidebar-sub-btn {
  display: block;
  width: 100%;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.15rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border-left: 2px solid transparent;
}

/* Light mode sub-btn */
html:not(.dark) .sidebar-sub-btn {
  color: #475569 !important;
  background-color: transparent !important;
}
html:not(.dark) .sidebar-sub-btn:hover {
  color: #0F172A !important;
  background-color: rgba(241, 245, 249, 0.8) !important;
}
html:not(.dark) .sidebar-sub-btn.active {
  background-color: #F1F5F9 !important;
  color: #14213D !important;
  font-weight: 700 !important;
  border-left-color: #FCA311 !important;
}

/* Dark mode sub-btn */
html.dark .sidebar-sub-btn {
  color: rgba(229, 229, 229, 0.75) !important;
  background-color: transparent !important;
}
html.dark .sidebar-sub-btn:hover {
  color: #FFFFFF !important;
  background-color: rgba(11, 19, 36, 0.8) !important;
}
html.dark .sidebar-sub-btn.active {
  background-color: #0B1324 !important;
  color: #FCA311 !important;
  font-weight: 700 !important;
  border-left-color: #FCA311 !important;
}

/* Mobile active tab bar */
#mobile-tab-bar {
  transition: all 0.2s ease-in-out;
}

/* Sticky Rail behavior on Desktop */
@media (min-width: 1024px) {
  #app-sidebar-nav {
    position: -webkit-sticky;
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
  }
}
"""

if "GOOGLE AI STUDIO INTERFACE THEME & SIDEBAR RAIL" not in css_content:
    with open(css_path, "a", encoding="utf-8") as fp:
        fp.write("\n" + sidebar_css)
    print("Updated css/styles.css with sidebar & AI Studio styling")
else:
    print("css/styles.css already had sidebar styles")

# 3. Update sw.js
sw_path = os.path.join(BASE_DIR, "sw.js")
with open(sw_path, "r", encoding="utf-8") as fp:
    sw_code = fp.read()
sw_code = re.sub(r"const CACHE_NAME = 'meteo-ostras-v\d+';", "const CACHE_NAME = 'meteo-ostras-v219';", sw_code)
with open(sw_path, "w", encoding="utf-8") as fp:
    fp.write(sw_code)
print("Updated sw.js to v219")

print("Stage 1 complete.")

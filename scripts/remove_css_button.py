import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Remove import
target_import = "import { CssExportModal } from './components/CssExportModal';\n"
if target_import in text:
    text = text.replace(target_import, "")
    print("Removed CssExportModal import")

# 2. Remove state
target_state = "  const [isCssModalOpen, setIsCssModalOpen] = useState(false);\n"
if target_state in text:
    text = text.replace(target_state, "")
    print("Removed isCssModalOpen state")

# 3. Remove button
target_button = """            <button
              onClick={() => setIsCssModalOpen(true)}
              className="font-medium text-[#14213D] dark:text-[#FCA311] hover:underline cursor-pointer"
            >
              Copiar CSS do Tema
            </button>"""
if target_button in text:
    text = text.replace(target_button, "")
    print("Removed Copiar CSS do Tema button")

# 4. Remove component render
target_modal = "      <CssExportModal isOpen={isCssModalOpen} onClose={() => setIsCssModalOpen(false)} />\n"
if target_modal in text:
    text = text.replace(target_modal, "")
    print("Removed CssExportModal render")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated App.tsx successfully!")

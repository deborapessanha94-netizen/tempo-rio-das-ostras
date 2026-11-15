with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """                    <span className="font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                      Período ativo: {panoramaStart.slice(8, 10)}/{panoramaStart.slice(5, 7)} a {panoramaEnd.slice(8, 10)}/{panoramaEnd.slice(5, 7)} ({panoramaData?.totalDias || 1} {panoramaData?.totalDias === 1 ? 'dia' : 'dias'})
                    </span>"""

replacement = """                    <span className="font-mono text-slate-600 dark:text-[#E5E5E5]/80">
                      Período ativo: {panoramaStart.slice(8, 10)}/{panoramaStart.slice(5, 7)} a {panoramaEnd.slice(8, 10)}/{panoramaEnd.slice(5, 7)} ({(() => {
                        const count = panoramaData?.totalDias ?? Math.max(1, Math.round((new Date(panoramaEnd).getTime() - new Date(panoramaStart).getTime()) / 86400000) + 1);
                        return `${count} ${count === 1 ? 'dia' : 'dias'}`;
                      })()})
                    </span>"""

if target in text:
    new_text = text.replace(target, replacement, 1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS: Fixed period count label!")
else:
    print("ERROR: Target not found!")

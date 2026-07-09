const fs = require('fs')
const path = require('path')

// ponytail: node-pty 1.1.0 hardcodes SpectreMitigation:'Spectre' in binding.gyp + deps/winpty/src/winpty.gyp.
// MSB8040: requires Spectre-mitigated VS libs (not installed). Scaffold não precisa de Spectre hardening.
// Patch ambos os arquivos antes do electron-rebuild.
// Ceiling: sem Spectre mitigation no node-pty nativo; upgrade: instalar VS Spectre libs + remover este patch.
const files = [
  path.join('node_modules', 'node-pty', 'binding.gyp'),
  path.join('node_modules', 'node-pty', 'deps', 'winpty', 'src', 'winpty.gyp')
]

for (const f of files) {
  if (!fs.existsSync(f)) continue
  const src = fs.readFileSync(f, 'utf8')
  const patched = src.replace(/'SpectreMitigation'\s*:\s*'Spectre'/g, "'SpectreMitigation': 'false'")
  if (patched !== src) {
    fs.writeFileSync(f, patched)
    console.log(`postinstall: patched ${f} (SpectreMitigation disabled)`)
  }
}
async function load() {
  const res = await fetch('presentation.html')
  const tpl = document.createElement('template')
  tpl.innerHTML = await res.text()
  slides = [...tpl.content.children]
  show(Number(location.hash.slice(1)) || 0)
}

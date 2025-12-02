// script.js - generative, full-width, per-word elements (no rotation)
(function(){
  // Config
  const fonts = ['Helvetica, Arial, sans-serif','"Times New Roman", Times, serif','Courier, monospace'];
  const weights = [300,400,500,600,700,800];

  const canvas = document.getElementById('canvas');
  const input = document.getElementById('answerInput');
  const printBtn = document.getElementById('printBtn');

  // Load shapes (assumes Shapes01.svg available in same folder)
  let shapeTemplates = [];
  fetch('Shapes01.svg').then(r=>r.text()).then(text=>{
    const doc = new DOMParser().parseFromString(text,'image/svg+xml');
    const svgRoot = doc.querySelector('svg');
    if(svgRoot){
      svgRoot.querySelectorAll(':scope > *').forEach(n=>{
        shapeTemplates.push(n.cloneNode(true));
      });
    }
  }).catch(()=>{ /* ignore if not present */ });

  // helpers
  function rand(min,max){return Math.random()*(max-min)+min}
  function rInt(min,max){return Math.floor(rand(min,max+1))}
  function choose(arr){return arr[Math.floor(Math.random()*arr.length)]}

  // Main render: create a single full-width block, inside place each word as absolute element
  function renderAnswer(text){
    canvas.innerHTML = '';
    const trimmed = (text || '').trim();
    if(!trimmed) return;

    const block = document.createElement('div');
    block.className = 'answer-block';
    canvas.appendChild(block);

    // optionally a subtle background shape (behind text)
    if(shapeTemplates.length && Math.random() < 0.6){
      const s = shapeTemplates[rInt(0, shapeTemplates.length-1)].cloneNode(true);
      const wrapper = document.createElement('div');
      wrapper.className = 'shape';
      wrapper.innerHTML = s.outerHTML;
      wrapper.style.top = (-12 + rInt(0,36)) + 'px';
      const scalePct = rand(0.18,0.82);
      wrapper.style.width = Math.round(scalePct * 100) + '%';
      wrapper.style.left = Math.round(rand(0, (100 - scalePct*100))) + '%';
      wrapper.style.opacity = (0.03 + Math.random()*0.12).toFixed(3);
      wrapper.style.zIndex = 1;
      block.appendChild(wrapper);
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    if(words.length === 0) return;

    // invisible measurer
    const meas = document.createElement('div');
    meas.style.position = 'absolute';
    meas.style.left = '-9999px';
    meas.style.top = '-9999px';
    meas.style.visibility = 'hidden';
    document.body.appendChild(meas);

    let baselineY = 6;

    words.forEach((w)=>{
      const el = document.createElement('div');
      el.className = 'word';

      // random font/weight/size
      const font = choose(fonts);
      const weight = choose(weights);
      const fontPx = Math.round(rand(14,44));
      el.style.fontFamily = font;
      el.style.fontWeight = weight;
      el.style.fontSize = fontPx + 'px';
      el.textContent = w;

      // measure natural width (unplaced)
      meas.appendChild(el);
      const measuredW = Math.min(el.getBoundingClientRect().width, canvas.clientWidth - 12);
      meas.removeChild(el);

      // append to block and compute left/top clamped
      block.appendChild(el);
      const blockWidth = block.clientWidth || canvas.clientWidth;
      const maxLeft = Math.max(0, blockWidth - measuredW - 8);
      let left = Math.round(rand(0, maxLeft));
      const jitterX = rInt(-10,10);
      left = Math.min(Math.max(0, left + jitterX), maxLeft);

      el.style.left = left + 'px';
      el.style.top = baselineY + 'px';

      // measure height
      const h = el.getBoundingClientRect().height || (fontPx * 1.1);
      const overlap = Math.round(rand(-Math.min(Math.floor(h*0.6), 18), Math.floor(h*0.6)));
      const top = baselineY + overlap;
      el.style.top = top + 'px';

      // scale (no rotation) and combine small translate for visual noise
      const scale = +(rand(0.86, 1.6)).toFixed(2);
      const tX = rInt(-6,6);
      const tY = rInt(-8,10);
      el.style.transform = `translate(${tX}px, ${tY}px) scale(${scale})`;

      // clamp again based on estimated visual width after scale
      const visualW = Math.min(measuredW * scale, blockWidth - 8);
      if(left + visualW > blockWidth - 6){
        left = Math.max(0, Math.round(blockWidth - visualW - 6));
        el.style.left = left + 'px';
      }

      el.style.zIndex = rInt(2,30);
      el.style.opacity = (0.8 + Math.random()*0.18).toFixed(2);

      // advance baselineY with some variance to allow overlapping
      baselineY = Math.max(baselineY + Math.round(h * rand(0.3, 1.0)) + 6, top + h + 6);
    });

    document.body.removeChild(meas);

    // foreground shape sometimes
    if(shapeTemplates.length && Math.random() < 0.45){
      const s = shapeTemplates[rInt(0, shapeTemplates.length-1)].cloneNode(true);
      const wrapper = document.createElement('div');
      wrapper.className = 'shape';
      wrapper.innerHTML = s.outerHTML;
      const pctW = rand(0.28,0.78);
      wrapper.style.width = Math.round(pctW*100) + '%';
      wrapper.style.left = Math.round(rand(0, 100 - pctW*100)) + '%';
      wrapper.style.top = Math.round(rand(-28, Math.min(60, baselineY - 20))) + 'px';
      wrapper.style.zIndex = 50;
      wrapper.style.opacity = (0.02 + Math.random()*0.12).toFixed(3);
      block.appendChild(wrapper);
    }

    block.style.minHeight = Math.max(Math.round(baselineY + 8), 48) + 'px';
    block.style.marginTop = '-8px';
  }

  // live input
  input.addEventListener('input', (e)=> renderAnswer(e.target.value));

  // print -> open new window with canvas HTML
  printBtn.addEventListener('click', ()=>{
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Print</title><style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#000} .print-canvas{padding:8mm}</style></head><body><div class="print-canvas">${canvas.innerHTML}</div></body></html>`;
    const w = window.open('','_blank');
    if(!w) return alert('Popup blockiert — bitte Popups erlauben oder Seite manuell drucken.');
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); }, 350);
  });

  // initial if prefilled
  document.addEventListener('DOMContentLoaded', ()=> { if(input.value && input.value.trim()) renderAnswer(input.value); });

  // re-render on resize to clamp widths
  let resizeTimeout;
  window.addEventListener('resize', ()=>{ clearTimeout(resizeTimeout); resizeTimeout = setTimeout(()=> renderAnswer(input.value), 180); });

})();

(function () {
  var D = window.SJ;
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- Separadores ---------- */
  var paginas = Array.prototype.slice.call(document.querySelectorAll(".pagina"));
  var links = Array.prototype.slice.call(document.querySelectorAll("nav.abas a"));
  var nav = $("abas"), menu = document.querySelector(".menu-btn");
  function mostrar() {
    var id = (location.hash || "#inicio").slice(1);
    if (!$(id) || !$(id).classList.contains("pagina")) id = "inicio";
    paginas.forEach(function (p) { p.classList.toggle("activa", p.id === id); });
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    nav.classList.remove("aberto"); menu.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    document.title = (id === "inicio" ? "" : ($(id).getAttribute("aria-label") + " · ")) + "Sociedade de Jovens · IECA Zona Verde";
  }
  window.addEventListener("hashchange", mostrar);
  menu.addEventListener("click", function () {
    var aberto = nav.classList.toggle("aberto");
    menu.setAttribute("aria-expanded", aberto ? "true" : "false");
  });

  /* ---------- Galeria (um álbum por actividade, em slide) ---------- */
  var sel = $("g-actividade"), procura = $("g-procura"), caixa = $("g-fotos");
  var albuns = [];
  (D.albuns || []).forEach(function (a) { albuns.push({ actividade: a.actividade, descricao: a.descricao || "", fotos: [] }); });
  D.galeria.forEach(function (f) {
    var al = albuns.filter(function (a) { return a.actividade === f.actividade; })[0];
    if (!al) { al = { actividade: f.actividade, descricao: "", fotos: [] }; albuns.push(al); }
    al.fotos.push(f);
  });
  albuns = albuns.filter(function (a) { return a.fotos.length; });
  albuns.forEach(function (a) { sel.appendChild(el("option", { value: a.actividade }, esc(a.actividade))); });

  var zoom = $("g-zoom"), zAlbum = null, zIdx = 0;
  function zMostrar() {
    var f = zAlbum.fotos[zIdx];
    $("g-zoom-img").src = "fotos/" + f.ficheiro;
    $("g-zoom-img").alt = f.resumo;
    $("g-zoom-leg").textContent = f.actividade + " · " + f.data + " · " + (zIdx + 1) + " de " + zAlbum.fotos.length;
    $("g-zoom-down").href = "fotos/" + f.ficheiro;
    $("g-zoom-down").setAttribute("download", f.ficheiro);
  }
  function abrir(al, i) { zAlbum = al; zIdx = i; zMostrar(); if (zoom.showModal) zoom.showModal(); }
  $("g-zoom-fechar").addEventListener("click", function () { zoom.close(); });
  $("g-zoom-ant").addEventListener("click", function () { zIdx = (zIdx - 1 + zAlbum.fotos.length) % zAlbum.fotos.length; zMostrar(); });
  $("g-zoom-seg").addEventListener("click", function () { zIdx = (zIdx + 1) % zAlbum.fotos.length; zMostrar(); });
  zoom.addEventListener("click", function (e) { if (e.target === zoom) zoom.close(); });

  function criarAlbum(al) {
    var card = el("article", { "class": "album" });
    var n = al.fotos.length;
    card.innerHTML = '<header class="album-topo"><div><h3>' + esc(al.actividade) + '</h3><span class="data">' + esc(al.fotos[0].data) +
      ' · ' + (n === 1 ? "1 foto" : n + " fotos") + '</span></div></header>' +
      (al.descricao ? '<p class="album-desc">' + esc(al.descricao) + '</p>' : '');
    var palco = el("div", { "class": "palco" });
    var pista = el("div", { "class": "pista", tabindex: "0", "aria-label": "Fotos de " + al.actividade + ". Desliza para ver mais." });
    al.fotos.forEach(function (f, i) {
      var b = el("button", { "class": "slide", type: "button", "aria-label": "Ver maior: " + f.resumo });
      b.appendChild(el("img", { src: "fotos/" + f.ficheiro, alt: f.resumo, loading: i < 2 ? "eager" : "lazy" }));
      b.addEventListener("click", function () { abrir(al, i); });
      pista.appendChild(b);
    });
    palco.appendChild(pista);
    var ant = el("button", { "class": "seta ant", type: "button", "aria-label": "Foto anterior" }, '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>');
    var seg = el("button", { "class": "seta seg", type: "button", "aria-label": "Foto seguinte" }, '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>');
    palco.appendChild(ant); palco.appendChild(seg);
    card.appendChild(palco);
    var rodape = el("div", { "class": "album-rodape" });
    var leg = el("p", { "class": "res" }), cont = el("span", { "class": "contador" });
    var down = el("a", { "class": "btn sec peq", href: "#", download: "" }, "Descarregar esta foto");
    rodape.appendChild(el("div", { "class": "leg" })); rodape.firstChild.appendChild(cont); rodape.firstChild.appendChild(leg);
    rodape.appendChild(down);
    card.appendChild(rodape);
    var atual = 0;
    function marcar(i) {
      atual = Math.max(0, Math.min(n - 1, i));
      var f = al.fotos[atual];
      cont.textContent = (atual + 1) + " / " + n;
      leg.textContent = f.resumo;
      down.href = "fotos/" + f.ficheiro; down.setAttribute("download", f.ficheiro);
      ant.disabled = atual === 0; seg.disabled = atual === n - 1;
    }
    function ir(i) { pista.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * pista.clientWidth, behavior: "smooth" }); }
    ant.addEventListener("click", function () { ir(atual - 1); });
    seg.addEventListener("click", function () { ir(atual + 1); });
    var t = null;
    pista.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(function () { marcar(Math.round(pista.scrollLeft / pista.clientWidth)); }, 60); });
    pista.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); ir(atual + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); ir(atual - 1); } });
    if (n < 2) { ant.hidden = true; seg.hidden = true; }
    marcar(0);
    return card;
  }
  function desenharGaleria() {
    var a = sel.value, q = procura.value.trim().toLowerCase();
    caixa.innerHTML = "";
    var vis = albuns.filter(function (al) {
      if (a && al.actividade !== a) return false;
      if (q && (al.actividade + " " + al.descricao + " " + al.fotos.map(function (f) { return f.data + " " + f.resumo; }).join(" ")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    vis.forEach(function (al) { caixa.appendChild(criarAlbum(al)); });
    var nf = vis.reduce(function (s, al) { return s + al.fotos.length; }, 0);
    $("g-contagem").textContent = (vis.length === 1 ? "1 actividade" : vis.length + " actividades") + " · " + nf + " fotos";
  }
  sel.addEventListener("change", desenharGaleria);
  procura.addEventListener("input", desenharGaleria);
  desenharGaleria();

  /* ---------- Direcção ---------- */
  var dp = $("d-pessoas");
  D.direccao.forEach(function (p) {
    var iniciais = p.nome.split(" ").filter(Boolean);
    iniciais = (iniciais[0][0] + (iniciais.length > 1 ? iniciais[iniciais.length - 1][0] : "")).toUpperCase();
    var rosto = p.foto ? '<img src="direccao/' + esc(p.foto) + '" alt="' + esc(p.nome) + '">' : '<span aria-hidden="true">' + iniciais + '</span>';
    dp.appendChild(el("div", { "class": "cartao pessoa" },
      '<div class="rosto">' + rosto + '</div><span class="cargo">' + esc(p.cargo) + '</span><h3>' + esc(p.nome) + '</h3>'));
  });
  D.conselheiros.forEach(function (c) { $("d-conselheiros").appendChild(el("li", null, esc(c))); });

  /* ---------- Comissões ---------- */
  D.comissoes.forEach(function (c) {
    $("c-lista").appendChild(el("div", { "class": "cartao comissao" },
      '<h3>' + esc(c.nome) + '</h3><p>' + esc(c.funcao) + '</p><ul>' +
      c.membros.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join("") + '</ul>'));
  });

  /* ---------- Estudo bíblico ---------- */
  var meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  function dia(d) { var p = d.split("-"); return parseInt(p[2], 10) + " de " + meses[parseInt(p[1], 10) - 1]; }
  function inicio(e) { return Date.parse(e.d + "T13:00:00Z"); } /* 14h00 em Luanda */
  function fim(e) { return inicio(e) + 3600000; }
  var local = "IECA Zona Verde, Congregação Sede, Benfica, Rua I";
  function calLinks(e) {
    var ymd = e.d.replace(/-/g, ""), titulo = "Estudo Bíblico Juvenil: " + e.t, det = "Leitura: " + e.v + ". Traz a tua Bíblia.";
    var g = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(titulo) +
      "&dates=" + ymd + "T130000Z/" + ymd + "T140000Z&details=" + encodeURIComponent(det) + "&location=" + encodeURIComponent(local);
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SJIECA Zona Verde//PT", "BEGIN:VEVENT", "UID:estudo-" + ymd + "@sjieca-zonaverde",
      "DTSTAMP:20261121T080000Z", "DTSTART:" + ymd + "T130000Z", "DTEND:" + ymd + "T140000Z", "SUMMARY:" + titulo, "DESCRIPTION:" + det,
      "LOCATION:" + local.replace(/,/g, "\\,"), "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Estudo bíblico às 14h00", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    return '<a class="btn sec peq" href="' + g + '" target="_blank" rel="noopener">+ Google Agenda</a>' +
      '<a class="btn sec peq" href="data:text/calendar;charset=utf-8,' + encodeURIComponent(ics) + '" download="estudo-biblico-' + e.d + '.ics">+ iPhone / Outlook</a>';
  }
  var agora = Date.now();
  var todos = [];
  D.series.forEach(function (s) { s.encontros.forEach(function (e) { e.serie = s.nome; todos.push(e); }); });
  todos.sort(function (a, b) { return inicio(a) - inicio(b); });
  var prox = null, ultimo = null;
  todos.forEach(function (e) { if (fim(e) > agora && !prox) prox = e; if (fim(e) <= agora) ultimo = e; });
  if (prox) {
    var hoje = new Date(agora + 3600000).toISOString().slice(0, 10);
    var txt;
    if (inicio(prox) <= agora) txt = "A decorrer agora";
    else if (prox.d === hoje) txt = "Hoje, às 14h00";
    else {
      var dias = Math.round((Date.parse(prox.d) - Date.parse(hoje)) / 86400000);
      txt = dias === 1 ? "Amanhã, às 14h00" : "Faltam " + dias + " dias";
    }
    $("eb-contagem").textContent = txt;
    $("eb-tema").textContent = prox.t;
    $("eb-info").textContent = "Sábado, " + dia(prox.d) + " · 14h00 · " + prox.v + " · Série " + prox.serie + (prox.c ? " · com a " + prox.c : "");
    $("eb-cal").innerHTML = calLinks(prox).replace(/btn sec peq/g, "btn claro peq");
  } else {
    $("eb-contagem").textContent = "Série concluída";
    $("eb-tema").textContent = "Nova série em breve";
    $("eb-info").textContent = "As datas são anunciadas aqui e no grupo da juventude.";
  }
  if (ultimo) {
    $("eb-d-titulo").textContent = ultimo.dt;
    $("eb-d-texto").textContent = ultimo.dx;
    $("eb-d-pergunta").textContent = ultimo.dp ? "Para pensar: " + ultimo.dp : "";
  }
  D.series.forEach(function (s, i) {
    var b = el("div", { "class": "bloco cartao" });
    var h = '<span class="mini">Série ' + (i + 1) + ' · ' + esc(s.periodo) + '</span><h2 style="margin-top:6px">' + esc(s.nome) + '</h2>' +
      '<p style="font-style:italic">' + esc(s.texto) + '</p><p>' + esc(s.descricao) + '</p><ul class="lista-encontros">';
    s.encontros.forEach(function (e) {
      h += '<li' + (fim(e) <= agora ? ' class="passado"' : '') + '><span class="quando">Sáb., ' + dia(e.d) + '</span><span class="oque"><strong>' + esc(e.t) +
        '</strong><br><small>' + esc(e.v) + ' · ' + (e.c ? esc(e.c) : "Convidado a anunciar") + '</small>' +
        (fim(e) > agora ? '<span class="cal">' + calLinks(e) + '</span>' : '') + '</span></li>';
    });
    b.innerHTML = h + '</ul>';
    $("eb-series").appendChild(b);
  });
  D.proximas.forEach(function (p) {
    $("eb-proximas").appendChild(el("div", { "class": "cartao" },
      '<span class="mini">' + esc(p.quando) + '</span><h3>' + esc(p.nome) + '</h3><p><em>' + esc(p.texto) + '</em>. ' + esc(p.descricao) + '</p>'));
  });

  /* ---------- Fale connosco ---------- */
  var form = $("f-mensagem"), estado = $("f-estado");
  if (!D.emailDireccao) $("f-aviso").textContent = "Por agora, a mensagem segue pelo WhatsApp da Direcção. Sem nome, só aparece o número de quem envia.";
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = new FormData(form);
    var dados = { assunto: f.get("assunto"), mensagem: f.get("mensagem"), nome: f.get("nome") || "Anónimo", contacto: f.get("contacto") || "Sem contacto" };
    if (D.emailDireccao) {
      estado.textContent = "A enviar...";
      fetch("https://formsubmit.co/ajax/" + D.emailDireccao, {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ _subject: "Site da Juventude: " + dados.assunto, Assunto: dados.assunto, Mensagem: dados.mensagem, Nome: dados.nome, Contacto: dados.contacto, _template: "table", _captcha: "false" })
      }).then(function (r) { return r.json(); }).then(function () {
        estado.textContent = "Mensagem enviada. Obrigado por escreveres à Direcção.";
        form.reset();
      }).catch(function () {
        estado.textContent = "Não foi possível enviar agora. Tenta outra vez ou escreve-nos pelo WhatsApp.";
      });
    } else {
      var texto = "Mensagem para a Direcção da Sociedade de Jovens\nAssunto: " + dados.assunto + "\n\n" + dados.mensagem + "\n\nNome: " + dados.nome + "\nContacto: " + dados.contacto;
      window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(texto), "_blank");
      estado.textContent = "Abrimos o WhatsApp com a tua mensagem. Só falta carregar em enviar.";
    }
  });


  /* Carrossel do início */
  (function () {
    var pista = $("hero-pista"), caixa = $("hero-carrossel"), pontos = $("hero-pontos");
    if (!pista) return;
    var slides = pista.children, n = slides.length, actual = 0, temp = null;
    var bts = [];
    for (var i = 0; i < n; i++) {
      (function (k) {
        var b = el("button", { type: "button", "aria-label": "Ir para o destaque " + (k + 1) });
        b.addEventListener("click", function () { ir(k); reiniciar(); });
        pontos.appendChild(b); bts.push(b);
      })(i);
    }
    function marcar(i) { actual = i; bts.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); }); }
    function ir(i) { i = (i + n) % n; pista.scrollTo({ left: i * pista.clientWidth, behavior: "smooth" }); marcar(i); }
    caixa.querySelector(".seta-h.ant").addEventListener("click", function () { ir(actual - 1); reiniciar(); });
    caixa.querySelector(".seta-h.seg").addEventListener("click", function () { ir(actual + 1); reiniciar(); });
    var t;
    pista.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(function () { marcar(Math.round(pista.scrollLeft / pista.clientWidth)); }, 80); });
    var parado = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function reiniciar() { if (parado) return; clearInterval(temp); temp = setInterval(function () { if (!document.hidden) ir(actual + 1); }, 7000); }
    caixa.addEventListener("mouseenter", function () { clearInterval(temp); });
    caixa.addEventListener("mouseleave", reiniciar);
    caixa.addEventListener("focusin", function () { clearInterval(temp); });
    marcar(0); reiniciar();
  })();

  mostrar();
})();

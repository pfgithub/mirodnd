(() => {
  // src/_stdlib.ts
  window.el = (...a) => document.createElement(...a);
  window.txt = (txt2) => document.createTextNode(txt2);
  window.anychange = (itms, cb) => {
    itms.forEach((itm) => itm.oninput = () => cb());
    cb();
    return cb;
  };
  window.body = document.getElementById("maincontent") || document.body;
  Node.prototype.attr = function(atrs) {
    Object.entries(atrs).forEach(([k, v]) => v == null ? this.removeAttribute(k) : this.setAttribute(k, v));
    return this;
  };
  Node.prototype.adto = function(prnt) {
    prnt.appendChild(this);
    return this;
  };
  Node.prototype.adch = function(...chlds) {
    chlds.forEach((chld) => this.appendChild(chld));
    return this;
  };
  Node.prototype.atxt = function(txta) {
    this.appendChild(txt(txta));
    return this;
  };
  Node.prototype.onev = function(...a) {
    this.addEventListener(...a);
    return this;
  };
  Node.prototype.clss = function(...clss) {
    clss.forEach((clitm) => clitm.split(/[. ]/g).filter((q) => q).map((itm) => this.classList.add(itm)));
    return this;
  };
  Node.prototype.styl = function(styl) {
    Object.entries(styl).forEach(([k, v]) => this.style.setProperty(k, v));
    return this;
  };
  Object.defineProperty(Array.prototype, "last", { enumerable: false, get: function() {
    return this[this.length - 1];
  } });
  Object.defineProperty(Object.prototype, "dwth", { enumerable: false, value: function(cb) {
    cb(this);
    return this;
  } });

  // src/index.ts
  var query = new URLSearchParams(location.search);
  var meta_id = miro.getClientId ? miro.getClientId() : "ENOID";
  function libPath(id) {
    if (location.pathname.endsWith("-dev.html")) {
      return "/mirodnd/app-dev.html?page=" + encodeURIComponent(id);
    } else {
      return "/mirodnd/app.html?page=" + encodeURIComponent(id);
    }
  }
  function fullLibPath(id) {
    return "https://pfg.pw" + libPath(id);
  }
  var page = query.get("page");
  if (page === "side_panel") {
    document.body.appendChild(document.createTextNode("Hi!"));
    const d20btn = el("button").adto(document.body).atxt("Create D20");
    d20btn.onev("click", async () => {
      const meta = {
        kind: "random",
        min: 1,
        max: 20
      };
      await miro.board.widgets.create({ type: "sticker", text: "Click to Roll", metadata: {
        [meta_id]: meta
      } });
    });
    const fwbtn = el("button").adto(document.body).atxt("Create link to frame");
    fwbtn.onclick = async () => {
      const selected_items = await miro.board.selection.get();
      if (selected_items.length !== 1)
        return void miro.showErrorNotification("select frame then click");
      const selected = selected_items[0];
      if (selected.type !== "FRAME")
        return void miro.showErrorNotification("need frame");
      const meta = {
        kind: "frame_link",
        frame_id: selected.id
      };
      await miro.board.widgets.create({ type: "sticker", text: "Jump", metadata: {
        [meta_id]: meta
      } });
    };
    el("button").adto(document.body).atxt("Create thing").onev("click", async () => {
      await miro.board.widgets.create({ type: "embed", html: '<iframe src="' + fullLibPath("unsupported") + '"></iframe>' });
    });
    {
      const clickmodeframe = el("div").adto(document.body);
      el("button").adto(clickmodeframe).atxt("Press Button").onev("click", () => {
        localStorage.setItem("cfg-clickmode", "click");
      });
      el("button").adto(clickmodeframe).atxt("Instant").onev("click", () => {
        localStorage.setItem("cfg-clickmode", "instant");
      });
    }
  } else if (page == null) {
    document.body.appendChild(document.createTextNode("You should not be seeing this."));
    const circle_icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>';
    miro.onReady(() => {
      miro.initialize({
        extensionPoints: {
          bottomBar: {
            title: "R\u{1F672}O",
            svgIcon: circle_icon,
            onClick: async () => {
              var _a;
              const is_authorized = await miro.isAuthorized();
              if (!is_authorized) {
                await miro.requestAuthorization();
              }
              if (((_a = localStorage.getItem("cfg-clickmode")) != null ? _a : "click") === "click") {
                const selection = await miro.board.selection.get();
                if (!await activateSelectedItem(selection))
                  return;
              }
              await miro.board.ui.openLeftSidebar(libPath("side_panel"));
            }
          }
        }
      }).catch((e) => console.log("plugin init error", e));
      async function activateSelectedItem(selection) {
        if (selection.length !== 1)
          return { activated: false };
        const selxitm = selection[0];
        const meta = selxitm.metadata[meta_id];
        if (!meta)
          return { activated: false };
        if (meta.kind === "random") {
          const [widget] = await miro.board.widgets.get({ id: selxitm.id, type: "STICKER" });
          if (!widget)
            return void miro.showErrorNotification("dice error. try making new dice.");
          widget.text = "Num: " + ((Math.random() * (meta.max - meta.min) | 0) + meta.min);
          await miro.board.widgets.update(widget);
          return;
        } else if (meta.kind === "frame_link") {
          const [frame] = await miro.board.widgets.get({ id: meta.frame_id, type: "FRAME" });
          if (!frame)
            return void miro.showErrorNotification("link error. maybe the link was deleted? try making a new link");
          const prev_viewport = await miro.board.viewport.get();
          await miro.board.viewport.set({ x: frame.x - frame.width / 2, y: frame.y - frame.height / 2, width: frame.width, height: frame.height });
          const backmeta = {
            kind: "back_link",
            viewport: {
              x: prev_viewport.x,
              y: prev_viewport.y,
              width: prev_viewport.width,
              height: prev_viewport.height
            }
          };
          const backbtnsize = Math.min(frame.width / 10, frame.height / 10);
          const backbtnw = backbtnsize;
          const backbtnh = backbtnsize / 3;
          await miro.board.widgets.create({
            type: "shape",
            text: "< Back",
            x: frame.x - frame.width / 2 + backbtnw / 2,
            y: frame.y - frame.height / 2 + backbtnh / 2,
            width: backbtnw,
            height: backbtnh,
            metadata: {
              [meta_id]: backmeta
            }
          });
          return;
        } else if (meta.kind === "back_link") {
          await miro.board.viewport.set(meta.viewport);
          await miro.board.widgets.deleteById(selxitm.id);
          return;
        }
        void miro.showErrorNotification("error, unsupported kind " + meta.kind);
        return;
      }
      miro.addListener("SELECTION_UPDATED", async (event) => {
        const data = event.data;
        if (data.length !== 1)
          return;
        const selxitm = data[0];
        const meta = selxitm.metadata[meta_id];
        if (!meta)
          return;
        if (localStorage.getItem("cfg-clickmode") !== "instant") {
          void miro.showNotification("Click the circle button to activate.");
          return;
        }
        const selection = await miro.board.widgets.get({ id: selxitm.id });
        await activateSelectedItem(selection);
      });
    });
  } else {
    document.body.appendChild(document.createTextNode("404 not found page: " + page));
  }
})();

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
  async function createCentered() {
    const frame = await miro.board.viewport.get();
    const size = Math.min(frame.width / 10, frame.height / 10);
    return {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
      width: size,
      height: size
    };
  }
  function randomizeDice(meta) {
    const randv = (Math.random() * (meta.max + 1 - meta.min) | 0) + meta.min;
    if (meta.min === 1 && meta.max === 6) {
      return [..."\u2680\u2681\u2682\u2683\u2684\u2685"][randv - 1];
    } else if (meta.min === 1) {
      return "d" + meta.max + ": " + randv;
    }
    return "Num: " + randv;
  }
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
      widget.text = randomizeDice(meta);
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
  if (page === "side_panel") {
    const root = el("div").adto(document.body);
    root.appendChild(document.createTextNode("Hi!"));
    const d20btn = el("button").adto(root).atxt("Create D20");
    d20btn.onev("click", async () => {
      const meta = {
        kind: "random",
        min: 1,
        max: 20
      };
      await miro.board.widgets.create({ type: "sticker", text: "Click to Roll", ...await createCentered(), metadata: {
        [meta_id]: meta
      } });
    });
    const fwbtn = el("button").adto(root).atxt("Create link to frame");
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
      await miro.board.widgets.create({ type: "sticker", text: "Jump", ...await createCentered(), metadata: {
        [meta_id]: meta
      } });
    };
    el("button").adto(root).atxt("Create thing").onev("click", async () => {
      await miro.board.widgets.create({ type: "embed", ...await createCentered(), html: '<iframe src="' + fullLibPath("unsupported") + '"></iframe>' });
    });
    {
      const clickmodeframe = el("div").adto(root);
      el("button").adto(clickmodeframe).atxt("Press Button").onev("click", () => {
        localStorage.setItem("cfg-clickmode", "click");
      });
      el("button").adto(clickmodeframe).atxt("Instant").onev("click", () => {
        localStorage.setItem("cfg-clickmode", "instant");
      });
    }
    let selection_editor = null;
    const clearSelxnEditor = () => {
      root.style.display = "";
      if (selection_editor)
        selection_editor.remove();
    };
    const createSelxnEditor = (widget, meta) => {
      clearSelxnEditor();
      root.style.display = "none";
      const editor = el("div").adto(document.body);
      selection_editor = editor;
      el("button").adto(el("div").adto(editor)).atxt("\u25CB Activate").onev("click", async () => {
        await activateSelectedItem([widget]);
      });
      if (meta.kind === "random") {
        editor.adch(el("h1").atxt("Dice"));
        const minv = el("input").adto(el("label").atxt("Min: ").adto(el("div").adto(editor)));
        const maxv = el("input").adto(el("label").atxt("Max: ").adto(el("div").adto(editor)));
        minv.value = "" + meta.min;
        maxv.value = "" + meta.max;
        const savebtn = el("button").adto(el("div").adto(editor)).atxt("Save");
        savebtn.disabled = true;
        savebtn.onev("click", async () => {
          meta.min = +minv.value;
          meta.max = +maxv.value;
          widget.text = randomizeDice(meta);
          didchange();
          await miro.board.widgets.update(widget);
        });
        const didchange = () => {
          const is_unedited = minv.value === "" + meta.min && maxv.value === "" + meta.max;
          savebtn.disabled = is_unedited;
        };
        anychange([minv, maxv], didchange);
      } else {
        editor.atxt("TODO edit " + meta.kind);
      }
    };
    miro.addListener("SELECTION_UPDATED", async (event) => {
      const data = event.data;
      if (data.length !== 1)
        return clearSelxnEditor();
      const selxitm = data[0];
      const meta = selxitm.metadata[meta_id];
      if (!meta)
        return clearSelxnEditor();
      const selection = await miro.board.widgets.get({ id: selxitm.id });
      if (selection.length !== 1)
        return clearSelxnEditor();
      const wselxitm = selection[0];
      const wmeta = wselxitm.metadata[meta_id];
      if (!wmeta)
        return clearSelxnEditor();
      createSelxnEditor(wselxitm, wmeta);
    });
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

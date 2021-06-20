(() => {
  // src/index.ts
  var query = new URLSearchParams(location.search);
  var is_dev = location.pathname.endsWith("-dev.html");
  var meta_id = is_dev ? "3074457360393936567" : "3074457360394471343";
  function libPath(id) {
    if (location.pathname.endsWith("-dev.html")) {
      return "/mirodnd/app-dev.html?page=" + encodeURIComponent(id);
    } else {
      return "/mirodnd/app.html?page=" + encodeURIComponent(id);
    }
  }
  var page = query.get("page");
  if (page === "side_panel") {
    document.body.appendChild(document.createTextNode("Hi!"));
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    btn.appendChild(document.createTextNode("Create D20"));
    btn.onclick = async () => {
      const meta = {
        kind: "random",
        min: 1,
        max: 20
      };
      await miro.board.widgets.create({ type: "sticker", text: "Click to Roll", metadata: {
        [meta_id]: meta
      } });
    };
    const fwbtn = document.createElement("button");
    document.body.appendChild(fwbtn);
    fwbtn.appendChild(document.createTextNode("Create link to frame"));
    fwbtn.onclick = async () => {
      const selected_items = await miro.board.selection.get();
      if (selected_items.length !== 1)
        return alert("select frame then click");
      const selected = selected_items[0];
      if (selected.type !== "FRAME")
        return alert("need frame");
      const meta = {
        kind: "frame_link",
        frame_id: selected.id
      };
      await miro.board.widgets.create({ type: "sticker", text: "Jump", metadata: {
        [meta_id]: meta
      } });
    };
  } else if (page == null) {
    document.body.appendChild(document.createTextNode("You should not be seeing this."));
    const circle_icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>';
    miro.onReady(() => {
      miro.initialize({
        extensionPoints: {
          bottomBar: {
            title: "Some title",
            svgIcon: circle_icon,
            onClick: async () => {
              const is_authorized = await miro.isAuthorized();
              if (!is_authorized) {
                await miro.requestAuthorization();
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
        if (meta.kind === "random") {
          const [widget] = await miro.board.widgets.get({ id: selxitm.id, type: "STICKER" });
          if (!widget)
            return;
          widget.text = "Num: " + ((Math.random() * (meta.max - meta.min) | 0) + meta.min);
          await miro.board.widgets.update(widget);
        } else if (meta.kind === "frame_link") {
          const [widget] = await miro.board.widgets.get({ id: meta.frame_id, type: "FRAME" });
          if (!widget)
            return;
          console.log(await miro.board.viewport.get(), await miro.board.viewport.getScale(), widget);
          await miro.board.viewport.set({ x: widget.x - widget.width / 2, y: widget.y - widget.height / 2, width: widget.width, height: widget.height });
        }
      });
    });
  } else {
    document.body.appendChild(document.createTextNode("404 not found page: " + page));
  }
})();

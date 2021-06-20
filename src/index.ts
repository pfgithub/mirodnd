const query = new URLSearchParams(location.search);

const meta_id = miro.getClientId();

function libPath(id: LibID) {
    if(location.pathname.endsWith("-dev.html")) {
        return "/mirodnd/app-dev.html?page="+encodeURIComponent(id);
    }else{
        return "/mirodnd/app.html?page="+encodeURIComponent(id);
    }
}

type Metadata = {
    kind: "random",
    min: number,
    max: number,
} | {
    kind: "frame_link",
    frame_id: string,
} | {
    kind: "unknown",
};

const page = query.get("page") as LibID | null;

type LibID = "side_panel" | "unsupported";

if(page === "side_panel") {
    document.body.appendChild(document.createTextNode("Hi!"));

    const btn = document.createElement("button");
    document.body.appendChild(btn);
    btn.appendChild(document.createTextNode("Create D20"));

    btn.onclick = async () => {
        const meta: Metadata = {
            kind: "random",
            min: 1,
            max: 20,
        };
        await miro.board.widgets.create({type: 'sticker', text: 'Click to Roll', metadata: {
            [meta_id]: meta,
        }});
        // woah widget.clientVisible
    };

    const fwbtn = document.createElement("button");
    document.body.appendChild(fwbtn);
    fwbtn.appendChild(document.createTextNode("Create link to frame"));

    fwbtn.onclick = async () => {
        const selected_items = await miro.board.selection.get();
        if(selected_items.length !== 1) return alert("select frame then click");
        const selected = selected_items[0]!;
        if(selected.type !== "FRAME") return alert("need frame");
        
        const meta: Metadata = {
            kind: "frame_link",
            frame_id: selected.id,
        };
        await miro.board.widgets.create({type: 'sticker', text: 'Jump', metadata: {
            [meta_id]: meta,
        }});
    };
}else if(page == null){
    document.body.appendChild(document.createTextNode("You should not be seeing this."));

    // const icon24 = '<path fill="currentColor" fill-rule="nonzero" d="M20.156 7.762c-1.351-3.746-4.672-5.297-8.838-4.61-'
    // +'3.9.642-7.284 3.15-7.9 5.736-1.14 4.784-.015 7.031 2.627 8.09.61.244 1.28.412 2.002.518.277.041.549.072.844.097.1'
    // +'38.012.576.045.659.053.109.01.198.02.291.035 1.609.263 2.664 1.334 3.146 2.715 7.24-2.435 9.4-6.453 7.17-12.634zm'
    // +'-18.684.662C3.18 1.256 18.297-3.284 22.038 7.084c2.806 7.78-.526 13.011-9.998 15.695-.266.076-.78.173-.759-.287.0'
    // +'62-1.296-.47-2.626-1.762-2.837-1.009-.165-10.75.124-8.047-11.23zm9.427 4.113a6.853 6.853 0 0 0 1.787.172c.223.348'
    // +'.442.733.79 1.366.53.967.793 1.412 1.206 2a1 1 0 1 0 1.636-1.15c-.358-.51-.593-.908-1.09-1.812-.197-.36-.358-.649'
    // +'-.503-.899 1.16-.573 1.916-1.605 2.005-2.909.189-2.748-2.65-4.308-6.611-3.267-.443.117-.834.44-.886 1.408-.065 1.'
    // +'192-.12 2.028-.25 3.825-.129 1.808-.185 2.653-.25 3.86a1 1 0 0 0 1.997.108c.05-.913.093-1.617.17-2.702zm.144-2.02'
    // +'6c.077-1.106.124-1.82.171-2.675 2.398-.483 3.595.257 3.521 1.332-.08 1.174-1.506 1.965-3.692 1.343z"/>';

    const circle_icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>';


    miro.onReady(() => {
        miro.initialize({
            extensionPoints: {
                bottomBar: {
                    title: 'Some title',
                    svgIcon: circle_icon,
                    onClick: async () => {
                        const is_authorized = await miro.isAuthorized();
                        if(!is_authorized) {
                            await miro.requestAuthorization();
                        }
                        await miro.board.ui.openLeftSidebar(libPath("side_panel"));
                    }
                }
            },
        }).catch(e => console.log("plugin init error", e));

        //eslint-disable-next-line @typescript-eslint/no-misused-promises
        miro.addListener("SELECTION_UPDATED", async (event) => {
            //
            const data = event.data as {id: string, metadata: {[key: string]: unknown}, type: string}[];
            if(data.length !== 1) return;
            const selxitm = data[0]!;
            const meta = selxitm.metadata[meta_id] as Metadata | undefined;
            if(!meta) return;

            if(meta.kind === "random") {
                const [widget] = await miro.board.widgets.get({id: selxitm.id, type: "STICKER"}) as [SDK.ITextWidget | undefined];
                if(!widget) return;

                widget.text = "Num: "+(((Math.random() * (meta.max - meta.min)) |0) + meta.min);

                await miro.board.widgets.update(widget);

                // const viewport = await miro.board.viewport.get();
                // console.log(viewport);
                // await miro.board.viewport.set({ x: -1858.2041958933646, y: -536.0726428187653, width: 5161.471103327495, height: 1356.217162872154 });
            }else if(meta.kind === "frame_link") {
                const [widget] = await miro.board.widgets.get({id: meta.frame_id, type: "FRAME"}) as [SDK.IFrameWidget | undefined];
                if(!widget) return;
                
                console.log(await miro.board.viewport.get(), await miro.board.viewport.getScale(), widget);
                await miro.board.viewport.set({x: widget.x - (widget.width / 2), y: widget.y - (widget.height / 2), width: widget.width, height: widget.height});
            }
        });
    });
}else{
    document.body.appendChild(document.createTextNode("404 not found page: "+page));
}
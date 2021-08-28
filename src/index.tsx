import { createSignal, JSX, Match, Switch, untrack } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import "virtual:windi.css";
import "./disabled.css";
import { ShowCond, SwitchKind } from "./utils";

if(location.pathname.endsWith("-dev.html")) {
    void fetch("http://localhost:8020/bundle.css").then(r => r.text()).then(css => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    });
}

const query = new URLSearchParams(location.search);

let meta_id = "ENOID";

function libPath(id: LibID) {
    if(location.pathname.endsWith("-dev.html")) {
        return "/mirodnd/app-dev.html?page="+encodeURIComponent(id);
    }else{
        return "/mirodnd/app.html?page="+encodeURIComponent(id);
    }
}
function fullLibPath(id: LibID) {
    return "https://pfg.pw"+libPath(id);
}

type DiceMeta = {
    kind: "random",
    min: number,
    max: number,
};
type Metadata = DiceMeta | {
    kind: "frame_link",
    frame_id: string,
    create_back_button?: boolean,
} | {
    kind: "back_link",
    viewport: SDK.IRect,
} | {
    kind: "unsupported",
};

const page = query.get("page") as LibID | null;

type LibID = "side_panel" | "unsupported";

async function createCentered(): Promise<{x: number, y: number, width: number, height: number}> {
    const frame = await miro.board.viewport.get();
    const size = Math.min(frame.width / 10, frame.height / 10);
    return {
        x: frame.x + (frame.width / 2),
        y: frame.y + (frame.height / 2),
        width: size,
        height: size,
    };
}

function randomizeDice(meta: DiceMeta): string {
    const randv = (((Math.random() * ((meta.max + 1) - meta.min)) |0) + meta.min);
    if(meta.min === 1 && meta.max === 6) {
        return [..."⚀⚁⚂⚃⚄⚅"][randv - 1]!;
    }else if(meta.min === 1) {
        return "d"+meta.max+": "+randv;
    }
    return "Num: "+randv;
}

async function activateSelectedItem(selection: SDK.IWidget[]): Promise<undefined | {activated: false}> {
    if(selection.length !== 1) return {activated: false};
    const selxitm = selection[0]!;
    const meta = selxitm.metadata[meta_id] as Metadata | undefined;
    if(!meta) return {activated: false};

    if(meta.kind === "random") {
        const [widget] = await miro.board.widgets.get({id: selxitm.id, type: "STICKER"}) as [SDK.ITextWidget | undefined];
        if(!widget) return void miro.showErrorNotification("dice error. try making new dice.");

        widget.text = randomizeDice(meta);

        await miro.board.widgets.update(widget);

        return;
    }else if(meta.kind === "frame_link") {
        const [frame] = await miro.board.widgets.get({id: meta.frame_id, type: "FRAME"}) as [SDK.IFrameWidget | undefined];
        if(!frame) return void miro.showErrorNotification("link error. maybe the link was deleted? try making a new link");
        
        const prev_viewport = await miro.board.viewport.get();
        await miro.board.viewport.set({x: frame.x - (frame.width / 2), y: frame.y - (frame.height / 2), width: frame.width, height: frame.height});
        
        if(meta.create_back_button ?? true) {
            const backmeta: Metadata = {
                kind: "back_link",
                viewport: {
                    x: prev_viewport.x,
                    y: prev_viewport.y,
                    width: prev_viewport.width,
                    height: prev_viewport.height,
                },
            };
            const backbtnsize = Math.min(frame.width / 10, frame.height / 10);
            const backbtnw = backbtnsize;
            const backbtnh = backbtnsize / 3;
            await miro.board.widgets.create({
                type: 'shape',
                text: '< Back',
                x: frame.x - (frame.width / 2) + (backbtnw / 2),
                y: frame.y - (frame.height / 2) + (backbtnh / 2),
                width: backbtnw,
                height: backbtnh,
                metadata: {
                    [meta_id]: backmeta,
                },
            });
        }

        return;
    }else if(meta.kind === "back_link") {
        await miro.board.viewport.set(meta.viewport);
        await miro.board.widgets.deleteById(selxitm.id);

        return;
    }

    void miro.showErrorNotification("error, unsupported kind "+meta.kind);
    return;
}

function NoSelection(): JSX.Element {
    return <div>
        <button class="btn" onClick={async () => {
            const meta: Metadata = {
                kind: "random",
                min: 1,
                max: 20,
            };
            await miro.board.widgets.create({
                type: 'sticker',
                text: 'Click to Roll',
                ...await createCentered(), metadata: {
                    [meta_id]: meta,
                },
            });
        // woah widget.clientVisible
        }}>Create D20</button>
        <button class="btn" onClick={async () => {
            const selected_items = await miro.board.selection.get();
            if(selected_items.length !== 1) return void miro.showErrorNotification("select frame then click");
            const selected = selected_items[0]!;
            if(selected.type !== "FRAME") return void miro.showErrorNotification("need frame");

            const meta: Metadata = {
                kind: "frame_link",
                frame_id: selected.id,
            };
            await miro.board.widgets.create({type: 'sticker', text: 'Jump', ...await createCentered(), metadata: {
                [meta_id]: meta,
            }});
        }}>Create link to frame</button>
        <button class="btn" onClick={async () => {
            await miro.board.widgets.create({
                type: "embed",
                ...await createCentered(),
                html: "<iframe src=\""+fullLibPath("unsupported")+"\"></iframe>",
            });
        }}>Create thing</button>
        <div>
            Click Mode:
            <button class="btn" onClick={() => {
                localStorage.setItem("cfg-clickmode", "click");
            }}>Click</button>
            <button class="btn" onClick={() => {
                localStorage.setItem("cfg-clickmode", "instant");
            }}>Instant</button>
        </div>
    </div>;
}

function SelectionEditor(props: {selection: SelectionState}): JSX.Element {
    return <ShowCond when={props.selection.meta} fallback={<>
        <Switch>
            <Match when={props.selection.widget.type === "LINE"}>{untrack(() => {
                const widget = () => props.selection.widget as SDK.ILineWidget;
                const lengthPx = () => Math.hypot(
                    widget().startPosition.x - widget().endPosition.x,
                    widget().startPosition.y - widget().endPosition.y,
                );
                const scale = () => 0.00836517049;
                const miles = () => lengthPx() * scale();
                const daysPerMile = () => 400;
                const days = () => miles() * (1 / daysPerMile());

                return <>
                    <div>Length (Excludes curves/bends): {lengthPx().toLocaleString()}px</div>
                    <div>
                        Scale: {scale().toLocaleString()}mi/px
                    </div>
                    <div>
                        Miles: {miles().toLocaleString()}mi
                    </div>
                    <div>
                        Transport Speed: {daysPerMile().toLocaleString()}d/mi
                    </div>
                    <div>
                        Days: {days().toLocaleString()}d
                    </div>
                </>;
            })}</Match>
        </Switch>
        <hr />
        <pre><code>{JSON.stringify(props.selection.widget, null, "  ")}</code></pre>
    </>}>{any_meta => <>
        <button class="btn" onclick={async () => {
            await activateSelectedItem([props.selection.widget]);
        }}>○ Activate</button>
        <SwitchKind item={any_meta}>{{
            random: meta => {
                const [state, setState] = createSignal<DiceMeta>({...meta});

                return <div>
                    <h1 class="heading">Dice</h1>
                    <div><label>Min: <input
                        class="input"
                        onInput={e => setState(d => ({...d, min: +e.currentTarget.value}))}
                        type="number"
                        ref={el => el.value = "" + state().min}
                    /></label></div>
                    <div><label>Max: <input
                        class="input"
                        onInput={e => setState(d => ({...d, max: +e.currentTarget.value}))}
                        type="number"
                        ref={el => el.value = "" + state().max}
                    /></label></div>
                    <button class="btn"
                        disabled={JSON.stringify(state()) === JSON.stringify(meta)}
                        onClick={async () => {
                            Object.assign(meta, state());
                            (props.selection.widget as SDK.IStickerWidget).text = randomizeDice(meta);
                            await miro.board.widgets.update(props.selection.widget);
                            setState({...meta});
                        }}
                    >Save</button>
                </div>;
            },
            frame_link: meta => {
                const [state, setState] = createSignal({...meta});

                return <div>
                    <h1 class="heading">Frame Link</h1>
                    <div>Link to: [TODO]</div>
                    <div><label><input
                        onInput={e => setState(d => ({...d, create_back_button: !(d.create_back_button ?? true)}))}
                        type="checkbox"
                        checked={state().create_back_button ?? true}
                    /> Make back button</label></div>
                    <button class="btn"
                        disabled={JSON.stringify(state()) === JSON.stringify(meta)}
                        onClick={async () => {
                            Object.assign(meta, state());
                            await miro.board.widgets.update(props.selection.widget);
                            setState({...meta});
                        }}
                    >Save</button>
                </div>;
            },
            back_link: meta => <div>not editable</div>,
            unsupported: meta => <div>
                TODO edit {meta.kind}
            </div>,
        }}</SwitchKind></>}
    </ShowCond>;
}

type SelectionState = {widget: SDK.IWidget, meta: Metadata | undefined};
function SidePanel(props: {selection: SelectionState | null}): JSX.Element {
    // <button class="btn" onClick={() => location.reload()}>Refresh Panel</button>
    return <div>
        <ShowCond when={props.selection} fallback={<NoSelection />}>{selxn => (
            <SelectionEditor selection={selxn} />
        )}</ShowCond>
    </div>;
}

function runSidePanel() {
    type StoreTypeValue = {value: SelectionState | null};
    const [selection, setSelection] = createStore<StoreTypeValue>({value: null});
    const sp = document.createElement("div");
    document.body.appendChild(sp);
    render(() => <SidePanel selection={selection.value} />, sp);

    const onupdate = async (event: SDK.Event) => {
        const selected_item = await miro.board.selection.get();
        console.log(selected_item);
        if(selected_item.length !== 1) return setSelection({value: null});
        const wselxitm = selected_item[0]!;

        const wmeta = wselxitm.metadata[meta_id] as Metadata | undefined;
        if(selection.value && selection.value.widget.id === wselxitm.id) {
            setSelection(reconcile<StoreTypeValue>({value: {widget: wselxitm, meta: wmeta}}, {merge: true}));
        }else{
            setSelection({value: {widget: wselxitm, meta: wmeta}});
        }
    };
    miro.addListener("SELECTION_UPDATED", e => void onupdate(e));
    miro.addListener("CANVAS_CLICKED", e => void onupdate(e));
}
function runMainScreen() {
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
                    title: 'R🙲O',
                    svgIcon: circle_icon,
                    onClick: async () => {
                        const is_authorized = await miro.isAuthorized();
                        if(!is_authorized) {
                            await miro.requestAuthorization();
                        }

                        if((localStorage.getItem("cfg-clickmode") ?? "click") === "click") {
                            const selection = await miro.board.selection.get();
                            if(!await activateSelectedItem(selection)) return;
                        }

                        await miro.board.ui.openLeftSidebar(libPath("side_panel"));
                    }
                }
            },
        }).catch(e => console.log("plugin init error", e));

        const onupdate = async (event: SDK.Event) => {
            const data = event.data as {id: string, metadata: {[key: string]: unknown}, type: string}[];
            if(data.length !== 1) return;
            const selxitm = data[0]!;
            const meta = selxitm.metadata[meta_id] as Metadata | undefined;
            if(!meta) return;

            if(localStorage.getItem("cfg-clickmode") !== "instant") {
                void miro.showNotification("Click the circle button to activate.");
                return;
            }

            const selection = await miro.board.widgets.get({id: selxitm.id});
            await activateSelectedItem(selection);
        };
        miro.addListener("SELECTION_UPDATED", e => void onupdate(e));
    });
}

function doStart() {
    if(page === "side_panel") {
        runSidePanel();
    }else if(page == null){
        runMainScreen();
    }else{
        document.body.appendChild(document.createTextNode("404 not found page: "+page));
    }
}

if(!(miro.onReady as unknown as boolean)) {
    doStart();
}else miro.onReady(() => {
    meta_id = miro.getClientId();

    doStart();
});
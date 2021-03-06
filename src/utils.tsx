import { createMemo, JSX, untrack } from "solid-js";

export function ShowBool(props: {
    when: boolean,
    fallback?: JSX.Element,
    children: JSX.Element,
}): JSX.Element {
    const condition = createMemo(() => props.when, undefined, {
        equals: (a: boolean, b: boolean) => !a === !b,
    });
    return createMemo(() => {
        if(condition()) return props.children;
        return props.fallback;
    });
}
export function ShowCond<T>(props: {
    when: T | undefined | null,
    fallback?: JSX.Element,
    children: (item: T) => JSX.Element,
}): JSX.Element {
    return createMemo(() => {
        if (props.when != null) {
            const child = props.children;
            return untrack(() => child(props.when!));
        }
        return props.fallback;
    });
}

export type Include<T, U> = T extends U ? T : never;

export function kindIs<K extends string, T extends {kind: string}>(value: T, key: K): Include<T, {kind: K}> | null {
    return value.kind === key ? value as unknown as null : null;
}

type MatchFn<T, Key> = (value: Include<T, {kind: Key}>) => JSX.Element;
export function SwitchKind<T extends {kind: string}>(props: {
    item: T,
    children: {[Key in T["kind"]]: MatchFn<T, Key>},
}): JSX.Element {
    // <Switch children={/*@once*/} />
    return createMemo(() => {
        let match = props.children[props.item.kind as T["kind"]] as MatchFn<T, T["kind"]> | undefined;
        if(!match) {
            match = props.children["unsupported" as T["kind"]] as MatchFn<T, T["kind"]> | undefined;
            if(!match) throw new Error("condition "+props.item.kind+" was not handled and no unsupported branch");
        }
        const arg = props.item as Include<T, {kind: T["kind"]}>;
        return untrack(() => match!(arg)); // untrack in order to treat the function as a widget (dependencies accessed don't cause this to reexec)
    });
}
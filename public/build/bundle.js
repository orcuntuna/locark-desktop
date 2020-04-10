
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    const context = {
      subscribe: null,
      addNotification: null,
      removeNotification: null,
      clearNotifications: null,
    };

    const getNotificationsContext = () => getContext(context);

    /* node_modules\svelte-notifications\src\components\Notification.svelte generated by Svelte v3.19.1 */

    function create_fragment(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*item*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: {
    				notification: /*notification*/ ctx[1],
    				withoutStyles: /*withoutStyles*/ ctx[2],
    				onRemove: /*removeNotificationHandler*/ ctx[3]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*notification*/ 2) switch_instance_changes.notification = /*notification*/ ctx[1];
    			if (dirty & /*withoutStyles*/ 4) switch_instance_changes.withoutStyles = /*withoutStyles*/ ctx[2];

    			if (switch_value !== (switch_value = /*item*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { item } = $$props;
    	let { notification = {} } = $$props;
    	let { withoutStyles = false } = $$props;
    	const { removeNotification } = getNotificationsContext();
    	const { id, removeAfter, customClass = "" } = notification;
    	const removeNotificationHandler = () => removeNotification(id);
    	let timeout = null;

    	if (removeAfter) {
    		timeout = setTimeout(removeNotificationHandler, removeAfter);
    	}

    	onDestroy(() => {
    		if (removeAfter && timeout) clearTimeout(timeout);
    	});

    	const writable_props = ["item", "notification", "withoutStyles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("notification" in $$props) $$invalidate(1, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(2, withoutStyles = $$props.withoutStyles);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		fade,
    		getNotificationsContext,
    		item,
    		notification,
    		withoutStyles,
    		removeNotification,
    		id,
    		removeAfter,
    		customClass,
    		removeNotificationHandler,
    		timeout,
    		setTimeout,
    		clearTimeout
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("notification" in $$props) $$invalidate(1, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(2, withoutStyles = $$props.withoutStyles);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, notification, withoutStyles, removeNotificationHandler];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			item: 0,
    			notification: 1,
    			withoutStyles: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Notification> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notification() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notification(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-notifications\src\components\DefaultNotification.svelte generated by Svelte v3.19.1 */
    const file = "node_modules\\svelte-notifications\\src\\components\\DefaultNotification.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let div0_class_value;
    	let t1;
    	let button;
    	let t2;
    	let button_class_value;
    	let div1_class_value;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			if (!default_slot) {
    				t0 = text(/*text*/ ctx[1]);
    			}

    			if (default_slot) default_slot.c();
    			t1 = space();
    			button = element("button");
    			t2 = text("×");
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]("content")) + " svelte-4t58gn"));
    			add_location(div0, file, 100, 2, 2227);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]("button")) + " svelte-4t58gn"));
    			attr_dev(button, "aria-label", "delete notification");
    			add_location(button, file, 103, 2, 2296);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*getClass*/ ctx[2]()) + " svelte-4t58gn"));
    			attr_dev(div1, "role", "status");
    			attr_dev(div1, "aria-live", "polite");
    			add_location(div1, file, 93, 0, 2139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (!default_slot) {
    				append_dev(div0, t0);
    			}

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, t2);
    			current = true;

    			dispose = listen_dev(
    				button,
    				"click",
    				function () {
    					if (is_function(/*onRemove*/ ctx[0])) /*onRemove*/ ctx[0].apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 128) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[7], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				if (!div1_intro) div1_intro = create_in_transition(div1, fade, {});
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div1_outro) div1_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { notification = {} } = $$props;
    	let { withoutStyles = false } = $$props;
    	let { onRemove = null } = $$props;
    	const { id, text, type } = notification;

    	const getClass = suffix => {
    		const defaultSuffix = suffix ? `-${suffix}` : "";
    		const defaultNotificationClass = ` default-notification-style${defaultSuffix}`;
    		const defaultNotificationType = type && !suffix ? ` default-notification-${type}` : "";
    		return `notification${defaultSuffix}${withoutStyles ? "" : defaultNotificationClass}${defaultNotificationType}`;
    	};

    	const writable_props = ["notification", "withoutStyles", "onRemove"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DefaultNotification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("notification" in $$props) $$invalidate(3, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(4, withoutStyles = $$props.withoutStyles);
    		if ("onRemove" in $$props) $$invalidate(0, onRemove = $$props.onRemove);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		notification,
    		withoutStyles,
    		onRemove,
    		id,
    		text,
    		type,
    		getClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("notification" in $$props) $$invalidate(3, notification = $$props.notification);
    		if ("withoutStyles" in $$props) $$invalidate(4, withoutStyles = $$props.withoutStyles);
    		if ("onRemove" in $$props) $$invalidate(0, onRemove = $$props.onRemove);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		onRemove,
    		text,
    		getClass,
    		notification,
    		withoutStyles,
    		id,
    		type,
    		$$scope,
    		$$slots
    	];
    }

    class DefaultNotification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			notification: 3,
    			withoutStyles: 4,
    			onRemove: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultNotification",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get notification() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notification(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onRemove() {
    		throw new Error("<DefaultNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onRemove(value) {
    		throw new Error("<DefaultNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    const isNotificationValid = notification => {
      if (!notification || !notification.text) return false;
      if (typeof notification.text !== 'string') return false;
      if (!positions.includes(notification.position)) return false;

      return true;
    };

    const addNotification = (notification, update) => {
      if (!isNotificationValid(notification)) throw new Error('Notification object is not valid');

      const {
        id = new Date().getTime(),
        removeAfter = +notification.removeAfter,
        ...rest
      } = notification;

      update((notifications) => {
        return [...notifications, {
          id,
          removeAfter,
          ...rest,
        }];
      });
    };

    const removeNotification = (notificationId, update) => update((notifications) => {
      return notifications.filter(n => n.id !== notificationId);
    });

    const clearNotifications = set => set([]);

    const createNotificationsStore = () => {
      const {
        subscribe,
        set,
        update,
      } = writable([]);

      return {
        subscribe,
        addNotification: notification => addNotification(notification, update),
        removeNotification: notificationId => removeNotification(notificationId, update),
        clearNotifications: () => clearNotifications(set),
      };
    };

    var store = createNotificationsStore();

    /* node_modules\svelte-notifications\src\components\Notifications.svelte generated by Svelte v3.19.1 */
    const file$1 = "node_modules\\svelte-notifications\\src\\components\\Notifications.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (71:8) {#if notification.position === position}
    function create_if_block(ctx) {
    	let current;

    	const notification = new Notification({
    			props: {
    				notification: /*notification*/ ctx[9],
    				withoutStyles: /*withoutStyles*/ ctx[1],
    				item: /*item*/ ctx[0] ? /*item*/ ctx[0] : DefaultNotification
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const notification_changes = {};
    			if (dirty & /*$store*/ 4) notification_changes.notification = /*notification*/ ctx[9];
    			if (dirty & /*withoutStyles*/ 2) notification_changes.withoutStyles = /*withoutStyles*/ ctx[1];
    			if (dirty & /*item*/ 1) notification_changes.item = /*item*/ ctx[0] ? /*item*/ ctx[0] : DefaultNotification;
    			notification.$set(notification_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(71:8) {#if notification.position === position}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {#each $store as notification (notification.id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*notification*/ ctx[9].position === /*position*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*notification*/ ctx[9].position === /*position*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(70:6) {#each $store as notification (notification.id)}",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#each positions as position}
    function create_each_block(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let div_class_value;
    	let current;
    	let each_value_1 = /*$store*/ ctx[2];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*notification*/ ctx[9].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*getClass*/ ctx[3](/*position*/ ctx[6])) + " svelte-7avcjj"));
    			add_location(div, file$1, 68, 4, 1447);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$store, withoutStyles, item, DefaultNotification, positions*/ 7) {
    				const each_value_1 = /*$store*/ ctx[2];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, outro_and_destroy_block, create_each_block_1, t, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(68:2) {#each positions as position}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let each_value = positions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "notifications");
    			add_location(div, file$1, 66, 0, 1383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 16) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    			}

    			if (dirty & /*getClass, positions, $store, withoutStyles, item, DefaultNotification*/ 15) {
    				each_value = positions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(2, $store = $$value));
    	let { item = null } = $$props;
    	let { withoutStyles = false } = $$props;

    	const getClass = (position = "") => {
    		const defaultPositionClass = ` default-position-style-${position}`;
    		return `position-${position}${withoutStyles ? "" : defaultPositionClass}`;
    	};

    	setContext(context, store);
    	const writable_props = ["item", "withoutStyles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notifications> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("withoutStyles" in $$props) $$invalidate(1, withoutStyles = $$props.withoutStyles);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		Notification,
    		DefaultNotification,
    		context,
    		store,
    		positions,
    		item,
    		withoutStyles,
    		getClass,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("withoutStyles" in $$props) $$invalidate(1, withoutStyles = $$props.withoutStyles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, withoutStyles, $store, getClass, $$scope, $$slots];
    }

    class Notifications extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0, withoutStyles: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notifications",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get item() {
    		throw new Error("<Notifications>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Notifications>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withoutStyles() {
    		throw new Error("<Notifications>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withoutStyles(value) {
    		throw new Error("<Notifications>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-simple-modal\src\Modal.svelte generated by Svelte v3.19.1 */

    const { Object: Object_1 } = globals;
    const file$2 = "node_modules\\svelte-simple-modal\\src\\Modal.svelte";

    // (201:2) {#if Component}
    function create_if_block$1(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let t;
    	let div0;
    	let div1_transition;
    	let div3_transition;
    	let current;
    	let dispose;
    	let if_block = /*state*/ ctx[0].closeButton && create_if_block_1(ctx);
    	const component_spread_levels = [/*props*/ ctx[2]];
    	let component_props = {};

    	for (let i = 0; i < component_spread_levels.length; i += 1) {
    		component_props = assign(component_props, component_spread_levels[i]);
    	}

    	const component = new /*Component*/ ctx[1]({ props: component_props, $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			create_component(component.$$.fragment);
    			attr_dev(div0, "class", "content svelte-fnsfcv");
    			attr_dev(div0, "style", /*cssContent*/ ctx[7]);
    			add_location(div0, file$2, 217, 10, 4876);
    			attr_dev(div1, "class", "window svelte-fnsfcv");
    			attr_dev(div1, "style", /*cssWindow*/ ctx[6]);
    			add_location(div1, file$2, 209, 8, 4612);
    			attr_dev(div2, "class", "window-wrap svelte-fnsfcv");
    			add_location(div2, file$2, 208, 6, 4561);
    			attr_dev(div3, "class", "bg svelte-fnsfcv");
    			attr_dev(div3, "style", /*cssBg*/ ctx[5]);
    			add_location(div3, file$2, 201, 4, 4381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			mount_component(component, div0, null);
    			/*div2_binding*/ ctx[31](div2);
    			/*div3_binding*/ ctx[32](div3);
    			current = true;
    			dispose = listen_dev(div3, "click", /*handleOuterClick*/ ctx[12], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*state*/ ctx[0].closeButton) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const component_changes = (dirty[0] & /*props*/ 4)
    			? get_spread_update(component_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			component.$set(component_changes);

    			if (!current || dirty[0] & /*cssContent*/ 128) {
    				attr_dev(div0, "style", /*cssContent*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*cssWindow*/ 64) {
    				attr_dev(div1, "style", /*cssWindow*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*cssBg*/ 32) {
    				attr_dev(div3, "style", /*cssBg*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(component.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[9], /*state*/ ctx[0].transitionWindowProps, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[8], /*state*/ ctx[0].transitionBgProps, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(component.$$.fragment, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[9], /*state*/ ctx[0].transitionWindowProps, false);
    			div1_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[8], /*state*/ ctx[0].transitionBgProps, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			destroy_component(component);
    			if (detaching && div1_transition) div1_transition.end();
    			/*div2_binding*/ ctx[31](null);
    			/*div3_binding*/ ctx[32](null);
    			if (detaching && div3_transition) div3_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(201:2) {#if Component}",
    		ctx
    	});

    	return block;
    }

    // (215:10) {#if state.closeButton}
    function create_if_block_1(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "close svelte-fnsfcv");
    			add_location(button, file$2, 215, 12, 4801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*close*/ ctx[10], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(215:10) {#if state.closeButton}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let current;
    	let dispose;
    	let if_block = /*Component*/ ctx[1] && create_if_block$1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[30].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[29], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-fnsfcv");
    			add_location(div, file$2, 199, 0, 4353);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    			dispose = listen_dev(window, "keyup", /*handleKeyup*/ ctx[11], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*Component*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty[0] & /*$$scope*/ 536870912) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[29], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[29], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { key = "simple-modal" } = $$props;
    	let { closeButton = true } = $$props;
    	let { closeOnEsc = true } = $$props;
    	let { closeOnOuterClick = true } = $$props;
    	let { styleBg = { top: 0, left: 0 } } = $$props;
    	let { styleWindow = {} } = $$props;
    	let { styleContent = {} } = $$props;
    	let { setContext: setContext$1 = setContext } = $$props;
    	let { transitionBg = fade } = $$props;
    	let { transitionBgProps = { duration: 250 } } = $$props;
    	let { transitionWindow = transitionBg } = $$props;
    	let { transitionWindowProps = transitionBgProps } = $$props;

    	const defaultState = {
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindow,
    		styleContent,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps
    	};

    	let state = { ...defaultState };
    	let Component = null;
    	let props = null;
    	let background;
    	let wrap;
    	const camelCaseToDash = str => str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
    	const toCssString = props => Object.keys(props).reduce((str, key) => `${str}; ${camelCaseToDash(key)}: ${props[key]}`, "");

    	const open = (NewComponent, newProps = {}, options = {}) => {
    		$$invalidate(1, Component = NewComponent);
    		$$invalidate(2, props = newProps);
    		$$invalidate(0, state = { ...defaultState, ...options });
    	};

    	const close = () => {
    		$$invalidate(1, Component = null);
    		$$invalidate(2, props = null);
    	};

    	const handleKeyup = ({ key }) => {
    		if (state.closeOnEsc && Component && key === "Escape") {
    			event.preventDefault();
    			close();
    		}
    	};

    	const handleOuterClick = event => {
    		if (state.closeOnOuterClick && (event.target === background || event.target === wrap)) {
    			event.preventDefault();
    			close();
    		}
    	};

    	setContext$1(key, { open, close });

    	const writable_props = [
    		"key",
    		"closeButton",
    		"closeOnEsc",
    		"closeOnOuterClick",
    		"styleBg",
    		"styleWindow",
    		"styleContent",
    		"setContext",
    		"transitionBg",
    		"transitionBgProps",
    		"transitionWindow",
    		"transitionWindowProps"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, wrap = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, background = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("key" in $$props) $$invalidate(13, key = $$props.key);
    		if ("closeButton" in $$props) $$invalidate(14, closeButton = $$props.closeButton);
    		if ("closeOnEsc" in $$props) $$invalidate(15, closeOnEsc = $$props.closeOnEsc);
    		if ("closeOnOuterClick" in $$props) $$invalidate(16, closeOnOuterClick = $$props.closeOnOuterClick);
    		if ("styleBg" in $$props) $$invalidate(17, styleBg = $$props.styleBg);
    		if ("styleWindow" in $$props) $$invalidate(18, styleWindow = $$props.styleWindow);
    		if ("styleContent" in $$props) $$invalidate(19, styleContent = $$props.styleContent);
    		if ("setContext" in $$props) $$invalidate(20, setContext$1 = $$props.setContext);
    		if ("transitionBg" in $$props) $$invalidate(21, transitionBg = $$props.transitionBg);
    		if ("transitionBgProps" in $$props) $$invalidate(22, transitionBgProps = $$props.transitionBgProps);
    		if ("transitionWindow" in $$props) $$invalidate(23, transitionWindow = $$props.transitionWindow);
    		if ("transitionWindowProps" in $$props) $$invalidate(24, transitionWindowProps = $$props.transitionWindowProps);
    		if ("$$scope" in $$props) $$invalidate(29, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		baseSetContext: setContext,
    		fade,
    		key,
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindow,
    		styleContent,
    		setContext: setContext$1,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps,
    		defaultState,
    		state,
    		Component,
    		props,
    		background,
    		wrap,
    		camelCaseToDash,
    		toCssString,
    		open,
    		close,
    		handleKeyup,
    		handleOuterClick,
    		Object,
    		cssBg,
    		cssWindow,
    		cssContent,
    		currentTransitionBg,
    		currentTransitionWindow,
    		event
    	});

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(13, key = $$props.key);
    		if ("closeButton" in $$props) $$invalidate(14, closeButton = $$props.closeButton);
    		if ("closeOnEsc" in $$props) $$invalidate(15, closeOnEsc = $$props.closeOnEsc);
    		if ("closeOnOuterClick" in $$props) $$invalidate(16, closeOnOuterClick = $$props.closeOnOuterClick);
    		if ("styleBg" in $$props) $$invalidate(17, styleBg = $$props.styleBg);
    		if ("styleWindow" in $$props) $$invalidate(18, styleWindow = $$props.styleWindow);
    		if ("styleContent" in $$props) $$invalidate(19, styleContent = $$props.styleContent);
    		if ("setContext" in $$props) $$invalidate(20, setContext$1 = $$props.setContext);
    		if ("transitionBg" in $$props) $$invalidate(21, transitionBg = $$props.transitionBg);
    		if ("transitionBgProps" in $$props) $$invalidate(22, transitionBgProps = $$props.transitionBgProps);
    		if ("transitionWindow" in $$props) $$invalidate(23, transitionWindow = $$props.transitionWindow);
    		if ("transitionWindowProps" in $$props) $$invalidate(24, transitionWindowProps = $$props.transitionWindowProps);
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("Component" in $$props) $$invalidate(1, Component = $$props.Component);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("background" in $$props) $$invalidate(3, background = $$props.background);
    		if ("wrap" in $$props) $$invalidate(4, wrap = $$props.wrap);
    		if ("cssBg" in $$props) $$invalidate(5, cssBg = $$props.cssBg);
    		if ("cssWindow" in $$props) $$invalidate(6, cssWindow = $$props.cssWindow);
    		if ("cssContent" in $$props) $$invalidate(7, cssContent = $$props.cssContent);
    		if ("currentTransitionBg" in $$props) $$invalidate(8, currentTransitionBg = $$props.currentTransitionBg);
    		if ("currentTransitionWindow" in $$props) $$invalidate(9, currentTransitionWindow = $$props.currentTransitionWindow);
    	};

    	let cssBg;
    	let cssWindow;
    	let cssContent;
    	let currentTransitionBg;
    	let currentTransitionWindow;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(5, cssBg = toCssString(state.styleBg));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(6, cssWindow = toCssString(state.styleWindow));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(7, cssContent = toCssString(state.styleContent));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(8, currentTransitionBg = state.transitionBg);
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(9, currentTransitionWindow = state.transitionWindow);
    		}
    	};

    	return [
    		state,
    		Component,
    		props,
    		background,
    		wrap,
    		cssBg,
    		cssWindow,
    		cssContent,
    		currentTransitionBg,
    		currentTransitionWindow,
    		close,
    		handleKeyup,
    		handleOuterClick,
    		key,
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindow,
    		styleContent,
    		setContext$1,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps,
    		defaultState,
    		camelCaseToDash,
    		toCssString,
    		open,
    		$$scope,
    		$$slots,
    		div2_binding,
    		div3_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				key: 13,
    				closeButton: 14,
    				closeOnEsc: 15,
    				closeOnOuterClick: 16,
    				styleBg: 17,
    				styleWindow: 18,
    				styleContent: 19,
    				setContext: 20,
    				transitionBg: 21,
    				transitionBgProps: 22,
    				transitionWindow: 23,
    				transitionWindowProps: 24
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get key() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeButton() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeButton(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnEsc() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnEsc(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnOuterClick() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnOuterClick(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleBg() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleBg(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleWindow() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleWindow(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleContent() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleContent(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setContext() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setContext(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionBg() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionBg(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionBgProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionBgProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionWindow() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionWindow(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionWindowProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionWindowProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const status = writable(null);
    const local_ip = writable(null);
    const local_pin = writable(null);

    const downloads_listing = writable(false);
    const downloads_data = writable([]);

    function decode_pin (pin){
      pin = pin.toUpperCase();
      pin = pin.replace(/A/g, "127.");
      pin = pin.replace(/B/g, "192.");
      pin = pin.replace(/C/g, "168.");
      pin = pin.replace(/D/g, "255");
      pin = pin.replace(/P/g, "10");
      pin = pin.replace(/R/g, "11");
      pin = pin.replace(/S/g, "12");
      pin = pin.replace(/T/g, "13");
      pin = pin.replace(/U/g, "14");
      pin = pin.replace(/V/g, "15");
      pin = pin.replace(/Y/g, "16");
      pin = pin.replace(/E/g, "0");
      pin = pin.replace(/F/g, "1");
      pin = pin.replace(/G/g, "2");
      pin = pin.replace(/H/g, "3");
      pin = pin.replace(/J/g, "4");
      pin = pin.replace(/K/g, "5");
      pin = pin.replace(/L/g, "6");
      pin = pin.replace(/M/g, "7");
      pin = pin.replace(/N/g, "8");
      pin = pin.replace(/O/g, "9");
      pin = pin.replace(/Z/g, ".");
      return pin;
    }

    function validate_ipv4 (ip) {
      const pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
      return pattern.test(ip) ? true : false 
    }

    function file_icon (file_name) {
      const parts = file_name.split(".");
      const extention = parts[parts.length - 1];
      const available_extentions = {
        txt: "txt.svg",
        pdf: "pdf.svg",
        html: "html.svg",
      };
      return available_extentions[extention]
        ? available_extentions[extention]
        : "file.svg";
    }

    /* src\ui\FileGet.svelte generated by Svelte v3.19.1 */
    const file$3 = "src\\ui\\FileGet.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*data*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*data*/ ctx[0].size + "";
    	let t3;
    	let t4;
    	let t5;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = text(" kb");
    			t5 = space();
    			img1 = element("img");
    			attr_dev(img0, "class", "file-icon svelte-6j46rv");
    			if (img0.src !== (img0_src_value = "img/file-icons/" + file_icon(/*data*/ ctx[0].name))) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "file-icon");
    			add_location(img0, file$3, 46, 2, 724);
    			attr_dev(p0, "class", "name svelte-6j46rv");
    			add_location(p0, file$3, 51, 4, 839);
    			attr_dev(p1, "class", "size svelte-6j46rv");
    			add_location(p1, file$3, 52, 4, 876);
    			add_location(div0, file$3, 50, 2, 828);
    			attr_dev(img1, "class", "download-icon svelte-6j46rv");
    			if (img1.src !== (img1_src_value = "img/download.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "download");
    			add_location(img1, file$3, 54, 2, 924);
    			attr_dev(div1, "class", "item svelte-6j46rv");
    			add_location(div1, file$3, 45, 0, 702);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, img1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && img0.src !== (img0_src_value = "img/file-icons/" + file_icon(/*data*/ ctx[0].name))) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].size + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FileGet> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data, file_icon });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class FileGet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileGet",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<FileGet> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<FileGet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<FileGet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-confirm\src\Confirm.svelte generated by Svelte v3.19.1 */
    const file$4 = "node_modules\\svelte-confirm\\src\\Confirm.svelte";
    const get_confirm_slot_changes = dirty => ({});
    const get_confirm_slot_context = ctx => ({ confirm: /*confirm*/ ctx[5] });
    const get_cancel_slot_changes = dirty => ({});
    const get_cancel_slot_context = ctx => ({ confirm: /*confirm*/ ctx[5] });
    const get_description_slot_changes = dirty => ({});
    const get_description_slot_context = ctx => ({ confirm: /*confirm*/ ctx[5] });
    const get_title_slot_changes = dirty => ({});
    const get_title_slot_context = ctx => ({ confirm: /*confirm*/ ctx[5] });
    const get_default_slot_changes = dirty => ({});
    const get_default_slot_context = ctx => ({ confirm: /*confirm*/ ctx[5] });

    // (26:0) {#if showDialog}
    function create_if_block$2(ctx) {
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t0;
    	let div3;
    	let div1;
    	let span0;
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4;
    	let div2;
    	let button0;
    	let t5;
    	let t6;
    	let button1;
    	let t7;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let dispose;
    	const title_slot_template = /*$$slots*/ ctx[8].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[7], get_title_slot_context);
    	const description_slot_template = /*$$slots*/ ctx[8].description;
    	const description_slot = create_slot(description_slot_template, ctx, /*$$scope*/ ctx[7], get_description_slot_context);
    	const cancel_slot_template = /*$$slots*/ ctx[8].cancel;
    	const cancel_slot = create_slot(cancel_slot_template, ctx, /*$$scope*/ ctx[7], get_cancel_slot_context);
    	const confirm_slot_template = /*$$slots*/ ctx[8].confirm;
    	const confirm_slot = create_slot(confirm_slot_template, ctx, /*$$scope*/ ctx[7], get_confirm_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span0 = element("span");

    			if (!title_slot) {
    				t1 = text("Are you sure you want to perform this action?");
    			}

    			if (title_slot) title_slot.c();
    			t2 = space();
    			span1 = element("span");

    			if (!description_slot) {
    				t3 = text("This action can't be undone!");
    			}

    			if (description_slot) description_slot.c();
    			t4 = space();
    			div2 = element("div");
    			button0 = element("button");

    			if (!cancel_slot) {
    				t5 = text(/*cancelTitle*/ ctx[2]);
    			}

    			if (cancel_slot) cancel_slot.c();
    			t6 = space();
    			button1 = element("button");

    			if (!confirm_slot) {
    				t7 = text(/*confirmTitle*/ ctx[1]);
    			}

    			if (confirm_slot) confirm_slot.c();
    			attr_dev(div0, "class", "overlay svelte-1rbwlp4");
    			add_location(div0, file$4, 26, 2, 519);
    			attr_dev(span0, "class", "message-title svelte-1rbwlp4");
    			add_location(span0, file$4, 44, 6, 846);
    			attr_dev(span1, "class", "message-description svelte-1rbwlp4");
    			add_location(span1, file$4, 49, 6, 995);
    			attr_dev(div1, "class", "message-section");
    			add_location(div1, file$4, 43, 4, 810);
    			attr_dev(button0, "class", "cancel-button svelte-1rbwlp4");
    			set_style(button0, "--cancel-btn-color", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 50%)");
    			set_style(button0, "--cancel-btn-color-hover", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 55%)");
    			add_location(button0, file$4, 59, 6, 1241);
    			attr_dev(button1, "class", "confirm-button svelte-1rbwlp4");
    			set_style(button1, "--confirm-btn-bg", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 50%)");
    			set_style(button1, "--confirm-btn-bg-hover", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 55%)");
    			add_location(button1, file$4, 71, 6, 1575);
    			attr_dev(div2, "class", "actions svelte-1rbwlp4");
    			set_style(div2, "background", "hsl(" + /*themeColor*/ ctx[0] + ", 30%, 97%)");
    			add_location(div2, file$4, 55, 4, 1148);
    			attr_dev(div3, "class", "confirm-dialog svelte-1rbwlp4");
    			add_location(div3, file$4, 31, 2, 637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, span0);

    			if (!title_slot) {
    				append_dev(span0, t1);
    			}

    			if (title_slot) {
    				title_slot.m(span0, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, span1);

    			if (!description_slot) {
    				append_dev(span1, t3);
    			}

    			if (description_slot) {
    				description_slot.m(span1, null);
    			}

    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button0);

    			if (!cancel_slot) {
    				append_dev(button0, t5);
    			}

    			if (cancel_slot) {
    				cancel_slot.m(button0, null);
    			}

    			append_dev(div2, t6);
    			append_dev(div2, button1);

    			if (!confirm_slot) {
    				append_dev(button1, t7);
    			}

    			if (confirm_slot) {
    				confirm_slot.m(button1, null);
    			}

    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(button1, "click", /*callFunction*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (title_slot && title_slot.p && dirty & /*$$scope*/ 128) {
    				title_slot.p(get_slot_context(title_slot_template, ctx, /*$$scope*/ ctx[7], get_title_slot_context), get_slot_changes(title_slot_template, /*$$scope*/ ctx[7], dirty, get_title_slot_changes));
    			}

    			if (description_slot && description_slot.p && dirty & /*$$scope*/ 128) {
    				description_slot.p(get_slot_context(description_slot_template, ctx, /*$$scope*/ ctx[7], get_description_slot_context), get_slot_changes(description_slot_template, /*$$scope*/ ctx[7], dirty, get_description_slot_changes));
    			}

    			if (!cancel_slot) {
    				if (!current || dirty & /*cancelTitle*/ 4) set_data_dev(t5, /*cancelTitle*/ ctx[2]);
    			}

    			if (cancel_slot && cancel_slot.p && dirty & /*$$scope*/ 128) {
    				cancel_slot.p(get_slot_context(cancel_slot_template, ctx, /*$$scope*/ ctx[7], get_cancel_slot_context), get_slot_changes(cancel_slot_template, /*$$scope*/ ctx[7], dirty, get_cancel_slot_changes));
    			}

    			if (!current || dirty & /*themeColor*/ 1) {
    				set_style(button0, "--cancel-btn-color", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 50%)");
    			}

    			if (!current || dirty & /*themeColor*/ 1) {
    				set_style(button0, "--cancel-btn-color-hover", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 55%)");
    			}

    			if (!confirm_slot) {
    				if (!current || dirty & /*confirmTitle*/ 2) set_data_dev(t7, /*confirmTitle*/ ctx[1]);
    			}

    			if (confirm_slot && confirm_slot.p && dirty & /*$$scope*/ 128) {
    				confirm_slot.p(get_slot_context(confirm_slot_template, ctx, /*$$scope*/ ctx[7], get_confirm_slot_context), get_slot_changes(confirm_slot_template, /*$$scope*/ ctx[7], dirty, get_confirm_slot_changes));
    			}

    			if (!current || dirty & /*themeColor*/ 1) {
    				set_style(button1, "--confirm-btn-bg", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 50%)");
    			}

    			if (!current || dirty & /*themeColor*/ 1) {
    				set_style(button1, "--confirm-btn-bg-hover", "hsl(" + /*themeColor*/ ctx[0] + ", 40%, 55%)");
    			}

    			if (!current || dirty & /*themeColor*/ 1) {
    				set_style(div2, "background", "hsl(" + /*themeColor*/ ctx[0] + ", 30%, 97%)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				if (!div0_intro) div0_intro = create_in_transition(div0, fade, { duration: 200 });
    				div0_intro.start();
    			});

    			transition_in(title_slot, local);
    			transition_in(description_slot, local);
    			transition_in(cancel_slot, local);
    			transition_in(confirm_slot, local);

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);
    				if (!div3_intro) div3_intro = create_in_transition(div3, fly, { y: -10, delay: 200, duration: 200 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, { delay: 200, duration: 200 });
    			transition_out(title_slot, local);
    			transition_out(description_slot, local);
    			transition_out(cancel_slot, local);
    			transition_out(confirm_slot, local);
    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fly, { y: -10, duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_outro) div0_outro.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			if (title_slot) title_slot.d(detaching);
    			if (description_slot) description_slot.d(detaching);
    			if (cancel_slot) cancel_slot.d(detaching);
    			if (confirm_slot) confirm_slot.d(detaching);
    			if (detaching && div3_outro) div3_outro.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:0) {#if showDialog}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context);
    	let if_block = /*showDialog*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 128) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes));
    			}

    			if (/*showDialog*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { themeColor = 200 } = $$props;
    	let { confirmTitle = "Confirm" } = $$props;
    	let { cancelTitle = "Cancel" } = $$props;
    	let showDialog = false;
    	let functionToCall = { func: null, args: null };

    	function callFunction() {
    		$$invalidate(3, showDialog = false);
    		functionToCall["func"](...functionToCall["args"]);
    	}

    	function confirm(func, ...args) {
    		functionToCall = { func, args };
    		$$invalidate(3, showDialog = true);
    	}

    	const writable_props = ["themeColor", "confirmTitle", "cancelTitle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Confirm> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler = () => $$invalidate(3, showDialog = false);

    	$$self.$set = $$props => {
    		if ("themeColor" in $$props) $$invalidate(0, themeColor = $$props.themeColor);
    		if ("confirmTitle" in $$props) $$invalidate(1, confirmTitle = $$props.confirmTitle);
    		if ("cancelTitle" in $$props) $$invalidate(2, cancelTitle = $$props.cancelTitle);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		themeColor,
    		confirmTitle,
    		cancelTitle,
    		showDialog,
    		functionToCall,
    		callFunction,
    		confirm
    	});

    	$$self.$inject_state = $$props => {
    		if ("themeColor" in $$props) $$invalidate(0, themeColor = $$props.themeColor);
    		if ("confirmTitle" in $$props) $$invalidate(1, confirmTitle = $$props.confirmTitle);
    		if ("cancelTitle" in $$props) $$invalidate(2, cancelTitle = $$props.cancelTitle);
    		if ("showDialog" in $$props) $$invalidate(3, showDialog = $$props.showDialog);
    		if ("functionToCall" in $$props) functionToCall = $$props.functionToCall;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		themeColor,
    		confirmTitle,
    		cancelTitle,
    		showDialog,
    		callFunction,
    		confirm,
    		functionToCall,
    		$$scope,
    		$$slots,
    		click_handler
    	];
    }

    class Confirm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			themeColor: 0,
    			confirmTitle: 1,
    			cancelTitle: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Confirm",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get themeColor() {
    		throw new Error("<Confirm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set themeColor(value) {
    		throw new Error("<Confirm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get confirmTitle() {
    		throw new Error("<Confirm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set confirmTitle(value) {
    		throw new Error("<Confirm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cancelTitle() {
    		throw new Error("<Confirm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cancelTitle(value) {
    		throw new Error("<Confirm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ui\Downloads.svelte generated by Svelte v3.19.1 */

    const { console: console_1 } = globals;
    const file$5 = "src\\ui\\Downloads.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (81:4) {#each $downloads_data as file_data}
    function create_each_block$1(ctx) {
    	let current;

    	const fileget = new FileGet({
    			props: { data: /*file_data*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(fileget.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fileget, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fileget_changes = {};
    			if (dirty & /*$downloads_data*/ 2) fileget_changes.data = /*file_data*/ ctx[4];
    			fileget.$set(fileget_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fileget.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fileget.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fileget, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(81:4) {#each $downloads_data as file_data}",
    		ctx
    	});

    	return block;
    }

    // (89:4) <span slot="title">
    function create_title_slot(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Are you sure?";
    			attr_dev(span, "slot", "title");
    			add_location(span, file$5, 88, 4, 1997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot.name,
    		type: "slot",
    		source: "(89:4) <span slot=\\\"title\\\">",
    		ctx
    	});

    	return block;
    }

    // (90:4) <span slot="description">
    function create_description_slot(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "If you confirm the connection will be canceled and the files will be lost.";
    			attr_dev(span, "slot", "description");
    			add_location(span, file$5, 89, 4, 2042);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_description_slot.name,
    		type: "slot",
    		source: "(90:4) <span slot=\\\"description\\\">",
    		ctx
    	});

    	return block;
    }

    // (85:2) <Confirm let:confirm={confirmThis} confirmTitle="End the Connection" cancelTitle="Keep">
    function create_default_slot(ctx) {
    	let p;
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "End the Connection";
    			t1 = space();
    			t2 = space();
    			attr_dev(p, "class", "cancel svelte-1dz4q8w");
    			add_location(p, file$5, 85, 4, 1899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);

    			dispose = listen_dev(
    				p,
    				"click",
    				function () {
    					if (is_function(/*confirmThis*/ ctx[3](/*onClickCancel*/ ctx[2]))) /*confirmThis*/ ctx[3](/*onClickCancel*/ ctx[2]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(85:2) <Confirm let:confirm={confirmThis} confirmTitle=\\\"End the Connection\\\" cancelTitle=\\\"Keep\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let t5;
    	let div2_transition;
    	let current;
    	let each_value = /*$downloads_data*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const confirm = new Confirm({
    			props: {
    				confirmTitle: "End the Connection",
    				cancelTitle: "Keep",
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ confirm: confirmThis }) => ({ 3: confirmThis }),
    						({ confirm: confirmThis }) => confirmThis ? 8 : 0
    					],
    					description: [
    						create_description_slot,
    						({ confirm: confirmThis }) => ({ 3: confirmThis }),
    						({ confirm: confirmThis }) => confirmThis ? 8 : 0
    					],
    					title: [
    						create_title_slot,
    						({ confirm: confirmThis }) => ({ 3: confirmThis }),
    						({ confirm: confirmThis }) => confirmThis ? 8 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("PIN:\r\n      ");
    			span = element("span");
    			t1 = text(/*pin*/ ctx[0]);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Download All";
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			create_component(confirm.$$.fragment);
    			attr_dev(span, "class", "svelte-1dz4q8w");
    			add_location(span, file$5, 75, 6, 1600);
    			attr_dev(p, "class", "svelte-1dz4q8w");
    			add_location(p, file$5, 73, 4, 1577);
    			attr_dev(button, "class", "svelte-1dz4q8w");
    			add_location(button, file$5, 77, 4, 1634);
    			attr_dev(div0, "class", "header svelte-1dz4q8w");
    			add_location(div0, file$5, 72, 2, 1551);
    			attr_dev(div1, "class", "downloads svelte-1dz4q8w");
    			add_location(div1, file$5, 79, 2, 1677);
    			attr_dev(div2, "class", "box svelte-1dz4q8w");
    			add_location(div2, file$5, 71, 0, 1513);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t5);
    			mount_component(confirm, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*pin*/ 1) set_data_dev(t1, /*pin*/ ctx[0]);

    			if (dirty & /*$downloads_data*/ 2) {
    				each_value = /*$downloads_data*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const confirm_changes = {};

    			if (dirty & /*$$scope, confirmThis*/ 136) {
    				confirm_changes.$$scope = { dirty, ctx };
    			}

    			confirm.$set(confirm_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(confirm.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(confirm.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(confirm);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $downloads_data;
    	validate_store(downloads_data, "downloads_data");
    	component_subscribe($$self, downloads_data, $$value => $$invalidate(1, $downloads_data = $$value));
    	let { pin } = $$props;

    	const onClickCancel = () => {
    		console.log("click");
    		downloads_listing.set(false);
    		downloads_data.set([]);
    	};

    	const writable_props = ["pin"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Downloads> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("pin" in $$props) $$invalidate(0, pin = $$props.pin);
    	};

    	$$self.$capture_state = () => ({
    		pin,
    		FileGet,
    		downloads_listing,
    		downloads_data,
    		Confirm,
    		scale,
    		onClickCancel,
    		console,
    		$downloads_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("pin" in $$props) $$invalidate(0, pin = $$props.pin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pin, $downloads_data, onClickCancel];
    }

    class Downloads extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { pin: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Downloads",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pin*/ ctx[0] === undefined && !("pin" in props)) {
    			console_1.warn("<Downloads> was created without expected prop 'pin'");
    		}
    	}

    	get pin() {
    		throw new Error("<Downloads>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pin(value) {
    		throw new Error("<Downloads>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ui\Get.svelte generated by Svelte v3.19.1 */
    const file$6 = "src\\ui\\Get.svelte";

    // (75:2) {:else}
    function create_else_block(ctx) {
    	let form;
    	let input;
    	let t;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*$status*/ ctx[2] == "online") return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			input = element("input");
    			t = space();
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control svelte-18lfqi9");
    			attr_dev(input, "placeholder", "Connection PIN");
    			input.required = true;
    			add_location(input, file$6, 76, 6, 1736);
    			attr_dev(form, "class", "svelte-18lfqi9");
    			add_location(form, file$6, 75, 4, 1697);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input);
    			set_input_value(input, /*pin*/ ctx[0]);
    			append_dev(form, t);
    			if_block.m(form, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(form, "submit", /*formOnSubmit*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pin*/ 1 && input.value !== /*pin*/ ctx[0]) {
    				set_input_value(input, /*pin*/ ctx[0]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#if $downloads_listing}
    function create_if_block$3(ctx) {
    	let current;

    	const downloads = new Downloads({
    			props: { pin: /*pin*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(downloads.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(downloads, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const downloads_changes = {};
    			if (dirty & /*pin*/ 1) downloads_changes.pin = /*pin*/ ctx[0];
    			downloads.$set(downloads_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(downloads.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(downloads.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(downloads, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(73:2) {#if $downloads_listing}",
    		ctx
    	});

    	return block;
    }

    // (85:6) {:else}
    function create_else_block_1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Connect";
    			attr_dev(button, "class", "btn");
    			button.disabled = true;
    			add_location(button, file$6, 85, 8, 1982);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(85:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:6) {#if $status == 'online'}
    function create_if_block_1$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Connect";
    			attr_dev(button, "class", "btn");
    			add_location(button, file$6, 83, 8, 1921);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(83:6) {#if $status == 'online'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let h3;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$downloads_listing*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Get Files";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "on computers or phones";
    			t3 = space();
    			if_block.c();
    			attr_dev(h2, "class", "title svelte-18lfqi9");
    			add_location(h2, file$6, 70, 2, 1560);
    			attr_dev(h3, "class", "svelte-18lfqi9");
    			add_location(h3, file$6, 71, 2, 1596);
    			attr_dev(div, "class", "box svelte-18lfqi9");
    			add_location(div, file$6, 69, 0, 1539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, h3);
    			append_dev(div, t3);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $downloads_listing;
    	let $status;
    	validate_store(downloads_listing, "downloads_listing");
    	component_subscribe($$self, downloads_listing, $$value => $$invalidate(1, $downloads_listing = $$value));
    	validate_store(status, "status");
    	component_subscribe($$self, status, $$value => $$invalidate(2, $status = $$value));
    	const { addNotification } = getNotificationsContext();
    	let pin;

    	const formOnSubmit = event => {
    		event.preventDefault();
    		const target_ip = decode_pin(pin);

    		if (validate_ipv4(target_ip)) {
    			downloads_listing.set(true);

    			downloads_data.set([
    				{ name: "kaynaklar.txt", size: 12 },
    				{ name: "Kitap.pdf", size: 832 },
    				{ name: "Kitap.html", size: 730 }
    			]);
    		} else {
    			addNotification({
    				text: "PIN is wrong",
    				type: "danger",
    				position: "bottom-left"
    			});
    		}
    	};

    	function input_input_handler() {
    		pin = this.value;
    		$$invalidate(0, pin);
    	}

    	$$self.$capture_state = () => ({
    		status,
    		downloads_listing,
    		downloads_data,
    		getNotificationsContext,
    		decode_pin,
    		validate_ipv4,
    		Downloads,
    		addNotification,
    		pin,
    		formOnSubmit,
    		$downloads_listing,
    		$status
    	});

    	$$self.$inject_state = $$props => {
    		if ("pin" in $$props) $$invalidate(0, pin = $$props.pin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pin,
    		$downloads_listing,
    		$status,
    		formOnSubmit,
    		addNotification,
    		input_input_handler
    	];
    }

    class Get extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Get",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\ui\QrCode.svelte generated by Svelte v3.19.1 */

    const file$7 = "src\\ui\\QrCode.svelte";

    function create_fragment$8(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*code*/ ctx[0]);
    			add_location(p, file$7, 4, 0, 43);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*code*/ 1) set_data_dev(t, /*code*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { code } = $$props;
    	const writable_props = ["code"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QrCode> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("code" in $$props) $$invalidate(0, code = $$props.code);
    	};

    	$$self.$capture_state = () => ({ code });

    	$$self.$inject_state = $$props => {
    		if ("code" in $$props) $$invalidate(0, code = $$props.code);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [code];
    }

    class QrCode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { code: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QrCode",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*code*/ ctx[0] === undefined && !("code" in props)) {
    			console.warn("<QrCode> was created without expected prop 'code'");
    		}
    	}

    	get code() {
    		throw new Error("<QrCode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<QrCode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ui\Send.svelte generated by Svelte v3.19.1 */
    const file$8 = "src\\ui\\Send.svelte";

    // (68:4) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (img.src !== (img_src_value = "img/camera.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "QR Code");
    			attr_dev(img, "class", "svelte-10rzeqo");
    			add_location(img, file$8, 69, 8, 1594);
    			attr_dev(button, "class", "btn");
    			button.disabled = true;
    			add_location(button, file$8, 68, 6, 1555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(68:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:4) {#if $local_ip}
    function create_if_block$4(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (img.src !== (img_src_value = "img/camera.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "QR Code");
    			attr_dev(img, "class", "svelte-10rzeqo");
    			add_location(img, file$8, 65, 8, 1475);
    			attr_dev(button, "class", "btn");
    			add_location(button, file$8, 64, 6, 1423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			dispose = listen_dev(button, "click", /*showQrCode*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(64:4) {#if $local_ip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let h3;
    	let t3;
    	let form;
    	let input;
    	let t4;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$local_ip*/ ctx[1]) return create_if_block$4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Send Files";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "to computers or phones";
    			t3 = space();
    			form = element("form");
    			input = element("input");
    			t4 = space();
    			if_block.c();
    			attr_dev(h2, "class", "title svelte-10rzeqo");
    			add_location(h2, file$8, 53, 2, 1161);
    			attr_dev(h3, "class", "svelte-10rzeqo");
    			add_location(h3, file$8, 54, 2, 1198);
    			attr_dev(input, "type", "text");
    			input.readOnly = true;
    			attr_dev(input, "class", "form-control svelte-10rzeqo");
    			attr_dev(input, "placeholder", "Your PIN");
    			input.required = true;
    			add_location(input, file$8, 56, 4, 1245);
    			attr_dev(form, "class", "svelte-10rzeqo");
    			add_location(form, file$8, 55, 2, 1233);
    			attr_dev(div, "class", "box svelte-10rzeqo");
    			add_location(div, file$8, 52, 0, 1140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, h3);
    			append_dev(div, t3);
    			append_dev(div, form);
    			append_dev(form, input);
    			set_input_value(input, /*$local_pin*/ ctx[0]);
    			append_dev(form, t4);
    			if_block.m(form, null);
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$local_pin*/ 1 && input.value !== /*$local_pin*/ ctx[0]) {
    				set_input_value(input, /*$local_pin*/ ctx[0]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $local_pin;
    	let $local_ip;
    	validate_store(local_pin, "local_pin");
    	component_subscribe($$self, local_pin, $$value => $$invalidate(0, $local_pin = $$value));
    	validate_store(local_ip, "local_ip");
    	component_subscribe($$self, local_ip, $$value => $$invalidate(1, $local_ip = $$value));
    	const { addNotification } = getNotificationsContext();
    	const { open } = getContext("simple-modal");

    	const showQrCode = event => {
    		event.preventDefault();
    		open(QrCode, { code: "12345" });
    	};

    	function input_input_handler() {
    		$local_pin = this.value;
    		local_pin.set($local_pin);
    	}

    	$$self.$capture_state = () => ({
    		status,
    		local_ip,
    		local_pin,
    		getNotificationsContext,
    		getContext,
    		Downloads,
    		addNotification,
    		QrCode,
    		open,
    		showQrCode,
    		$local_pin,
    		$local_ip
    	});

    	return [$local_pin, $local_ip, showQrCode, addNotification, open, input_input_handler];
    }

    class Send extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Send",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    function encode_pin (ip){
      ip = ip.toUpperCase();
      ip = ip.replace(/127./g, "A");
      ip = ip.replace(/192./g, "B");
      ip = ip.replace(/168./g, "C");
      ip = ip.replace(/255/g, "D");
      ip = ip.replace(/10/g, "P");
      ip = ip.replace(/11/g, "R");
      ip = ip.replace(/12/g, "S");
      ip = ip.replace(/13/g, "T");
      ip = ip.replace(/14/g, "U");
      ip = ip.replace(/15/g, "V");
      ip = ip.replace(/16/g, "Y");
      ip = ip.replace(/0/g, "E");
      ip = ip.replace(/1/g, "F");
      ip = ip.replace(/2/g, "G");
      ip = ip.replace(/3/g, "H");
      ip = ip.replace(/4/g, "J");
      ip = ip.replace(/5/g, "K");
      ip = ip.replace(/6/g, "L");
      ip = ip.replace(/7/g, "M");
      ip = ip.replace(/8/g, "N");
      ip = ip.replace(/9/g, "O");
      ip = ip.replace(/\./g, "Z");
      return ip;
    }

    /* src\ui\Error.svelte generated by Svelte v3.19.1 */

    const { Error: Error_1 } = globals;
    const file$9 = "src\\ui\\Error.svelte";

    // (56:0) {#if $status == 'offline'}
    function create_if_block$5(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let span;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(/*message*/ ctx[0]);
    			t1 = space();
    			span = element("span");
    			span.textContent = "try again";
    			attr_dev(span, "class", "svelte-hc68bi");
    			add_location(span, file$9, 59, 6, 1442);
    			attr_dev(p, "class", "svelte-hc68bi");
    			add_location(p, file$9, 57, 4, 1414);
    			attr_dev(div, "class", "error svelte-hc68bi");
    			add_location(div, file$9, 56, 2, 1389);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, span);
    			dispose = listen_dev(span, "click", /*tryAgain*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) set_data_dev(t0, /*message*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(56:0) {#if $status == 'offline'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*$status*/ ctx[1] == "offline" && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$status*/ ctx[1] == "offline") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $status;
    	validate_store(status, "status");
    	component_subscribe($$self, status, $$value => $$invalidate(1, $status = $$value));
    	const { addNotification } = getNotificationsContext();
    	let { message } = $$props;
    	const { ipcRenderer } = require("electron");

    	ipcRenderer.on("network-status", (event, arg) => {
    		status.set(arg.status);

    		if (arg.ipAddress) {
    			if (validate_ipv4(arg.ipAddress)) {
    				local_ip.set(arg.ipAddress);
    				const pin_code = encode_pin(arg.ipAddress);
    				local_pin.set(pin_code);
    			} else {
    				addNotification({
    					text: "Your local IP is wrong",
    					type: "danger",
    					position: "bottom-left"
    				});
    			}
    		}
    	});

    	const tryAgain = () => {
    		ipcRenderer.send("network-status-check");
    	};

    	const writable_props = ["message"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	$$self.$capture_state = () => ({
    		status,
    		local_ip,
    		local_pin,
    		getNotificationsContext,
    		encode_pin,
    		validate_ipv4,
    		addNotification,
    		message,
    		ipcRenderer,
    		tryAgain,
    		require,
    		$status
    	});

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, $status, tryAgain];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { message: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Error> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error_1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error_1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ui\App.svelte generated by Svelte v3.19.1 */

    const { Error: Error_1$1 } = globals;
    const file$a = "src\\ui\\App.svelte";

    // (18:2) <Notifications>
    function create_default_slot_1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;

    	const error = new Error$1({
    			props: {
    				message: "no network connection available"
    			},
    			$$inline: true
    		});

    	const get = new Get({ $$inline: true });
    	const send = new Send({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(error.$$.fragment);
    			t0 = space();
    			create_component(get.$$.fragment);
    			t1 = space();
    			create_component(send.$$.fragment);
    			attr_dev(div, "class", "page svelte-1a06vv4");
    			add_location(div, file$a, 18, 4, 358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(error, div, null);
    			append_dev(div, t0);
    			mount_component(get, div, null);
    			append_dev(div, t1);
    			mount_component(send, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(error.$$.fragment, local);
    			transition_in(get.$$.fragment, local);
    			transition_in(send.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(error.$$.fragment, local);
    			transition_out(get.$$.fragment, local);
    			transition_out(send.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(error);
    			destroy_component(get);
    			destroy_component(send);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(18:2) <Notifications>",
    		ctx
    	});

    	return block;
    }

    // (17:0) <Modal>
    function create_default_slot$1(ctx) {
    	let current;

    	const notifications = new Notifications({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notifications.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notifications, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const notifications_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				notifications_changes.$$scope = { dirty, ctx };
    			}

    			notifications.$set(notifications_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notifications.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notifications.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notifications, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(17:0) <Modal>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Notifications, Modal, Get, Send, Error: Error$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

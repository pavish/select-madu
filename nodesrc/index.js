(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SelectMadu = factory());
}(this, (function () { 'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    function not_equal(a, b) {
        return a != a ? b == b : a !== b;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_input_type(input, type) {
        try {
            input.type = type;
        }
        catch (e) {
            // do nothing
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
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
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
            set_current_component(null);
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
            if (running_program || pending_program) {
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function getBoundingClientRect(element) {
      var rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        x: rect.left,
        y: rect.top
      };
    }

    function getWindow(node) {
      if (node == null) {
        return window;
      }

      if (node.toString() !== '[object Window]') {
        var ownerDocument = node.ownerDocument;
        return ownerDocument ? ownerDocument.defaultView || window : window;
      }

      return node;
    }

    function getWindowScroll(node) {
      var win = getWindow(node);
      var scrollLeft = win.pageXOffset;
      var scrollTop = win.pageYOffset;
      return {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop
      };
    }

    function isElement(node) {
      var OwnElement = getWindow(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    }

    function isHTMLElement(node) {
      var OwnElement = getWindow(node).HTMLElement;
      return node instanceof OwnElement || node instanceof HTMLElement;
    }

    function isShadowRoot(node) {
      // IE 11 has no ShadowRoot
      if (typeof ShadowRoot === 'undefined') {
        return false;
      }

      var OwnElement = getWindow(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }

    function getHTMLElementScroll(element) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }

    function getNodeScroll(node) {
      if (node === getWindow(node) || !isHTMLElement(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    }

    function getNodeName(element) {
      return element ? (element.nodeName || '').toLowerCase() : null;
    }

    function getDocumentElement(element) {
      // $FlowFixMe[incompatible-return]: assume body is always available
      return ((isElement(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
      element.document) || window.document).documentElement;
    }

    function getWindowScrollBarX(element) {
      // If <html> has a CSS width greater than the viewport, then this will be
      // incorrect for RTL.
      // Popper 1 is broken in this case and never had a bug report so let's assume
      // it's not an issue. I don't think anyone ever specifies width on <html>
      // anyway.
      // Browsers where the left scrollbar doesn't cause an issue report `0` for
      // this (e.g. Edge 2019, IE11, Safari)
      return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
    }

    function getComputedStyle(element) {
      return getWindow(element).getComputedStyle(element);
    }

    function isScrollParent(element) {
      // Firefox wants us to check `-x` and `-y` variations as well
      var _getComputedStyle = getComputedStyle(element),
          overflow = _getComputedStyle.overflow,
          overflowX = _getComputedStyle.overflowX,
          overflowY = _getComputedStyle.overflowY;

      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }

    // Composite means it takes into account transforms as well as layout.

    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }

      var documentElement = getDocumentElement(offsetParent);
      var rect = getBoundingClientRect(elementOrVirtualElement);
      var isOffsetParentAnElement = isHTMLElement(offsetParent);
      var scroll = {
        scrollLeft: 0,
        scrollTop: 0
      };
      var offsets = {
        x: 0,
        y: 0
      };

      if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
        isScrollParent(documentElement)) {
          scroll = getNodeScroll(offsetParent);
        }

        if (isHTMLElement(offsetParent)) {
          offsets = getBoundingClientRect(offsetParent);
          offsets.x += offsetParent.clientLeft;
          offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
          offsets.x = getWindowScrollBarX(documentElement);
        }
      }

      return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
      };
    }

    // means it doesn't take into account transforms.

    function getLayoutRect(element) {
      var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
      // Fixes https://github.com/popperjs/popper-core/issues/1223

      var width = element.offsetWidth;
      var height = element.offsetHeight;

      if (Math.abs(clientRect.width - width) <= 1) {
        width = clientRect.width;
      }

      if (Math.abs(clientRect.height - height) <= 1) {
        height = clientRect.height;
      }

      return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: width,
        height: height
      };
    }

    function getParentNode(element) {
      if (getNodeName(element) === 'html') {
        return element;
      }

      return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
        // $FlowFixMe[incompatible-return]
        // $FlowFixMe[prop-missing]
        element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
        element.parentNode || ( // DOM Element detected
        isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
        // $FlowFixMe[incompatible-call]: HTMLElement is a Node
        getDocumentElement(element) // fallback

      );
    }

    function getScrollParent(node) {
      if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
        // $FlowFixMe[incompatible-return]: assume body is always available
        return node.ownerDocument.body;
      }

      if (isHTMLElement(node) && isScrollParent(node)) {
        return node;
      }

      return getScrollParent(getParentNode(node));
    }

    /*
    given a DOM element, return the list of all scroll parents, up the list of ancesors
    until we get to the top window object. This list is what we attach scroll listeners
    to, because if any of these parent elements scroll, we'll need to re-calculate the
    reference element's position.
    */

    function listScrollParents(element, list) {
      var _element$ownerDocumen;

      if (list === void 0) {
        list = [];
      }

      var scrollParent = getScrollParent(element);
      var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
      var win = getWindow(scrollParent);
      var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
      var updatedList = list.concat(target);
      return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)));
    }

    function isTableElement(element) {
      return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
    }

    function getTrueOffsetParent(element) {
      if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
      getComputedStyle(element).position === 'fixed') {
        return null;
      }

      return element.offsetParent;
    } // `.offsetParent` reports `null` for fixed elements, while absolute elements
    // return the containing block


    function getContainingBlock(element) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
      var currentNode = getParentNode(element);

      while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
        var css = getComputedStyle(currentNode); // This is non-exhaustive but covers the most common CSS properties that
        // create a containing block.
        // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

        if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
          return currentNode;
        } else {
          currentNode = currentNode.parentNode;
        }
      }

      return null;
    } // Gets the closest ancestor positioned element. Handles some edge cases,
    // such as table ancestors and cross browser bugs.


    function getOffsetParent(element) {
      var window = getWindow(element);
      var offsetParent = getTrueOffsetParent(element);

      while (offsetParent && isTableElement(offsetParent) && getComputedStyle(offsetParent).position === 'static') {
        offsetParent = getTrueOffsetParent(offsetParent);
      }

      if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle(offsetParent).position === 'static')) {
        return window;
      }

      return offsetParent || getContainingBlock(element) || window;
    }

    var top = 'top';
    var bottom = 'bottom';
    var right = 'right';
    var left = 'left';
    var start = 'start';
    var end = 'end';

    var beforeRead = 'beforeRead';
    var read = 'read';
    var afterRead = 'afterRead'; // pure-logic modifiers

    var beforeMain = 'beforeMain';
    var main = 'main';
    var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

    var beforeWrite = 'beforeWrite';
    var write = 'write';
    var afterWrite = 'afterWrite';
    var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

    function order(modifiers) {
      var map = new Map();
      var visited = new Set();
      var result = [];
      modifiers.forEach(function (modifier) {
        map.set(modifier.name, modifier);
      }); // On visiting object, check for its dependencies and visit them recursively

      function sort(modifier) {
        visited.add(modifier.name);
        var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
        requires.forEach(function (dep) {
          if (!visited.has(dep)) {
            var depModifier = map.get(dep);

            if (depModifier) {
              sort(depModifier);
            }
          }
        });
        result.push(modifier);
      }

      modifiers.forEach(function (modifier) {
        if (!visited.has(modifier.name)) {
          // check for visited object
          sort(modifier);
        }
      });
      return result;
    }

    function orderModifiers(modifiers) {
      // order based on dependencies
      var orderedModifiers = order(modifiers); // order based on phase

      return modifierPhases.reduce(function (acc, phase) {
        return acc.concat(orderedModifiers.filter(function (modifier) {
          return modifier.phase === phase;
        }));
      }, []);
    }

    function debounce(fn) {
      var pending;
      return function () {
        if (!pending) {
          pending = new Promise(function (resolve) {
            Promise.resolve().then(function () {
              pending = undefined;
              resolve(fn());
            });
          });
        }

        return pending;
      };
    }

    function getBasePlacement(placement) {
      return placement.split('-')[0];
    }

    function mergeByName(modifiers) {
      var merged = modifiers.reduce(function (merged, current) {
        var existing = merged[current.name];
        merged[current.name] = existing ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data)
        }) : current;
        return merged;
      }, {}); // IE11 does not support Object.values

      return Object.keys(merged).map(function (key) {
        return merged[key];
      });
    }

    var round = Math.round;

    function getVariation(placement) {
      return placement.split('-')[1];
    }

    function getMainAxisFromPlacement(placement) {
      return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
    }

    function computeOffsets(_ref) {
      var reference = _ref.reference,
          element = _ref.element,
          placement = _ref.placement;
      var basePlacement = placement ? getBasePlacement(placement) : null;
      var variation = placement ? getVariation(placement) : null;
      var commonX = reference.x + reference.width / 2 - element.width / 2;
      var commonY = reference.y + reference.height / 2 - element.height / 2;
      var offsets;

      switch (basePlacement) {
        case top:
          offsets = {
            x: commonX,
            y: reference.y - element.height
          };
          break;

        case bottom:
          offsets = {
            x: commonX,
            y: reference.y + reference.height
          };
          break;

        case right:
          offsets = {
            x: reference.x + reference.width,
            y: commonY
          };
          break;

        case left:
          offsets = {
            x: reference.x - element.width,
            y: commonY
          };
          break;

        default:
          offsets = {
            x: reference.x,
            y: reference.y
          };
      }

      var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

      if (mainAxis != null) {
        var len = mainAxis === 'y' ? 'height' : 'width';

        switch (variation) {
          case start:
            offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
            break;

          case end:
            offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
            break;
        }
      }

      return offsets;
    }

    var DEFAULT_OPTIONS = {
      placement: 'bottom',
      modifiers: [],
      strategy: 'absolute'
    };

    function areValidElements() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return !args.some(function (element) {
        return !(element && typeof element.getBoundingClientRect === 'function');
      });
    }

    function popperGenerator(generatorOptions) {
      if (generatorOptions === void 0) {
        generatorOptions = {};
      }

      var _generatorOptions = generatorOptions,
          _generatorOptions$def = _generatorOptions.defaultModifiers,
          defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
          _generatorOptions$def2 = _generatorOptions.defaultOptions,
          defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
      return function createPopper(reference, popper, options) {
        if (options === void 0) {
          options = defaultOptions;
        }

        var state = {
          placement: 'bottom',
          orderedModifiers: [],
          options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
          modifiersData: {},
          elements: {
            reference: reference,
            popper: popper
          },
          attributes: {},
          styles: {}
        };
        var effectCleanupFns = [];
        var isDestroyed = false;
        var instance = {
          state: state,
          setOptions: function setOptions(options) {
            cleanupModifierEffects();
            state.options = Object.assign({}, defaultOptions, state.options, options);
            state.scrollParents = {
              reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
              popper: listScrollParents(popper)
            }; // Orders the modifiers based on their dependencies and `phase`
            // properties

            var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

            state.orderedModifiers = orderedModifiers.filter(function (m) {
              return m.enabled;
            }); // Validate the provided modifiers so that the consumer will get warned

            runModifierEffects();
            return instance.update();
          },
          // Sync update – it will always be executed, even if not necessary. This
          // is useful for low frequency updates where sync behavior simplifies the
          // logic.
          // For high frequency updates (e.g. `resize` and `scroll` events), always
          // prefer the async Popper#update method
          forceUpdate: function forceUpdate() {
            if (isDestroyed) {
              return;
            }

            var _state$elements = state.elements,
                reference = _state$elements.reference,
                popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
            // anymore

            if (!areValidElements(reference, popper)) {

              return;
            } // Store the reference and popper rects to be read by modifiers


            state.rects = {
              reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
              popper: getLayoutRect(popper)
            }; // Modifiers have the ability to reset the current update cycle. The
            // most common use case for this is the `flip` modifier changing the
            // placement, which then needs to re-run all the modifiers, because the
            // logic was previously ran for the previous placement and is therefore
            // stale/incorrect

            state.reset = false;
            state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
            // is filled with the initial data specified by the modifier. This means
            // it doesn't persist and is fresh on each update.
            // To ensure persistent data, use `${name}#persistent`

            state.orderedModifiers.forEach(function (modifier) {
              return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
            });

            for (var index = 0; index < state.orderedModifiers.length; index++) {

              if (state.reset === true) {
                state.reset = false;
                index = -1;
                continue;
              }

              var _state$orderedModifie = state.orderedModifiers[index],
                  fn = _state$orderedModifie.fn,
                  _state$orderedModifie2 = _state$orderedModifie.options,
                  _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
                  name = _state$orderedModifie.name;

              if (typeof fn === 'function') {
                state = fn({
                  state: state,
                  options: _options,
                  name: name,
                  instance: instance
                }) || state;
              }
            }
          },
          // Async and optimistically optimized update – it will not be executed if
          // not necessary (debounced to run at most once-per-tick)
          update: debounce(function () {
            return new Promise(function (resolve) {
              instance.forceUpdate();
              resolve(state);
            });
          }),
          destroy: function destroy() {
            cleanupModifierEffects();
            isDestroyed = true;
          }
        };

        if (!areValidElements(reference, popper)) {

          return instance;
        }

        instance.setOptions(options).then(function (state) {
          if (!isDestroyed && options.onFirstUpdate) {
            options.onFirstUpdate(state);
          }
        }); // Modifiers have the ability to execute arbitrary code before the first
        // update cycle runs. They will be executed in the same order as the update
        // cycle. This is useful when a modifier adds some persistent data that
        // other modifiers need to use, but the modifier is run after the dependent
        // one.

        function runModifierEffects() {
          state.orderedModifiers.forEach(function (_ref3) {
            var name = _ref3.name,
                _ref3$options = _ref3.options,
                options = _ref3$options === void 0 ? {} : _ref3$options,
                effect = _ref3.effect;

            if (typeof effect === 'function') {
              var cleanupFn = effect({
                state: state,
                name: name,
                instance: instance,
                options: options
              });

              var noopFn = function noopFn() {};

              effectCleanupFns.push(cleanupFn || noopFn);
            }
          });
        }

        function cleanupModifierEffects() {
          effectCleanupFns.forEach(function (fn) {
            return fn();
          });
          effectCleanupFns = [];
        }

        return instance;
      };
    }

    var passive = {
      passive: true
    };

    function effect(_ref) {
      var state = _ref.state,
          instance = _ref.instance,
          options = _ref.options;
      var _options$scroll = options.scroll,
          scroll = _options$scroll === void 0 ? true : _options$scroll,
          _options$resize = options.resize,
          resize = _options$resize === void 0 ? true : _options$resize;
      var window = getWindow(state.elements.popper);
      var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.addEventListener('scroll', instance.update, passive);
        });
      }

      if (resize) {
        window.addEventListener('resize', instance.update, passive);
      }

      return function () {
        if (scroll) {
          scrollParents.forEach(function (scrollParent) {
            scrollParent.removeEventListener('scroll', instance.update, passive);
          });
        }

        if (resize) {
          window.removeEventListener('resize', instance.update, passive);
        }
      };
    } // eslint-disable-next-line import/no-unused-modules


    var eventListeners = {
      name: 'eventListeners',
      enabled: true,
      phase: 'write',
      fn: function fn() {},
      effect: effect,
      data: {}
    };

    function popperOffsets(_ref) {
      var state = _ref.state,
          name = _ref.name;
      // Offsets are the actual position the popper needs to have to be
      // properly positioned near its reference element
      // This is the most basic placement, and will be adjusted by
      // the modifiers in the next step
      state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        strategy: 'absolute',
        placement: state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var popperOffsets$1 = {
      name: 'popperOffsets',
      enabled: true,
      phase: 'read',
      fn: popperOffsets,
      data: {}
    };

    var unsetSides = {
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto'
    }; // Round the offsets to the nearest suitable subpixel based on the DPR.
    // Zooming can change the DPR, but it seems to report a value that will
    // cleanly divide the values into the appropriate subpixels.

    function roundOffsetsByDPR(_ref) {
      var x = _ref.x,
          y = _ref.y;
      var win = window;
      var dpr = win.devicePixelRatio || 1;
      return {
        x: round(round(x * dpr) / dpr) || 0,
        y: round(round(y * dpr) / dpr) || 0
      };
    }

    function mapToStyles(_ref2) {
      var _Object$assign2;

      var popper = _ref2.popper,
          popperRect = _ref2.popperRect,
          placement = _ref2.placement,
          offsets = _ref2.offsets,
          position = _ref2.position,
          gpuAcceleration = _ref2.gpuAcceleration,
          adaptive = _ref2.adaptive,
          roundOffsets = _ref2.roundOffsets;

      var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === 'function' ? roundOffsets(offsets) : offsets,
          _ref3$x = _ref3.x,
          x = _ref3$x === void 0 ? 0 : _ref3$x,
          _ref3$y = _ref3.y,
          y = _ref3$y === void 0 ? 0 : _ref3$y;

      var hasX = offsets.hasOwnProperty('x');
      var hasY = offsets.hasOwnProperty('y');
      var sideX = left;
      var sideY = top;
      var win = window;

      if (adaptive) {
        var offsetParent = getOffsetParent(popper);
        var heightProp = 'clientHeight';
        var widthProp = 'clientWidth';

        if (offsetParent === getWindow(popper)) {
          offsetParent = getDocumentElement(popper);

          if (getComputedStyle(offsetParent).position !== 'static') {
            heightProp = 'scrollHeight';
            widthProp = 'scrollWidth';
          }
        } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


        offsetParent = offsetParent;

        if (placement === top) {
          sideY = bottom; // $FlowFixMe[prop-missing]

          y -= offsetParent[heightProp] - popperRect.height;
          y *= gpuAcceleration ? 1 : -1;
        }

        if (placement === left) {
          sideX = right; // $FlowFixMe[prop-missing]

          x -= offsetParent[widthProp] - popperRect.width;
          x *= gpuAcceleration ? 1 : -1;
        }
      }

      var commonStyles = Object.assign({
        position: position
      }, adaptive && unsetSides);

      if (gpuAcceleration) {
        var _Object$assign;

        return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) < 2 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
      }

      return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
    }

    function computeStyles(_ref4) {
      var state = _ref4.state,
          options = _ref4.options;
      var _options$gpuAccelerat = options.gpuAcceleration,
          gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
          _options$adaptive = options.adaptive,
          adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
          _options$roundOffsets = options.roundOffsets,
          roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

      var commonStyles = {
        placement: getBasePlacement(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration: gpuAcceleration
      };

      if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive: adaptive,
          roundOffsets: roundOffsets
        })));
      }

      if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: 'absolute',
          adaptive: false,
          roundOffsets: roundOffsets
        })));
      }

      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        'data-popper-placement': state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var computeStyles$1 = {
      name: 'computeStyles',
      enabled: true,
      phase: 'beforeWrite',
      fn: computeStyles,
      data: {}
    };

    // and applies them to the HTMLElements such as popper and arrow

    function applyStyles(_ref) {
      var state = _ref.state;
      Object.keys(state.elements).forEach(function (name) {
        var style = state.styles[name] || {};
        var attributes = state.attributes[name] || {};
        var element = state.elements[name]; // arrow is optional + virtual elements

        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        } // Flow doesn't support to extend this property, but it's the most
        // effective way to apply styles to an HTMLElement
        // $FlowFixMe[cannot-write]


        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (name) {
          var value = attributes[name];

          if (value === false) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value === true ? '' : value);
          }
        });
      });
    }

    function effect$1(_ref2) {
      var state = _ref2.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: '0',
          top: '0',
          margin: '0'
        },
        arrow: {
          position: 'absolute'
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;

      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      }

      return function () {
        Object.keys(state.elements).forEach(function (name) {
          var element = state.elements[name];
          var attributes = state.attributes[name] || {};
          var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

          var style = styleProperties.reduce(function (style, property) {
            style[property] = '';
            return style;
          }, {}); // arrow is optional + virtual elements

          if (!isHTMLElement(element) || !getNodeName(element)) {
            return;
          }

          Object.assign(element.style, style);
          Object.keys(attributes).forEach(function (attribute) {
            element.removeAttribute(attribute);
          });
        });
      };
    } // eslint-disable-next-line import/no-unused-modules


    var applyStyles$1 = {
      name: 'applyStyles',
      enabled: true,
      phase: 'write',
      fn: applyStyles,
      effect: effect$1,
      requires: ['computeStyles']
    };

    var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1];
    var createPopper = /*#__PURE__*/popperGenerator({
      defaultModifiers: defaultModifiers
    }); // eslint-disable-next-line import/no-unused-modules

    var States;
    (function (States) {
        States["Loading"] = "Loading";
        States["Ready"] = "Ready";
        States["Error"] = "Error";
    })(States || (States = {}));

    /* src/newcomponents/OptionElement.svelte generated by Svelte v3.32.3 */

    function create_else_block(ctx) {
    	let li;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*optionComponent*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			li = element("li");
    			if_block.c();
    			attr(li, "class", /*classes*/ ctx[4]);
    			set_style(li, "position", "relative");
    			attr(li, "role", "option");
    			attr(li, "aria-selected", /*isSelectedOption*/ ctx[3]);
    			toggle_class(li, "disabled", /*option*/ ctx[0].disabled);
    			toggle_class(li, "selected", /*isSelectedOption*/ ctx[3]);
    			toggle_class(li, "hovered", /*isSelectedOption*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			if_blocks[current_block_type_index].m(li, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(li, "click", /*selectOption*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(li, null);
    			}

    			if (!current || dirty & /*classes*/ 16) {
    				attr(li, "class", /*classes*/ ctx[4]);
    			}

    			if (!current || dirty & /*isSelectedOption*/ 8) {
    				attr(li, "aria-selected", /*isSelectedOption*/ ctx[3]);
    			}

    			if (dirty & /*classes, option*/ 17) {
    				toggle_class(li, "disabled", /*option*/ ctx[0].disabled);
    			}

    			if (dirty & /*classes, isSelectedOption*/ 24) {
    				toggle_class(li, "selected", /*isSelectedOption*/ ctx[3]);
    			}

    			if (dirty & /*classes, isSelectedOption*/ 24) {
    				toggle_class(li, "hovered", /*isSelectedOption*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (46:0) {#if option[keys.child]}
    function create_if_block(ctx) {
    	let li;
    	let strong;
    	let t0_value = /*option*/ ctx[0][/*keys*/ ctx[2].text] + "";
    	let t0;
    	let t1;
    	let ul;
    	let li_aria_label_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	return {
    		c() {
    			li = element("li");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			attr(ul, "role", "none");
    			set_style(ul, "margin", "0");
    			set_style(ul, "list-style", "none");
    			set_style(ul, "padding", "0");
    			set_style(ul, "position", "relative");
    			attr(li, "class", /*classes*/ ctx[4]);
    			attr(li, "role", "group");
    			set_style(li, "position", "relative");
    			attr(li, "aria-label", li_aria_label_value = /*option*/ ctx[0][/*keys*/ ctx[2].text]);
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, strong);
    			append(strong, t0);
    			append(li, t1);
    			append(li, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty & /*option, keys*/ 5) && t0_value !== (t0_value = /*option*/ ctx[0][/*keys*/ ctx[2].text] + "")) set_data(t0, t0_value);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*classes*/ 16) {
    				attr(li, "class", /*classes*/ ctx[4]);
    			}

    			if (!current || dirty & /*option, keys*/ 5 && li_aria_label_value !== (li_aria_label_value = /*option*/ ctx[0][/*keys*/ ctx[2].text])) {
    				attr(li, "aria-label", li_aria_label_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (69:4) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*option*/ ctx[0][/*keys*/ ctx[2].text] + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*option, keys*/ 5 && t_value !== (t_value = /*option*/ ctx[0][/*keys*/ ctx[2].text] + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (66:4) {#if optionComponent}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*option*/ ctx[0]];
    	var switch_value = /*optionComponent*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*option*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*option*/ ctx[0])])
    			: {};

    			if (switch_value !== (switch_value = /*optionComponent*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
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
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*option*/ ctx[0][/*keys*/ ctx[2].child]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let isSelectedOption;
    	let classes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	const dispatch = createEventDispatcher();
    	let { option } = $$props;
    	let { optionComponent } = $$props;
    	let { keys } = $$props;
    	let { selected } = $$props;

    	function getOptionClasses(opt) {
    		let classList = opt[keys.child] ? "o-h" : "o";

    		if (opt.classes) {
    			if (Array.isArray(opt.classes)) {
    				classList = `${classList} ${opt.classes.join(" ")}`;
    			} else {
    				classList = `${classList} ${opt.classes}`;
    			}
    		}

    		return classList;
    	}

    	function isSelected(_option, _selected) {
    		let isOptionSelected = false;

    		if (Array.isArray(_selected)) {
    			for (let i = 0; i < _selected.length; i += 1) {
    				isOptionSelected = _selected[i][keys.value] === _option[keys.value];

    				if (isOptionSelected) {
    					break;
    				}
    			}
    		} else if (_selected) {
    			isOptionSelected = _selected[keys.value] === _option[keys.value];
    		}

    		return isOptionSelected;
    	}

    	function selectOption() {
    		if (!isSelectedOption) {
    			dispatch("selection", option);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ("option" in $$props) $$invalidate(0, option = $$props.option);
    		if ("optionComponent" in $$props) $$invalidate(1, optionComponent = $$props.optionComponent);
    		if ("keys" in $$props) $$invalidate(2, keys = $$props.keys);
    		if ("selected" in $$props) $$invalidate(6, selected = $$props.selected);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*option, selected*/ 65) {
    			$$invalidate(3, isSelectedOption = isSelected(option, selected));
    		}

    		if ($$self.$$.dirty & /*option*/ 1) {
    			$$invalidate(4, classes = getOptionClasses(option));
    		}
    	};

    	return [
    		option,
    		optionComponent,
    		keys,
    		isSelectedOption,
    		classes,
    		selectOption,
    		selected,
    		$$scope,
    		slots
    	];
    }

    class OptionElement extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, not_equal, {
    			option: 0,
    			optionComponent: 1,
    			keys: 2,
    			selected: 6
    		});
    	}
    }

    /* src/newcomponents/OptionList.svelte generated by Svelte v3.32.3 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (14:2) <OptionElement option={option} keys={keys} optionComponent={optionComponent}                  selected={selected} on:selection>
    function create_default_slot(ctx) {
    	let optionlist;
    	let t;
    	let current;

    	optionlist = new OptionList({
    			props: {
    				options: /*option*/ ctx[7][/*keys*/ ctx[2].child],
    				optionComponent: /*optionComponent*/ ctx[1],
    				keys: /*keys*/ ctx[2],
    				selected: /*selected*/ ctx[3],
    				innerTree: true
    			}
    		});

    	optionlist.$on("selection", /*selection_handler_1*/ ctx[5]);

    	return {
    		c() {
    			create_component(optionlist.$$.fragment);
    			t = space();
    		},
    		m(target, anchor) {
    			mount_component(optionlist, target, anchor);
    			insert(target, t, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const optionlist_changes = {};
    			if (dirty & /*options, keys*/ 5) optionlist_changes.options = /*option*/ ctx[7][/*keys*/ ctx[2].child];
    			if (dirty & /*optionComponent*/ 2) optionlist_changes.optionComponent = /*optionComponent*/ ctx[1];
    			if (dirty & /*keys*/ 4) optionlist_changes.keys = /*keys*/ ctx[2];
    			if (dirty & /*selected*/ 8) optionlist_changes.selected = /*selected*/ ctx[3];
    			optionlist.$set(optionlist_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(optionlist.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(optionlist.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(optionlist, detaching);
    			if (detaching) detach(t);
    		}
    	};
    }

    // (13:0) {#each options as option}
    function create_each_block(ctx) {
    	let optionelement;
    	let current;

    	optionelement = new OptionElement({
    			props: {
    				option: /*option*/ ctx[7],
    				keys: /*keys*/ ctx[2],
    				optionComponent: /*optionComponent*/ ctx[1],
    				selected: /*selected*/ ctx[3],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	optionelement.$on("selection", /*selection_handler*/ ctx[6]);

    	return {
    		c() {
    			create_component(optionelement.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(optionelement, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const optionelement_changes = {};
    			if (dirty & /*options*/ 1) optionelement_changes.option = /*option*/ ctx[7];
    			if (dirty & /*keys*/ 4) optionelement_changes.keys = /*keys*/ ctx[2];
    			if (dirty & /*optionComponent*/ 2) optionelement_changes.optionComponent = /*optionComponent*/ ctx[1];
    			if (dirty & /*selected*/ 8) optionelement_changes.selected = /*selected*/ ctx[3];

    			if (dirty & /*$$scope, options, keys, optionComponent, selected*/ 1039) {
    				optionelement_changes.$$scope = { dirty, ctx };
    			}

    			optionelement.$set(optionelement_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(optionelement.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(optionelement.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(optionelement, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*options*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*options, keys, optionComponent, selected*/ 15) {
    				each_value = /*options*/ ctx[0];
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
    	
    	let { options } = $$props;
    	let { optionComponent } = $$props;
    	let { keys } = $$props;
    	let { selected } = $$props;
    	const innerTree = false;

    	function selection_handler_1(event) {
    		bubble($$self, event);
    	}

    	function selection_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(0, options = $$props.options);
    		if ("optionComponent" in $$props) $$invalidate(1, optionComponent = $$props.optionComponent);
    		if ("keys" in $$props) $$invalidate(2, keys = $$props.keys);
    		if ("selected" in $$props) $$invalidate(3, selected = $$props.selected);
    	};

    	return [
    		options,
    		optionComponent,
    		keys,
    		selected,
    		innerTree,
    		selection_handler_1,
    		selection_handler
    	];
    }

    class OptionList extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, not_equal, {
    			options: 0,
    			optionComponent: 1,
    			keys: 2,
    			selected: 3,
    			innerTree: 4
    		});
    	}

    	get innerTree() {
    		return this.$$.ctx[4];
    	}
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    var _isActive, _promise, _onCancel, _onCatch;
    class CancellablePromise {
        constructor(fn, onCancel) {
            _isActive.set(this, void 0);
            _promise.set(this, void 0);
            _onCancel.set(this, void 0);
            _onCatch.set(this, void 0);
            __classPrivateFieldSet(this, _promise, new Promise(fn));
            __classPrivateFieldSet(this, _isActive, true);
            __classPrivateFieldSet(this, _onCancel, onCancel);
            return this;
        }
        cancel() {
            __classPrivateFieldSet(this, _isActive, false);
            if (typeof __classPrivateFieldGet(this, _onCancel) === 'function') {
                __classPrivateFieldGet(this, _onCancel).call(this);
            }
            return this;
        }
        catch(catcher) {
            __classPrivateFieldSet(this, _onCatch, catcher);
        }
        then(resolve, reject) {
            const self = this;
            __classPrivateFieldGet(this, _promise).then((result) => {
                if (__classPrivateFieldGet(self, _isActive) && resolve) {
                    resolve(result);
                }
            }, (err) => {
                if (__classPrivateFieldGet(self, _isActive) && reject) {
                    reject(err);
                }
            }).catch((err) => {
                __classPrivateFieldGet(self, _onCatch).call(self, err);
            });
            return this;
        }
    }
    _isActive = new WeakMap(), _promise = new WeakMap(), _onCancel = new WeakMap(), _onCatch = new WeakMap();

    const closest = (elem, refelem) => {
        let parentElem = elem;
        while (parentElem !== refelem) {
            parentElem = parentElem.parentElement;
            if (!parentElem) {
                return null;
            }
        }
        return parentElem;
    };
    const offsetTop = (elem, parentRefElem) => {
        let parentElem = elem.parentElement;
        let offset = elem.offsetTop;
        while (parentElem && parentElem !== parentRefElem) {
            offset += parentElem.offsetTop;
            parentElem = parentElem.parentElement;
        }
        return offset;
    };
    function transform(node, { delay = 0, duration = 100, baseScale = 0.75 }) {
        const is = 1 - baseScale;
        return {
            delay,
            duration,
            css: t => {
                const translate = (t - 1) * 10;
                return `opacity: ${t}; transform-origin: 60% 0;
              transform: scale(${(t * is) + baseScale}) translateY(${translate}px);
              transition: all .1s cubic-bezier(0.5, 0, 0, 1.25), opacity .15s ease-out`;
            }
        };
    }
    const getAnimation = (_animate) => {
        if (typeof _animate === 'boolean') {
            return _animate ? transform : () => ({ delay: 0, duration: 0 });
        }
        else if (_animate.transitionFn) {
            return _animate.transitionFn;
        }
        return transform;
    };
    const getAnimationParams = (_animate) => {
        let delay = 0, duration = 100;
        if (typeof _animate !== 'boolean') {
            delay = _animate.delay || 0;
            duration = typeof _animate.duration === 'number'
                ? _animate.duration
                : 100;
        }
        return { delay, duration };
    };
    const sameWidthModifier = {
        name: 'sameWidth',
        enabled: true,
        phase: 'beforeWrite',
        requires: ['computeStyles'],
        fn: (obj) => {
            // eslint-disable-next-line no-param-reassign
            obj.state.styles.popper.minWidth = `${obj.state.rects.reference.width}px`;
        },
        effect: (obj) => {
            // eslint-disable-next-line no-param-reassign
            obj.state.elements.popper.style.minWidth = `${obj.state.elements.reference.offsetWidth}px`;
        },
    };
    function getHovered(scrollParentRef) {
        let hoveredElem = scrollParentRef.querySelector('li.o.hovered');
        if (!hoveredElem) {
            hoveredElem = scrollParentRef.querySelector('li.o');
        }
        return hoveredElem;
    }
    const arrowDown = (scrollParentRef) => {
        const elem = getHovered(scrollParentRef);
        if (elem) {
            let nextElem;
            if (elem.classList.contains('hovered')) {
                const nodeList = scrollParentRef.querySelectorAll('li.o');
                if (nodeList.length > 0) {
                    let index = 0;
                    for (let i = 0; i < nodeList.length; i++) {
                        if (nodeList[i].classList.contains('hovered')) {
                            if (i < nodeList.length - 1) {
                                index = i + 1;
                            }
                            break;
                        }
                    }
                    nextElem = nodeList[index];
                }
                elem.classList.remove('hovered');
            }
            else {
                nextElem = elem;
            }
            if (nextElem) {
                nextElem.classList.add('hovered');
            }
        }
    };
    const arrowUp = (scrollParentRef) => {
        const elem = getHovered(scrollParentRef);
        if (elem) {
            let prevElem;
            const nodeList = scrollParentRef.querySelectorAll('li.o');
            if (nodeList.length > 0) {
                if (elem.classList.contains('hovered')) {
                    let index = nodeList.length - 1;
                    for (let i = nodeList.length - 1; i >= 0; i--) {
                        if (nodeList[i].classList.contains('hovered')) {
                            if (i > 0) {
                                index = i - 1;
                            }
                            break;
                        }
                    }
                    prevElem = nodeList[index];
                    elem.classList.remove('hovered');
                }
                else {
                    prevElem = nodeList[nodeList.length - 1];
                }
            }
            if (prevElem) {
                prevElem.classList.add('hovered');
            }
        }
    };
    const chooseHovered = (scrollParentRef) => {
        const hoveredElem = scrollParentRef.querySelector('li.o.hovered');
        if (hoveredElem) {
            // TODO: Change to custom event
            hoveredElem.click();
        }
        else {
            arrowDown(scrollParentRef);
        }
    };
    const subTree = (tree, childKey, conditionFn) => {
        const stree = [];
        tree.forEach((elem) => {
            if (elem[childKey]) {
                const childSubTree = subTree(elem[childKey], childKey, conditionFn);
                if (childSubTree.length > 0) {
                    stree.push(Object.assign(Object.assign({}, elem), { [childKey]: childSubTree }));
                }
            }
            else if (conditionFn(elem)) {
                stree.push(elem);
            }
        });
        return stree;
    };
    const stringContains = (actualString, searchVal) => {
        return actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;
    };
    const filterTree = (tree, keys, searchVal) => {
        return subTree(tree, keys.child, (el) => {
            const text = el[keys.text];
            if (typeof text === 'string') {
                return stringContains(text, searchVal);
            }
            else {
                return false;
            }
        });
    };
    const fetchOptions = (datasource, searchVal, keys) => {
        if (datasource) {
            if (typeof datasource === 'function') {
                const fetchResult = datasource(searchVal);
                if (Array.isArray(fetchResult)) {
                    return new CancellablePromise((resolve) => {
                        resolve(fetchResult);
                    });
                }
                else if (typeof fetchResult.then === 'function') {
                    return new CancellablePromise((resolve, reject) => {
                        var _a, _b;
                        (_b = (_a = fetchResult.then((res) => {
                            resolve(res);
                        }, (err) => {
                            reject(err);
                        })).catch) === null || _b === void 0 ? void 0 : _b.call(_a, (err) => {
                            reject(err);
                        });
                    }, () => {
                        if ('cancel' in fetchResult && typeof fetchResult.cancel === 'function') {
                            fetchResult.cancel();
                        }
                    });
                }
            }
            else {
                const result = filterTree(datasource, keys, searchVal);
                return new CancellablePromise((resolve) => {
                    resolve(result);
                });
            }
        }
        return new CancellablePromise((_resolve, reject) => {
            reject(new Error('select-madu datasource is empty'));
        });
    };

    /* src/newcomponents/OptionHolder.svelte generated by Svelte v3.32.3 */

    function create_if_block$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_transition;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*options*/ ctx[2].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "opt-container");
    			set_style(div, "position", "relative");
    			set_style(div, "max-height", "194px");
    			set_style(div, "overflow", "auto");
    			set_style(div, "border-width", "1px");
    			set_style(div, "border-style", "solid");
    			set_style(div, "background", "#fff");
    			set_style(div, "margin-top", "4px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			/*div_binding*/ ctx[19](div);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*animationFn*/ ctx[9], /*animationParams*/ ctx[10], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*animationFn*/ ctx[9], /*animationParams*/ ctx[10], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_blocks[current_block_type_index].d();
    			/*div_binding*/ ctx[19](null);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (111:8) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	function select_block_type_1(ctx, dirty) {
    		if (/*state*/ ctx[5] === States.Loading) return create_if_block_2;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "sub-text");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    		}
    	};
    }

    // (105:8) {#if options.length > 0}
    function create_if_block_1$1(ctx) {
    	let ul;
    	let optionlist;
    	let current;

    	optionlist = new OptionList({
    			props: {
    				options: /*options*/ ctx[2],
    				keys: /*keys*/ ctx[3],
    				optionComponent: /*optionComponent*/ ctx[1],
    				selected: /*selected*/ ctx[4]
    			}
    		});

    	optionlist.$on("selection", /*selection_handler*/ ctx[18]);

    	return {
    		c() {
    			ul = element("ul");
    			create_component(optionlist.$$.fragment);
    			attr(ul, "role", "listbox");
    			attr(ul, "aria-multiselectable", /*multiple*/ ctx[6]);
    			attr(ul, "aria-expanded", "true");
    			set_style(ul, "margin", "0");
    			set_style(ul, "list-style", "none");
    			set_style(ul, "padding", "0");
    			set_style(ul, "position", "relative");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);
    			mount_component(optionlist, ul, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const optionlist_changes = {};
    			if (dirty & /*options*/ 4) optionlist_changes.options = /*options*/ ctx[2];
    			if (dirty & /*keys*/ 8) optionlist_changes.keys = /*keys*/ ctx[3];
    			if (dirty & /*optionComponent*/ 2) optionlist_changes.optionComponent = /*optionComponent*/ ctx[1];
    			if (dirty & /*selected*/ 16) optionlist_changes.selected = /*selected*/ ctx[4];
    			optionlist.$set(optionlist_changes);

    			if (!current || dirty & /*multiple*/ 64) {
    				attr(ul, "aria-multiselectable", /*multiple*/ ctx[6]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(optionlist.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(optionlist.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_component(optionlist);
    		}
    	};
    }

    // (115:12) {:else}
    function create_else_block_1$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("No results found");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (113:12) {#if state === States.Loading}
    function create_if_block_2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Loading");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isOpen*/ ctx[0] && create_if_block$1(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr(div, "class", /*parentClass*/ ctx[8]);
    			set_style(div, "box-sizing", "border-box");
    			set_style(div, "z-index", "1000");
    			set_style(div, "max-width", "100%");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(/*popper*/ ctx[11].call(null, div));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*isOpen*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpen*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*parentClass*/ 256) {
    				attr(div, "class", /*parentClass*/ ctx[8]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let parentClass;
    	let animationFn;
    	let animationParams;
    	
    	let { optionComponent } = $$props;
    	let { options } = $$props;
    	let { keys } = $$props;
    	let { selected } = $$props;
    	let { parent } = $$props;
    	let { isOpen = false } = $$props;
    	let { state } = $$props;
    	let { animate = false } = $$props;
    	let { multiple } = $$props;
    	let { classes } = $$props;
    	let scrollParentRef;

    	function scrollToSelected() {
    		if (scrollParentRef) {
    			const element = scrollParentRef.querySelector(".hovered");

    			if (element) {
    				const elem = element;
    				const elemOffsetTop = offsetTop(elem, scrollParentRef);

    				if (elemOffsetTop + elem.clientHeight > scrollParentRef.scrollTop + scrollParentRef.clientHeight) {
    					$$invalidate(7, scrollParentRef.scrollTop = elemOffsetTop, scrollParentRef);
    				} else if (elemOffsetTop < scrollParentRef.scrollTop) {
    					$$invalidate(7, scrollParentRef.scrollTop = elemOffsetTop, scrollParentRef);
    				}
    			}
    		}
    	}

    	// eslint-disable-next-line @typescript-eslint/no-unused-vars
    	function scrollAfterTick(_opts) {
    		const promise = tick();
    		promise.then(() => scrollToSelected()).catch(() => 0);
    	}

    	onMount(() => {
    		$$invalidate(0, isOpen = true);
    		scrollAfterTick();
    	});

    	onDestroy(() => {
    		$$invalidate(0, isOpen = false);
    	});

    	function popper(node) {
    		// eslint-disable-next-line max-len
    		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    		const popperInstance = createPopper(parent, node, {
    			placement: "bottom-start",
    			modifiers: [
    				sameWidthModifier,
    				{
    					name: "offset",
    					options: { offset: [0, 0] }
    				}
    			]
    		});

    		return {
    			destroy() {
    				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
    				popperInstance.destroy();
    			}
    		};
    	}

    	function moveDown() {
    		if (scrollParentRef) {
    			arrowDown(scrollParentRef);
    			scrollToSelected();
    		}
    	}

    	function moveUp() {
    		if (scrollParentRef) {
    			arrowUp(scrollParentRef);
    			scrollToSelected();
    		}
    	}

    	function selectHovered() {
    		if (scrollParentRef) {
    			chooseHovered(scrollParentRef);
    		}
    	}

    	function selection_handler(event) {
    		bubble($$self, event);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scrollParentRef = $$value;
    			$$invalidate(7, scrollParentRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("optionComponent" in $$props) $$invalidate(1, optionComponent = $$props.optionComponent);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("keys" in $$props) $$invalidate(3, keys = $$props.keys);
    		if ("selected" in $$props) $$invalidate(4, selected = $$props.selected);
    		if ("parent" in $$props) $$invalidate(12, parent = $$props.parent);
    		if ("isOpen" in $$props) $$invalidate(0, isOpen = $$props.isOpen);
    		if ("state" in $$props) $$invalidate(5, state = $$props.state);
    		if ("animate" in $$props) $$invalidate(13, animate = $$props.animate);
    		if ("multiple" in $$props) $$invalidate(6, multiple = $$props.multiple);
    		if ("classes" in $$props) $$invalidate(14, classes = $$props.classes);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*classes*/ 16384) {
    			$$invalidate(8, parentClass = [
    				"select-madu-dropdown",
    				Array.isArray(classes) ? classes.join(" ") : classes
    			].join(" ").trim());
    		}

    		if ($$self.$$.dirty & /*options*/ 4) {
    			scrollAfterTick();
    		}

    		if ($$self.$$.dirty & /*animate*/ 8192) {
    			$$invalidate(9, animationFn = getAnimation(animate));
    		}

    		if ($$self.$$.dirty & /*animate*/ 8192) {
    			$$invalidate(10, animationParams = getAnimationParams(animate));
    		}
    	};

    	return [
    		isOpen,
    		optionComponent,
    		options,
    		keys,
    		selected,
    		state,
    		multiple,
    		scrollParentRef,
    		parentClass,
    		animationFn,
    		animationParams,
    		popper,
    		parent,
    		animate,
    		classes,
    		moveDown,
    		moveUp,
    		selectHovered,
    		selection_handler,
    		div_binding
    	];
    }

    class OptionHolder extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$2, create_fragment$2, not_equal, {
    			optionComponent: 1,
    			options: 2,
    			keys: 3,
    			selected: 4,
    			parent: 12,
    			isOpen: 0,
    			state: 5,
    			animate: 13,
    			multiple: 6,
    			classes: 14,
    			moveDown: 15,
    			moveUp: 16,
    			selectHovered: 17
    		});
    	}

    	get moveDown() {
    		return this.$$.ctx[15];
    	}

    	get moveUp() {
    		return this.$$.ctx[16];
    	}

    	get selectHovered() {
    		return this.$$.ctx[17];
    	}
    }

    /* src/newcomponents/OptionDropdown.svelte generated by Svelte v3.32.3 */

    function instance_1($$self, $$props, $$invalidate) {
    	
    	const dispatch = createEventDispatcher();
    	let { optionComponent } = $$props;
    	let { options } = $$props;
    	let { keys } = $$props;
    	let { selected } = $$props;
    	let { parent } = $$props;
    	let { state } = $$props;
    	let { animate } = $$props;
    	let { multiple } = $$props;
    	let { classes } = $$props;
    	let instance;

    	function setOnChange(name, value) {
    		if (instance) {
    			instance.$set({ [name]: value });
    		}
    	}

    	onMount(() => {
    		instance = new OptionHolder({
    				target: document.querySelector("body"),
    				props: {
    					optionComponent,
    					options,
    					keys,
    					selected,
    					parent,
    					state,
    					animate,
    					multiple,
    					classes
    				}
    			});

    		const off = instance.$on("selection", event => {
    			dispatch("selection", event.detail);
    		});

    		return () => off();
    	});

    	onDestroy(() => {
    		setOnChange("isOpen", false);

    		if (animate) {
    			setTimeout(
    				() => {
    					instance.$destroy();
    				},
    				200
    			);
    		} else {
    			instance.$destroy();
    		}
    	});

    	function moveUp() {
    		if (instance) {
    			instance.moveUp();
    		}
    	}

    	function moveDown() {
    		if (instance) {
    			instance.moveDown();
    		}
    	}

    	function selectHovered() {
    		if (instance) {
    			instance.selectHovered();
    		}
    	}

    	$$self.$$set = $$props => {
    		if ("optionComponent" in $$props) $$invalidate(0, optionComponent = $$props.optionComponent);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("keys" in $$props) $$invalidate(2, keys = $$props.keys);
    		if ("selected" in $$props) $$invalidate(3, selected = $$props.selected);
    		if ("parent" in $$props) $$invalidate(4, parent = $$props.parent);
    		if ("state" in $$props) $$invalidate(5, state = $$props.state);
    		if ("animate" in $$props) $$invalidate(6, animate = $$props.animate);
    		if ("multiple" in $$props) $$invalidate(7, multiple = $$props.multiple);
    		if ("classes" in $$props) $$invalidate(8, classes = $$props.classes);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options*/ 2) {
    			setOnChange("options", options);
    		}

    		if ($$self.$$.dirty & /*keys*/ 4) {
    			setOnChange("keys", keys);
    		}

    		if ($$self.$$.dirty & /*selected*/ 8) {
    			setOnChange("selected", selected);
    		}

    		if ($$self.$$.dirty & /*state*/ 32) {
    			setOnChange("state", state);
    		}

    		if ($$self.$$.dirty & /*animate*/ 64) {
    			setOnChange("animate", animate);
    		}

    		if ($$self.$$.dirty & /*multiple*/ 128) {
    			setOnChange("multiple", multiple);
    		}

    		if ($$self.$$.dirty & /*classes*/ 256) {
    			setOnChange("classes", classes);
    		}
    	};

    	return [
    		optionComponent,
    		options,
    		keys,
    		selected,
    		parent,
    		state,
    		animate,
    		multiple,
    		classes,
    		moveUp,
    		moveDown,
    		selectHovered
    	];
    }

    class OptionDropdown extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance_1, null, not_equal, {
    			optionComponent: 0,
    			options: 1,
    			keys: 2,
    			selected: 3,
    			parent: 4,
    			state: 5,
    			animate: 6,
    			multiple: 7,
    			classes: 8,
    			moveUp: 9,
    			moveDown: 10,
    			selectHovered: 11
    		});
    	}

    	get moveUp() {
    		return this.$$.ctx[9];
    	}

    	get moveDown() {
    		return this.$$.ctx[10];
    	}

    	get selectHovered() {
    		return this.$$.ctx[11];
    	}
    }

    /* src/newcomponents/Tag.svelte generated by Svelte v3.32.3 */

    function create_fragment$3(ctx) {
    	let li;
    	let span;
    	let t0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			li = element("li");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    			attr(button, "tabindex", "-1");
    			attr(button, "title", "Remove item");
    			attr(button, "aria-label", "Remove item");
    			attr(button, "class", "it-icon-holder cl-i");
    			set_style(button, "postition", "relative");
    			set_style(button, "margin", "0px");
    			attr(li, "class", "tag");
    			set_style(li, "position", "relative");
    			attr(li, "title", /*title*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, span);
    			append(span, t0);
    			append(li, t1);
    			append(li, button);

    			if (!mounted) {
    				dispose = listen(button, "click", prevent_default(/*removeSelection*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data(t0, /*title*/ ctx[0]);

    			if (dirty & /*title*/ 1) {
    				attr(li, "title", /*title*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let title;
    	var _a;
    	
    	const dispatch = createEventDispatcher();
    	let { index } = $$props;
    	let { option } = $$props;
    	let { keys } = $$props;

    	function removeSelection() {
    		dispatch("removeElement", { option, index });
    	}

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("option" in $$props) $$invalidate(3, option = $$props.option);
    		if ("keys" in $$props) $$invalidate(4, keys = $$props.keys);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*option, keys, _a*/ 56) {
    			$$invalidate(0, title = $$invalidate(5, _a = option[keys.text]) === null || _a === void 0
    			? void 0
    			: _a.toString());
    		}
    	};

    	return [title, removeSelection, index, option, keys, _a];
    }

    class Tag extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, not_equal, { index: 2, option: 3, keys: 4 });
    	}
    }

    /* src/newcomponents/Main.svelte generated by Svelte v3.32.3 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	child_ctx[44] = i;
    	return child_ctx;
    }

    // (214:4) {#if multiple && Array.isArray(selected) && selected.length > 0}
    function create_if_block_5(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*selected*/ ctx[1];
    	const get_key = ctx => /*elem*/ ctx[42][/*keys*/ ctx[0].value];

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(ul, "margin", "0");
    			set_style(ul, "list-style", "none");
    			set_style(ul, "padding", "0");
    			set_style(ul, "position", "relative");
    			set_style(ul, "display", "inline-block");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*selected, keys, onRemoveElement*/ 8388611) {
    				each_value = /*selected*/ ctx[1];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};
    }

    // (216:8) {#each selected as elem, index (elem[keys.value])}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let tag;
    	let current;

    	tag = new Tag({
    			props: {
    				option: /*elem*/ ctx[42],
    				index: /*index*/ ctx[44],
    				keys: /*keys*/ ctx[0]
    			}
    		});

    	tag.$on("removeElement", /*onRemoveElement*/ ctx[23]);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(tag.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(tag, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tag_changes = {};
    			if (dirty[0] & /*selected*/ 2) tag_changes.option = /*elem*/ ctx[42];
    			if (dirty[0] & /*selected*/ 2) tag_changes.index = /*index*/ ctx[44];
    			if (dirty[0] & /*keys*/ 1) tag_changes.keys = /*keys*/ ctx[0];
    			tag.$set(tag_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(tag.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(tag.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(tag, detaching);
    		}
    	};
    }

    // (231:24) 
    function create_if_block_4(ctx) {
    	let span;
    	let t_value = /*selected*/ ctx[1][/*keys*/ ctx[0].text] + "";
    	let t;
    	let span_title_value;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);
    			attr(span, "role", "textbox");
    			attr(span, "aria-readonly", "true");
    			attr(span, "title", span_title_value = /*selected*/ ctx[1][/*keys*/ ctx[0].text]);
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*selected, keys*/ 3 && t_value !== (t_value = /*selected*/ ctx[1][/*keys*/ ctx[0].text] + "")) set_data(t, t_value);

    			if (dirty[0] & /*selected, keys*/ 3 && span_title_value !== (span_title_value = /*selected*/ ctx[1][/*keys*/ ctx[0].text])) {
    				attr(span, "title", span_title_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (228:28) 
    function create_if_block_3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text(/*placeholder*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*placeholder*/ 8) set_data(t, /*placeholder*/ ctx[3]);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (222:4) {#if search && isOpen}
    function create_if_block_2$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input = element("input");
    			set_input_type(input, "text");
    			attr(input, "class", "search-input");
    			attr(input, "placeholder", "Search");
    			set_style(input, "width", /*inputWidth*/ ctx[17] + "em");
    			set_style(input, "min-width", "50px");
    			set_style(input, "max-width", "100%");
    			set_style(input, "border", "none");
    			set_style(input, "outline", "0");
    			attr(input, "aria-autocomplete", "both");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    			/*input_binding*/ ctx[32](input);
    			set_input_value(input, /*searchValue*/ ctx[10]);

    			if (!mounted) {
    				dispose = listen(input, "input", /*input_input_handler*/ ctx[33]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*inputWidth*/ 131072) {
    				set_style(input, "width", /*inputWidth*/ ctx[17] + "em");
    			}

    			if (dirty[0] & /*searchValue*/ 1024 && input.value !== /*searchValue*/ ctx[10]) {
    				set_input_value(input, /*searchValue*/ ctx[10]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input);
    			/*input_binding*/ ctx[32](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (245:4) {:else}
    function create_else_block$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    			attr(div, "class", "it-icon-holder");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (240:4) {#if state === States.Loading}
    function create_if_block_1$2(ctx) {
    	let div1;

    	return {
    		c() {
    			div1 = element("div");
    			div1.innerHTML = `<div class="spinner-border"></div>`;
    			attr(div1, "class", "loader");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    		}
    	};
    }

    // (255:0) {#if isOpen}
    function create_if_block$2(ctx) {
    	let optiondropdown;
    	let current;

    	let optiondropdown_props = {
    		parent: /*baseRef*/ ctx[15],
    		classes: /*classes*/ ctx[2],
    		optionComponent: /*optionComponent*/ ctx[7],
    		options: /*options*/ ctx[11],
    		keys: /*keys*/ ctx[0],
    		selected: /*selected*/ ctx[1],
    		multiple: /*multiple*/ ctx[5],
    		state: /*state*/ ctx[12],
    		animate: /*animate*/ ctx[9]
    	};

    	optiondropdown = new OptionDropdown({ props: optiondropdown_props });
    	/*optiondropdown_binding*/ ctx[35](optiondropdown);
    	optiondropdown.$on("selection", /*selectOption*/ ctx[24]);

    	return {
    		c() {
    			create_component(optiondropdown.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(optiondropdown, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const optiondropdown_changes = {};
    			if (dirty[0] & /*baseRef*/ 32768) optiondropdown_changes.parent = /*baseRef*/ ctx[15];
    			if (dirty[0] & /*classes*/ 4) optiondropdown_changes.classes = /*classes*/ ctx[2];
    			if (dirty[0] & /*optionComponent*/ 128) optiondropdown_changes.optionComponent = /*optionComponent*/ ctx[7];
    			if (dirty[0] & /*options*/ 2048) optiondropdown_changes.options = /*options*/ ctx[11];
    			if (dirty[0] & /*keys*/ 1) optiondropdown_changes.keys = /*keys*/ ctx[0];
    			if (dirty[0] & /*selected*/ 2) optiondropdown_changes.selected = /*selected*/ ctx[1];
    			if (dirty[0] & /*multiple*/ 32) optiondropdown_changes.multiple = /*multiple*/ ctx[5];
    			if (dirty[0] & /*state*/ 4096) optiondropdown_changes.state = /*state*/ ctx[12];
    			if (dirty[0] & /*animate*/ 512) optiondropdown_changes.animate = /*animate*/ ctx[9];
    			optiondropdown.$set(optiondropdown_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(optiondropdown.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(optiondropdown.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			/*optiondropdown_binding*/ ctx[35](null);
    			destroy_component(optiondropdown, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let show_if = /*multiple*/ ctx[5] && Array.isArray(/*selected*/ ctx[1]) && /*selected*/ ctx[1].length > 0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let if_block3_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = show_if && create_if_block_5(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*search*/ ctx[6] && /*isOpen*/ ctx[13]) return create_if_block_2$1;
    		if (/*isPlaceHolder*/ ctx[16]) return create_if_block_3;
    		if (!/*multiple*/ ctx[5]) return create_if_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*state*/ ctx[12] === States.Loading) return create_if_block_1$2;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);
    	let if_block3 = /*isOpen*/ ctx[13] && create_if_block$2(ctx);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div1 = element("div");
    			if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			attr(div0, "class", "slmd-inner");
    			attr(div1, "class", "status-ind");
    			attr(div2, "class", /*parentClass*/ ctx[20]);
    			attr(div2, "tabindex", 0);
    			set_style(div2, "position", "relative");
    			set_style(div2, "border-width", "1px");
    			set_style(div2, "border-style", "solid");
    			attr(div2, "aria-disabled", /*disabled*/ ctx[4]);
    			attr(div2, "role", "combobox");
    			attr(div2, "aria-haspopup", "listbox");
    			attr(div2, "aria-expanded", /*isOpen*/ ctx[13]);
    			attr(div2, "aria-label", /*name*/ ctx[8]);
    			toggle_class(div2, "multiple", /*multiple*/ ctx[5]);
    			toggle_class(div2, "open", /*isOpen*/ ctx[13]);
    			toggle_class(div2, "focus", /*focus*/ ctx[14] || /*isOpen*/ ctx[13]);
    			toggle_class(div2, "search", /*search*/ ctx[6]);
    			toggle_class(div2, "disabled", /*disabled*/ ctx[4]);
    			toggle_class(div2, "placeholder", /*isPlaceHolder*/ ctx[16]);
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append(div2, t1);
    			append(div2, div1);
    			if_block2.m(div1, null);
    			/*div2_binding*/ ctx[34](div2);
    			insert(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, if_block3_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "click", /*checkAndClose*/ ctx[21]),
    					listen(div2, "click", /*checkAndOpen*/ ctx[22]),
    					listen(div2, "keydown", /*onKeyDown*/ ctx[25]),
    					listen(div2, "focus", /*onFocusIn*/ ctx[26]),
    					listen(div2, "blur", /*onFocusOut*/ ctx[27])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*multiple, selected*/ 34) show_if = /*multiple*/ ctx[5] && Array.isArray(/*selected*/ ctx[1]) && /*selected*/ ctx[1].length > 0;

    			if (show_if) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*multiple, selected*/ 34) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type && current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			}

    			if (!current || dirty[0] & /*parentClass*/ 1048576) {
    				attr(div2, "class", /*parentClass*/ ctx[20]);
    			}

    			if (!current || dirty[0] & /*disabled*/ 16) {
    				attr(div2, "aria-disabled", /*disabled*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*isOpen*/ 8192) {
    				attr(div2, "aria-expanded", /*isOpen*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*name*/ 256) {
    				attr(div2, "aria-label", /*name*/ ctx[8]);
    			}

    			if (dirty[0] & /*parentClass, multiple*/ 1048608) {
    				toggle_class(div2, "multiple", /*multiple*/ ctx[5]);
    			}

    			if (dirty[0] & /*parentClass, isOpen*/ 1056768) {
    				toggle_class(div2, "open", /*isOpen*/ ctx[13]);
    			}

    			if (dirty[0] & /*parentClass, focus, isOpen*/ 1073152) {
    				toggle_class(div2, "focus", /*focus*/ ctx[14] || /*isOpen*/ ctx[13]);
    			}

    			if (dirty[0] & /*parentClass, search*/ 1048640) {
    				toggle_class(div2, "search", /*search*/ ctx[6]);
    			}

    			if (dirty[0] & /*parentClass, disabled*/ 1048592) {
    				toggle_class(div2, "disabled", /*disabled*/ ctx[4]);
    			}

    			if (dirty[0] & /*parentClass, isPlaceHolder*/ 1114112) {
    				toggle_class(div2, "placeholder", /*isPlaceHolder*/ ctx[16]);
    			}

    			if (/*isOpen*/ ctx[13]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*isOpen*/ 8192) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block3);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block3);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (if_block0) if_block0.d();

    			if (if_block1) {
    				if_block1.d();
    			}

    			if_block2.d();
    			/*div2_binding*/ ctx[34](null);
    			if (detaching) detach(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach(if_block3_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let parentClass;
    	
    	
    	let { class: classes } = $$props;
    	let { placeholder = "Select option" } = $$props;
    	let { disabled = false } = $$props;
    	let { multiple = false } = $$props;
    	let { search = true } = $$props;
    	let { optionComponent } = $$props;
    	let { name = "" } = $$props;
    	let { animate = false } = $$props;
    	let { textKey = "text" } = $$props;
    	let { valueKey = textKey } = $$props;
    	let { childKey = "children" } = $$props;
    	let { keys } = $$props;
    	let { value: selected } = $$props;
    	let { datasource = [] } = $$props;
    	let searchValue = "";
    	let options = [];
    	let state = States.Loading;
    	let fetchPromise;

    	const setOptions = (_datasource, _searchVal, _multiple, _keys) => {
    		$$invalidate(12, state = States.Loading);

    		if (typeof fetchPromise !== "undefined") {
    			// eslint-disable-next-line no-void
    			void fetchPromise.cancel();
    		}

    		fetchPromise = fetchOptions(_datasource, _searchVal, _keys);

    		fetchPromise.then(
    			res => {
    				$$invalidate(11, options = res);
    				$$invalidate(12, state = States.Ready);

    				if (!_multiple && options.length > 0 && !selected) {
    					let [_selected] = options;

    					while (_selected[_keys.child]) {
    						[_selected] = _selected[_keys.child];
    					}

    					$$invalidate(1, selected = _selected);
    				}

    				return options;
    			},
    			() => {
    				$$invalidate(12, state = States.Error);
    			}
    		).catch(() => {
    			$$invalidate(12, state = States.Error);
    		});
    	};

    	// Internal
    	let isOpen = false;

    	let focus = false;
    	let baseRef;
    	let isPlaceHolder;
    	let inputWidth;

    	// Refs
    	let searchInputRef;

    	let optionDropdownRef;

    	function open() {
    		$$invalidate(13, isOpen = true);
    		const promise = tick();

    		promise.then(() => {
    			if (searchInputRef) {
    				return searchInputRef.focus();
    			}

    			return null;
    		}).catch(() => null);
    	}

    	function close() {
    		$$invalidate(13, isOpen = false);
    		$$invalidate(10, searchValue = "");
    	}

    	function focusBase() {
    		baseRef.focus();
    	}

    	function checkAndClose(event) {
    		if (isOpen) {
    			const promise = tick();

    			promise.then(() => {
    				const closestParent = closest(event.target, baseRef);

    				if (!closestParent) {
    					close();
    				}

    				return null;
    			}).catch(() => null);
    		}
    	}

    	function checkAndOpen() {
    		if (!isOpen) {
    			open();
    		} else if (searchInputRef) {
    			searchInputRef.focus();
    		}
    	}

    	function removeElement(index) {
    		if (Array.isArray(selected)) {
    			selected.splice(index, 1);
    			$$invalidate(1, selected = [...selected]);
    		}
    	}

    	function onRemoveElement(event) {
    		removeElement(event.detail.index);
    	}

    	function selectOption(event) {
    		if (multiple) {
    			if (Array.isArray(selected)) {
    				$$invalidate(1, selected = [...selected, event.detail]);
    			} else {
    				$$invalidate(1, selected = [event.detail]);
    			}
    		} else {
    			$$invalidate(1, selected = event.detail);
    			close();
    		}

    		focusBase();
    	}

    	function onKeyDown(event) {
    		var _a;

    		switch (event.key) {
    			case "Enter":
    				if (isOpen) {
    					if (optionDropdownRef) {
    						optionDropdownRef.selectHovered();
    					}
    				} else {
    					open();
    				}
    				break;
    			case "Escape":
    				if (isOpen) {
    					close();
    					focusBase();
    				}
    				break;
    			case "ArrowDown":
    				if (isOpen && optionDropdownRef) {
    					optionDropdownRef.moveDown();
    				} else {
    					open();
    				}
    				break;
    			case "ArrowUp":
    				if (isOpen && optionDropdownRef) {
    					optionDropdownRef.moveUp();
    				} else {
    					open();
    				}
    				break;
    			case "Tab":
    				if (isOpen) {
    					close();
    				}
    				break;
    			case "Backspace":
    				if (isOpen && search && multiple && !searchValue.trim() && Array.isArray(selected) && selected.length > 0) {
    					const lastElement = selected[selected.length - 1];
    					removeElement(selected.length - 1);

    					$$invalidate(10, searchValue = `${((_a = lastElement[keys.text]) === null || _a === void 0
					? void 0
					: _a.toString()) || ""} `);
    				}
    				break;
    		}
    	}

    	function onFocusIn() {
    		$$invalidate(14, focus = true);
    	}

    	function onFocusOut() {
    		$$invalidate(14, focus = false);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			searchInputRef = $$value;
    			$$invalidate(18, searchInputRef);
    		});
    	}

    	function input_input_handler() {
    		searchValue = this.value;
    		$$invalidate(10, searchValue);
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			baseRef = $$value;
    			$$invalidate(15, baseRef);
    		});
    	}

    	function optiondropdown_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			optionDropdownRef = $$value;
    			$$invalidate(19, optionDropdownRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("class" in $$props) $$invalidate(2, classes = $$props.class);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ("multiple" in $$props) $$invalidate(5, multiple = $$props.multiple);
    		if ("search" in $$props) $$invalidate(6, search = $$props.search);
    		if ("optionComponent" in $$props) $$invalidate(7, optionComponent = $$props.optionComponent);
    		if ("name" in $$props) $$invalidate(8, name = $$props.name);
    		if ("animate" in $$props) $$invalidate(9, animate = $$props.animate);
    		if ("textKey" in $$props) $$invalidate(28, textKey = $$props.textKey);
    		if ("valueKey" in $$props) $$invalidate(29, valueKey = $$props.valueKey);
    		if ("childKey" in $$props) $$invalidate(30, childKey = $$props.childKey);
    		if ("keys" in $$props) $$invalidate(0, keys = $$props.keys);
    		if ("value" in $$props) $$invalidate(1, selected = $$props.value);
    		if ("datasource" in $$props) $$invalidate(31, datasource = $$props.datasource);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*classes*/ 4) {
    			$$invalidate(20, parentClass = ["select-madu", Array.isArray(classes) ? classes.join(" ") : classes].join(" ").trim());
    		}

    		if ($$self.$$.dirty[0] & /*textKey, valueKey, childKey*/ 1879048192) {
    			$$invalidate(0, keys = {
    				text: textKey,
    				value: valueKey,
    				child: childKey
    			});
    		}

    		if ($$self.$$.dirty[0] & /*searchValue, multiple, keys*/ 1057 | $$self.$$.dirty[1] & /*datasource*/ 1) {
    			// Option setter
    			setOptions(datasource, searchValue, multiple, keys);
    		}

    		if ($$self.$$.dirty[0] & /*selected, multiple*/ 34) {
    			$$invalidate(16, isPlaceHolder = !selected || multiple && Array.isArray(selected) && selected.length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*searchValue*/ 1024) {
    			$$invalidate(17, inputWidth = (searchValue.length + 1) * 0.6);
    		}
    	};

    	return [
    		keys,
    		selected,
    		classes,
    		placeholder,
    		disabled,
    		multiple,
    		search,
    		optionComponent,
    		name,
    		animate,
    		searchValue,
    		options,
    		state,
    		isOpen,
    		focus,
    		baseRef,
    		isPlaceHolder,
    		inputWidth,
    		searchInputRef,
    		optionDropdownRef,
    		parentClass,
    		checkAndClose,
    		checkAndOpen,
    		onRemoveElement,
    		selectOption,
    		onKeyDown,
    		onFocusIn,
    		onFocusOut,
    		textKey,
    		valueKey,
    		childKey,
    		datasource,
    		input_binding,
    		input_input_handler,
    		div2_binding,
    		optiondropdown_binding
    	];
    }

    class Main extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			not_equal,
    			{
    				class: 2,
    				placeholder: 3,
    				disabled: 4,
    				multiple: 5,
    				search: 6,
    				optionComponent: 7,
    				name: 8,
    				animate: 9,
    				textKey: 28,
    				valueKey: 29,
    				childKey: 30,
    				keys: 0,
    				value: 1,
    				datasource: 31
    			},
    			[-1, -1]
    		);
    	}
    }

    return Main;

})));

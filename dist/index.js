(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.SelectMadu = factory());
}(this, (function () { 'use strict';

    function noop() { }
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
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
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
            block.m(node, next, lookup.has(block.key));
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

    /* src/components/options/OptionList.svelte generated by Svelte v3.20.1 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (31:4) {:else}
    function create_else_block(ctx) {
    	let li;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let li_class_value;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*optionComponent*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*opt*/ ctx[10], ...args);
    	}

    	return {
    		c() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			attr(li, "class", li_class_value = "o " + (/*opt*/ ctx[10].classes ? /*opt*/ ctx[10].classes : ""));
    			toggle_class(li, "disabled", /*opt*/ ctx[10].disabled);
    			toggle_class(li, "selected", /*isSelected*/ ctx[5](/*opt*/ ctx[10]));
    		},
    		m(target, anchor, remount) {
    			insert(target, li, anchor);
    			if_blocks[current_block_type_index].m(li, null);
    			append(li, t);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(li, "click", click_handler);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
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
    				}

    				transition_in(if_block, 1);
    				if_block.m(li, t);
    			}

    			if (!current || dirty & /*options*/ 1 && li_class_value !== (li_class_value = "o " + (/*opt*/ ctx[10].classes ? /*opt*/ ctx[10].classes : ""))) {
    				attr(li, "class", li_class_value);
    			}

    			if (dirty & /*options, options*/ 1) {
    				toggle_class(li, "disabled", /*opt*/ ctx[10].disabled);
    			}

    			if (dirty & /*options, isSelected, options*/ 33) {
    				toggle_class(li, "selected", /*isSelected*/ ctx[5](/*opt*/ ctx[10]));
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
    			dispose();
    		}
    	};
    }

    // (22:4) {#if opt[childKey]}
    function create_if_block(ctx) {
    	let li;
    	let t0_value = /*getFormatted*/ ctx[4]("optionParent", /*opt*/ ctx[10]) + "";
    	let t0;
    	let t1;
    	let current;

    	const optionlist = new OptionList({
    			props: {
    				options: /*opt*/ ctx[10][/*childKey*/ ctx[3]],
    				textKey: /*textKey*/ ctx[2],
    				childKey: /*childKey*/ ctx[3],
    				getFormatted: /*getFormatted*/ ctx[4],
    				isSelected: /*isSelected*/ ctx[5],
    				optionComponent: /*optionComponent*/ ctx[1]
    			}
    		});

    	optionlist.$on("selection", /*selection_handler*/ ctx[8]);

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(optionlist.$$.fragment);
    			attr(li, "class", "o-h");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			insert(target, t1, anchor);
    			mount_component(optionlist, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty & /*getFormatted, options*/ 17) && t0_value !== (t0_value = /*getFormatted*/ ctx[4]("optionParent", /*opt*/ ctx[10]) + "")) set_data(t0, t0_value);
    			const optionlist_changes = {};
    			if (dirty & /*options, childKey*/ 9) optionlist_changes.options = /*opt*/ ctx[10][/*childKey*/ ctx[3]];
    			if (dirty & /*textKey*/ 4) optionlist_changes.textKey = /*textKey*/ ctx[2];
    			if (dirty & /*childKey*/ 8) optionlist_changes.childKey = /*childKey*/ ctx[3];
    			if (dirty & /*getFormatted*/ 16) optionlist_changes.getFormatted = /*getFormatted*/ ctx[4];
    			if (dirty & /*isSelected*/ 32) optionlist_changes.isSelected = /*isSelected*/ ctx[5];
    			if (dirty & /*optionComponent*/ 2) optionlist_changes.optionComponent = /*optionComponent*/ ctx[1];
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
    			if (detaching) detach(li);
    			if (detaching) detach(t1);
    			destroy_component(optionlist, detaching);
    		}
    	};
    }

    // (40:10) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*getFormatted*/ ctx[4]("option", /*opt*/ ctx[10]) + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*getFormatted, options*/ 17 && t_value !== (t_value = /*getFormatted*/ ctx[4]("option", /*opt*/ ctx[10]) + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (37:10) {#if optionComponent}
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*opt*/ ctx[10]];
    	var switch_value = /*optionComponent*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
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
    			const switch_instance_changes = (dirty & /*options*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*opt*/ ctx[10])])
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

    // (21:2) {#each options as opt}
    function create_each_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*opt*/ ctx[10][/*childKey*/ ctx[3]]) return 0;
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
    		p(ctx, dirty) {
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

    function create_fragment(ctx) {
    	let ul;
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
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*options, childKey, textKey, getFormatted, isSelected, optionComponent, selectOption*/ 127) {
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
    						each_blocks[i].m(ul, null);
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
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { options = [] } = $$props;
    	let { optionComponent } = $$props;
    	let { textKey } = $$props;
    	let { childKey } = $$props;
    	let { getFormatted } = $$props;
    	let { isSelected } = $$props;

    	function selectOption(opt) {
    		dispatch("selection", opt);
    	}

    	function selection_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler = (opt, e) => selectOption(opt);

    	$$self.$set = $$props => {
    		if ("options" in $$props) $$invalidate(0, options = $$props.options);
    		if ("optionComponent" in $$props) $$invalidate(1, optionComponent = $$props.optionComponent);
    		if ("textKey" in $$props) $$invalidate(2, textKey = $$props.textKey);
    		if ("childKey" in $$props) $$invalidate(3, childKey = $$props.childKey);
    		if ("getFormatted" in $$props) $$invalidate(4, getFormatted = $$props.getFormatted);
    		if ("isSelected" in $$props) $$invalidate(5, isSelected = $$props.isSelected);
    	};

    	return [
    		options,
    		optionComponent,
    		textKey,
    		childKey,
    		getFormatted,
    		isSelected,
    		selectOption,
    		dispatch,
    		selection_handler,
    		click_handler
    	];
    }

    class OptionList extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, not_equal, {
    			options: 0,
    			optionComponent: 1,
    			textKey: 2,
    			childKey: 3,
    			getFormatted: 4,
    			isSelected: 5
    		});
    	}
    }

    var FormatterUtil = {

      formatByType(formatters, type, obj, textKey) {
        if(formatters && typeof formatters[type] === "function") {
          return formatters[type](obj);
        }
        return obj[textKey];
      }

    };

    /* src/components/options/OptionHolder.svelte generated by Svelte v3.20.1 */

    function create_if_block_1$1(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*options*/ ctx[0].length + "";
    	let t1;
    	let t2;
    	let t3;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("showing ");
    			t1 = text(t1_value);
    			t2 = text(" of ");
    			t3 = text(/*totalCount*/ ctx[4]);
    			attr(div, "class", "sub-text");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);
    			append(div, t2);
    			append(div, t3);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*options*/ 1 && t1_value !== (t1_value = /*options*/ ctx[0].length + "")) set_data(t1, t1_value);
    			if (dirty & /*totalCount*/ 16) set_data(t3, /*totalCount*/ ctx[4]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (131:2) {#if totalCount === 0}
    function create_if_block$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "No results found";
    			attr(div, "class", "sub-text");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;

    	const options_1 = new OptionList({
    			props: {
    				options: /*options*/ ctx[0],
    				textKey: /*textKey*/ ctx[2],
    				childKey: /*childKey*/ ctx[3],
    				getFormatted: /*getFormatted*/ ctx[5],
    				isSelected: /*isSelected*/ ctx[6],
    				optionComponent: /*optionComponent*/ ctx[1]
    			}
    		});

    	options_1.$on("selection", /*selection_handler*/ ctx[16]);

    	function select_block_type(ctx, dirty) {
    		if (/*totalCount*/ ctx[4] === 0) return create_if_block$1;
    		if (typeof /*totalCount*/ ctx[4] !== "undefined" && /*totalCount*/ ctx[4] !== /*options*/ ctx[0].length) return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(options_1.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr(div0, "class", "opt-container");
    			attr(div1, "class", "slmd-dropdown");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			mount_component(options_1, div0, null);
    			/*div0_binding*/ ctx[17](div0);
    			append(div1, t);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const options_1_changes = {};
    			if (dirty & /*options*/ 1) options_1_changes.options = /*options*/ ctx[0];
    			if (dirty & /*textKey*/ 4) options_1_changes.textKey = /*textKey*/ ctx[2];
    			if (dirty & /*childKey*/ 8) options_1_changes.childKey = /*childKey*/ ctx[3];
    			if (dirty & /*getFormatted*/ 32) options_1_changes.getFormatted = /*getFormatted*/ ctx[5];
    			if (dirty & /*isSelected*/ 64) options_1_changes.isSelected = /*isSelected*/ ctx[6];
    			if (dirty & /*optionComponent*/ 2) options_1_changes.optionComponent = /*optionComponent*/ ctx[1];
    			options_1.$set(options_1_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(options_1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(options_1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(options_1);
    			/*div0_binding*/ ctx[17](null);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { options = [] } = $$props;
    	let { optionComponent } = $$props;
    	let { textKey = "name" } = $$props;
    	let { childKey = "id" } = $$props;
    	let { totalCount } = $$props;

    	let { getFormatted = function (type, opt) {
    		return FormatterUtil.formatByType(undefined, type, opt, textKey);
    	} } = $$props;

    	let { isSelected = function () {
    		return false;
    	} } = $$props;

    	let scrollParentRef;

    	onMount(() => {
    		scrollToSelected();
    	});

    	function moveUp() {
    		let elem = getHovered();

    		if (elem) {
    			let prevElem;

    			if (elem.classList.contains("selected")) {
    				elem.classList.remove("selected");
    				prevElem = elem.previousElementSibling;
    			} else {
    				prevElem = elem;
    			}

    			if (!prevElem) {
    				prevElem = scrollParentRef.querySelector("li.o:last-child");
    			}

    			if (prevElem) {
    				prevElem.classList.add("selected");
    			}
    		}

    		scrollToSelected();
    	}

    	function moveDown() {
    		let elem = getHovered();

    		if (elem) {
    			let nextElem;

    			if (elem.classList.contains("selected")) {
    				elem.classList.remove("selected");
    				nextElem = elem.nextElementSibling;
    			} else {
    				nextElem = elem;
    			}

    			if (!nextElem) {
    				nextElem = scrollParentRef.querySelector("li.o:first-child");
    			}

    			if (nextElem) {
    				nextElem.classList.add("selected");
    			}
    		}

    		scrollToSelected();
    	}

    	function selectFocused() {
    		let elem = scrollParentRef.querySelector(".selected");

    		if (elem) {
    			elem.click();
    			return true;
    		}

    		return false;
    	}

    	function clearSelected() {
    		let elem = getHovered();

    		if (elem && elem.classList.contains("selected")) {
    			elem.classList.remove("selected");
    		}
    	}

    	function onOptionsChange() {
    		tick().then(function () {
    			scrollToSelected();
    		});
    	}

    	function getHovered() {
    		let hoveredElem = scrollParentRef.querySelector(".selected");

    		if (!hoveredElem) {
    			hoveredElem = scrollParentRef.querySelector(".o");
    		}

    		return hoveredElem;
    	}

    	function scrollToSelected() {
    		let elem = scrollParentRef.querySelector(".selected");

    		if (elem) {
    			if (elem.offsetTop + elem.clientHeight > scrollParentRef.scrollTop + scrollParentRef.clientHeight) {
    				$$invalidate(7, scrollParentRef.scrollTop = elem.offsetTop, scrollParentRef);
    			} else if (elem.offsetTop < scrollParentRef.scrollTop) {
    				$$invalidate(7, scrollParentRef.scrollTop = elem.offsetTop, scrollParentRef);
    			}
    		}

    		return elem;
    	}

    	function selection_handler(event) {
    		bubble($$self, event);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, scrollParentRef = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("options" in $$props) $$invalidate(0, options = $$props.options);
    		if ("optionComponent" in $$props) $$invalidate(1, optionComponent = $$props.optionComponent);
    		if ("textKey" in $$props) $$invalidate(2, textKey = $$props.textKey);
    		if ("childKey" in $$props) $$invalidate(3, childKey = $$props.childKey);
    		if ("totalCount" in $$props) $$invalidate(4, totalCount = $$props.totalCount);
    		if ("getFormatted" in $$props) $$invalidate(5, getFormatted = $$props.getFormatted);
    		if ("isSelected" in $$props) $$invalidate(6, isSelected = $$props.isSelected);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options*/ 1) {
    			 onOptionsChange();
    		}
    	};

    	return [
    		options,
    		optionComponent,
    		textKey,
    		childKey,
    		totalCount,
    		getFormatted,
    		isSelected,
    		scrollParentRef,
    		moveUp,
    		moveDown,
    		selectFocused,
    		clearSelected,
    		dispatch,
    		onOptionsChange,
    		getHovered,
    		scrollToSelected,
    		selection_handler,
    		div0_binding
    	];
    }

    class OptionHolder extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, not_equal, {
    			options: 0,
    			optionComponent: 1,
    			textKey: 2,
    			childKey: 3,
    			totalCount: 4,
    			getFormatted: 5,
    			isSelected: 6,
    			moveUp: 8,
    			moveDown: 9,
    			selectFocused: 10,
    			clearSelected: 11
    		});
    	}

    	get moveUp() {
    		return this.$$.ctx[8];
    	}

    	get moveDown() {
    		return this.$$.ctx[9];
    	}

    	get selectFocused() {
    		return this.$$.ctx[10];
    	}

    	get clearSelected() {
    		return this.$$.ctx[11];
    	}
    }

    var GeneralUtils = {

      getUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },

      closest(elem, refelem) {
        while(elem !== refelem) {
          elem = elem.parentNode;
          if(!elem) {
            return null;
          }
        }
        return elem;
      }

    };

    class CancellablePromise {
      constructor(fn, onCancel) {
        this._rsvp = new Promise(fn);
        this._isActive = true;
        this._onCancel = onCancel;
      }

      getId() {
        if(!this._uuid) {
          this._uuid = GeneralUtils.getUUID();
        }
        return this._uuid;
      }

      cancel() {
        this._isActive = false;
        if(this._onCancel) {
          this._onCancel();
        }
        return this;
      }

      then(resolve, reject) {
        let self = this;
        this._rsvp.then(
          function(result) {
            if(self._isActive && resolve) {
              resolve(result);
            }
          },
          function(reason) {
            if(self._isActive && reject) {
              reject(reason);
            }
          }
        );
        return this;
      }

      finally(fn) {
        let self = this;
        this._rsvp.finally(function() {
          if(self._isActive) {
            fn();
          }
        });
        return this;
      }
    }

    function subTree(tree, childKey, conditionFn, cpac) {
      let stree = [];
      tree.forEach(elem => {
        if(elem[childKey]) {
          let isIn = cpac ? conditionFn(elem) : true;
          if(isIn) {
            let childSubTree = subTree(elem[childKey], childKey, conditionFn, cpac);
            if(childSubTree.length > 0) {
              let toUpdateChildren = {};
              toUpdateChildren[childKey] = childSubTree;
              stree.push(
                Object.assign({}, elem, toUpdateChildren)
              );
            }
          }
        }
        else if(conditionFn(elem)) {
          stree.push(elem);
        }
      });
      return stree;
    }
    function stringContains(actualString, searchVal) {
      return actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;
    }
    function filterDataTree(datasource, childKey, textKey, searchVal) {
      return subTree(datasource, childKey, function(el) {
        return stringContains(el[textKey], searchVal);
      });
    }
    var FilterUtil = {
      subTree,
      stringContains,
      filterDataTree
    };

    function DataFetcher(datasource, searchVal, textKey, childKey, datasourceArgs) {
      if(datasource) {
        let isFunc = (typeof datasource === "function");
        let resDS = isFunc ? datasource(searchVal, datasourceArgs) : FilterUtil.filterDataTree(datasource, childKey, textKey, searchVal);

        return new CancellablePromise(
          function(resolve, reject) {
            if(isFunc) {
              resDS.then(
                function(res) {
                  resolve({ content: res.content, count: res.count });
                },
                function() {
                  reject();
                }
              );
            }
            else {
              resolve({ content: resDS });
            }
          },
          function() {
            if(isFunc) {
              resDS.cancel();
            }
          }
        );
      }
      else {
        return new CancellablePromise(function(resolve, reject) {
          reject();
        });
      }
    }

    /* src/components/Main.svelte generated by Svelte v3.20.1 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	child_ctx[48] = i;
    	return child_ctx;
    }

    // (225:29) 
    function create_if_block_5(ctx) {
    	let t;

    	return {
    		c() {
    			t = text(/*placeholder*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*placeholder*/ 4) set_data(t, /*placeholder*/ ctx[2]);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (216:48) 
    function create_if_block_4(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*selected*/ ctx[0];
    	const get_key = ctx => /*elem*/ ctx[46][/*valueKey*/ ctx[6]];

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

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
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*removeSelection, selected, getFormatted*/ 4718593) {
    				const each_value = /*selected*/ ctx[0];
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    			}
    		},
    		d(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (211:6) {#if !multiple}
    function create_if_block_2(ctx) {
    	let if_block_anchor;
    	let if_block = /*noSearchView*/ ctx[17] && create_if_block_3(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (/*noSearchView*/ ctx[17]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (217:8) {#each selected as elem, index (elem[valueKey])}
    function create_each_block$1(key_1, ctx) {
    	let span1;
    	let t0_value = /*getFormatted*/ ctx[19]("selected", /*elem*/ ctx[46]) + "";
    	let t0;
    	let t1;
    	let span0;
    	let t3;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[40](/*index*/ ctx[48], ...args);
    	}

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			span1 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "×";
    			t3 = space();
    			attr(span1, "class", "tag");
    			this.first = span1;
    		},
    		m(target, anchor, remount) {
    			insert(target, span1, anchor);
    			append(span1, t0);
    			append(span1, t1);
    			append(span1, span0);
    			append(span1, t3);
    			if (remount) dispose();
    			dispose = listen(span0, "click", click_handler);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*selected*/ 1 && t0_value !== (t0_value = /*getFormatted*/ ctx[19]("selected", /*elem*/ ctx[46]) + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(span1);
    			dispose();
    		}
    	};
    }

    // (212:8) {#if noSearchView}
    function create_if_block_3(ctx) {
    	let t_value = (/*selected*/ ctx[0]
    	? /*getFormatted*/ ctx[19]("selected", /*selected*/ ctx[0])
    	: /*placeholder*/ ctx[2]) + "";

    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*selected, placeholder*/ 5 && t_value !== (t_value = (/*selected*/ ctx[0]
    			? /*getFormatted*/ ctx[19]("selected", /*selected*/ ctx[0])
    			: /*placeholder*/ ctx[2]) + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (241:6) {:else}
    function create_else_block$1(ctx) {
    	let span;
    	let t_value = (/*isOpen*/ ctx[12] ? "chevron-up" : "chevron-down") + "";
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*isOpen*/ 4096 && t_value !== (t_value = (/*isOpen*/ ctx[12] ? "chevron-up" : "chevron-down") + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (236:6) {#if state === "loading" && isOpen}
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
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div1);
    		}
    	};
    }

    // (248:2) {#if isOpen}
    function create_if_block$2(ctx) {
    	let current;

    	let optionholder_props = {
    		options: /*optionsToShow*/ ctx[13],
    		textKey: /*textKey*/ ctx[5],
    		childKey: /*childKey*/ ctx[7],
    		getFormatted: /*getFormatted*/ ctx[19],
    		isSelected: /*isSelected*/ ctx[18],
    		totalCount: /*totalCount*/ ctx[15]
    	};

    	const optionholder = new OptionHolder({ props: optionholder_props });
    	/*optionholder_binding*/ ctx[44](optionholder);
    	optionholder.$on("selection", /*selectOption*/ ctx[21]);

    	return {
    		c() {
    			create_component(optionholder.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(optionholder, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const optionholder_changes = {};
    			if (dirty[0] & /*optionsToShow*/ 8192) optionholder_changes.options = /*optionsToShow*/ ctx[13];
    			if (dirty[0] & /*textKey*/ 32) optionholder_changes.textKey = /*textKey*/ ctx[5];
    			if (dirty[0] & /*childKey*/ 128) optionholder_changes.childKey = /*childKey*/ ctx[7];
    			if (dirty[0] & /*totalCount*/ 32768) optionholder_changes.totalCount = /*totalCount*/ ctx[15];
    			optionholder.$set(optionholder_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(optionholder.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(optionholder.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			/*optionholder_binding*/ ctx[44](null);
    			destroy_component(optionholder, detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t0;
    	let input;
    	let t1;
    	let div1;
    	let t2;
    	let div3_class_value;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*multiple*/ ctx[4]) return create_if_block_2;
    		if (/*selected*/ ctx[0] && /*selected*/ ctx[0].length > 0) return create_if_block_4;
    		if (/*noSearchView*/ ctx[17]) return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*state*/ ctx[14] === "loading" && /*isOpen*/ ctx[12]) return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*isOpen*/ ctx[12] && create_if_block$2(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			div1 = element("div");
    			if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			set_input_type(input, "text");
    			attr(input, "class", "search-input");
    			attr(input, "placeholder", "search");
    			set_style(input, "width", (/*searchVal*/ ctx[11].length + 1) * 0.6 + "em");
    			toggle_class(input, "hidden", /*noSearchView*/ ctx[17]);
    			attr(div0, "class", "slmd-inner");
    			attr(div1, "class", "status-ind");
    			attr(div2, "class", "selected-option");
    			toggle_class(div2, "placeholder", !/*selected*/ ctx[0] || /*multiple*/ ctx[4] && /*selected*/ ctx[0].length === 0);
    			attr(div3, "class", div3_class_value = "select-madu " + /*classes*/ ctx[1]);
    			attr(div3, "tabindex", "0");
    			toggle_class(div3, "multiple", /*multiple*/ ctx[4]);
    			toggle_class(div3, "open", /*isOpen*/ ctx[12]);
    			toggle_class(div3, "disabled", /*disabled*/ ctx[3]);
    		},
    		m(target, anchor, remount) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append(div0, t0);
    			append(div0, input);
    			/*input_binding*/ ctx[41](input);
    			set_input_value(input, /*searchVal*/ ctx[11]);
    			append(div2, t1);
    			append(div2, div1);
    			if_block1.m(div1, null);
    			/*div2_binding*/ ctx[43](div2);
    			append(div3, t2);
    			if (if_block2) if_block2.m(div3, null);
    			/*div3_binding*/ ctx[45](div3);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen(window, "click", /*checkAndClose*/ ctx[24]),
    				listen(input, "input", /*input_input_handler*/ ctx[42]),
    				listen(input, "focus", /*onFocusIn*/ ctx[26]),
    				listen(input, "blur", /*onFocusOut*/ ctx[27]),
    				listen(div0, "click", /*checkAndOpen*/ ctx[23]),
    				listen(div1, "click", /*toggle*/ ctx[20]),
    				listen(div3, "keydown", /*keyDown*/ ctx[25])
    			];
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			}

    			if (!current || dirty[0] & /*searchVal*/ 2048) {
    				set_style(input, "width", (/*searchVal*/ ctx[11].length + 1) * 0.6 + "em");
    			}

    			if (dirty[0] & /*searchVal*/ 2048 && input.value !== /*searchVal*/ ctx[11]) {
    				set_input_value(input, /*searchVal*/ ctx[11]);
    			}

    			if (dirty[0] & /*noSearchView*/ 131072) {
    				toggle_class(input, "hidden", /*noSearchView*/ ctx[17]);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}

    			if (dirty[0] & /*selected, multiple*/ 17) {
    				toggle_class(div2, "placeholder", !/*selected*/ ctx[0] || /*multiple*/ ctx[4] && /*selected*/ ctx[0].length === 0);
    			}

    			if (/*isOpen*/ ctx[12]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div3, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*classes*/ 2 && div3_class_value !== (div3_class_value = "select-madu " + /*classes*/ ctx[1])) {
    				attr(div3, "class", div3_class_value);
    			}

    			if (dirty[0] & /*classes, multiple*/ 18) {
    				toggle_class(div3, "multiple", /*multiple*/ ctx[4]);
    			}

    			if (dirty[0] & /*classes, isOpen*/ 4098) {
    				toggle_class(div3, "open", /*isOpen*/ ctx[12]);
    			}

    			if (dirty[0] & /*classes, disabled*/ 10) {
    				toggle_class(div3, "disabled", /*disabled*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);

    			if (if_block0) {
    				if_block0.d();
    			}

    			/*input_binding*/ ctx[41](null);
    			if_block1.d();
    			/*div2_binding*/ ctx[43](null);
    			if (if_block2) if_block2.d();
    			/*div3_binding*/ ctx[45](null);
    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { classes = "" } = $$props;
    	let { placeholder = "Select option" } = $$props;
    	let { selected } = $$props;
    	let { datasource = [] } = $$props; // [] | Function returning promise
    	let { disabled = false } = $$props;
    	let { multiple = false } = $$props;
    	let { search = true } = $$props;
    	let { textKey = "text" } = $$props;
    	let { valueKey = "text" } = $$props;
    	let { childKey = "children" } = $$props;
    	let { formatters = null } = $$props;

    	function getSelected() {
    		return selected;
    	}

    	let baseRef;
    	let searchInputRef;
    	let listOptsRef;
    	let searchVal = "";
    	let isOpen = false;
    	let optionsToShow = [];
    	let state = "loading"; //loading, ready
    	let isInternalOp = false;
    	let totalCount = 0;
    	let selOptRef;
    	let fetchPromise;

    	let isSelected = function (_opt) {
    		if (!multiple) {
    			return !_opt.disabled && selected && selected[valueKey] === _opt[valueKey];
    		} else {
    			return selected && selected.map(elem => elem[valueKey]).indexOf(_opt[valueKey]) !== -1;
    		}
    	};

    	let getFormatted = function (_multiple, _obj) {
    		return FormatterUtil.formatByType(formatters, _multiple, _obj, textKey);
    	};

    	function fetchData(_datasource, _searchVal, _multiple) {
    		$$invalidate(14, state = "loading");

    		if (fetchPromise) {
    			fetchPromise.cancel();
    		}

    		fetchPromise = DataFetcher(_datasource, _searchVal, textKey, childKey);

    		fetchPromise.then(
    			function (res) {
    				setData(_multiple, res.content, res.count);
    				$$invalidate(14, state = "ready");
    			},
    			function () {
    				$$invalidate(14, state = "error");
    			}
    		);
    	}

    	function setData(_multiple, data, count) {
    		$$invalidate(13, optionsToShow = data);
    		$$invalidate(15, totalCount = count);

    		if (!_multiple && !selected && optionsToShow.length > 0) {
    			let sel = optionsToShow[0];

    			while (sel[childKey]) {
    				sel = sel[childKey][0];
    			}

    			setSelected(sel);
    		}
    	}

    	function open() {
    		$$invalidate(12, isOpen = true);

    		tick().then(function () {
    			if (searchInputRef) {
    				searchInputRef.focus();
    			}
    		});
    	}

    	function toggle() {
    		isInternalOp = true;

    		if (isOpen) {
    			hide();
    		} else {
    			open();
    		}
    	}

    	function hide() {
    		$$invalidate(12, isOpen = false);
    		$$invalidate(11, searchVal = "");
    	}

    	function selectOption(event) {
    		let opt = event.detail;

    		if (!multiple) {
    			if (selected !== opt) {
    				setSelected(opt);
    			}

    			hide();
    		} else {
    			if (selected) {
    				if (!selected.find(el => el[valueKey] === opt[valueKey])) {
    					setSelected([...selected, opt]);
    				}
    			} else {
    				setSelected([opt]);
    			}

    			$$invalidate(11, searchVal = "");
    			open();
    		}
    	}

    	function removeSelection(index) {
    		isInternalOp = true;
    		selected.splice(index, 1);
    		setSelected([].concat(selected));
    	}

    	function setSelected(_selected) {
    		$$invalidate(0, selected = _selected);

    		tick().then(function () {
    			dispatch("selection", selected);
    		});
    	}

    	function checkAndOpen() {
    		tick().then(function () {
    			if (!isInternalOp) {
    				open();
    			}

    			isInternalOp = false;
    		});
    	}

    	function checkAndClose() {
    		if (isOpen) {
    			tick().then(function () {
    				if (!isInternalOp && !GeneralUtils.closest(event.target, baseRef)) {
    					hide();
    				}

    				isInternalOp = false;
    			});
    		}
    	}

    	function keyDown(e) {
    		if (e.keyCode === 13) {
    			if (!isOpen) {
    				open();
    			} else if (listOptsRef && listOptsRef.selectFocused()) {
    				hide();
    			}
    		} else if (e.keyCode === 27 || e.keyCode === 9) {
    			// esc or tab
    			if (isOpen) {
    				hide();
    			}
    		} else if (e.keyCode === 40) {
    			// down arrow
    			if (!isOpen) {
    				open();
    			} else if (listOptsRef) {
    				listOptsRef.moveDown();
    			}
    		} else if (e.keyCode === 38 && listOptsRef) {
    			// up arrow
    			listOptsRef.moveUp();
    		}
    	}

    	function onFocusIn() {
    		baseRef.classList.add("focus");
    	}

    	function onFocusOut() {
    		baseRef.classList.remove("focus");
    	}

    	const click_handler = (index, e) => removeSelection(index);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(9, searchInputRef = $$value);
    		});
    	}

    	function input_input_handler() {
    		searchVal = this.value;
    		$$invalidate(11, searchVal);
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(16, selOptRef = $$value);
    		});
    	}

    	function optionholder_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(10, listOptsRef = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(8, baseRef = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("classes" in $$props) $$invalidate(1, classes = $$props.classes);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("datasource" in $$props) $$invalidate(28, datasource = $$props.datasource);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("multiple" in $$props) $$invalidate(4, multiple = $$props.multiple);
    		if ("search" in $$props) $$invalidate(29, search = $$props.search);
    		if ("textKey" in $$props) $$invalidate(5, textKey = $$props.textKey);
    		if ("valueKey" in $$props) $$invalidate(6, valueKey = $$props.valueKey);
    		if ("childKey" in $$props) $$invalidate(7, childKey = $$props.childKey);
    		if ("formatters" in $$props) $$invalidate(30, formatters = $$props.formatters);
    	};

    	let noSearchView;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*datasource, searchVal, multiple*/ 268437520) {
    			 fetchData(datasource, searchVal, multiple);
    		}

    		if ($$self.$$.dirty[0] & /*isOpen, search*/ 536875008) {
    			 $$invalidate(17, noSearchView = !isOpen || !search);
    		}
    	};

    	return [
    		selected,
    		classes,
    		placeholder,
    		disabled,
    		multiple,
    		textKey,
    		valueKey,
    		childKey,
    		baseRef,
    		searchInputRef,
    		listOptsRef,
    		searchVal,
    		isOpen,
    		optionsToShow,
    		state,
    		totalCount,
    		selOptRef,
    		noSearchView,
    		isSelected,
    		getFormatted,
    		toggle,
    		selectOption,
    		removeSelection,
    		checkAndOpen,
    		checkAndClose,
    		keyDown,
    		onFocusIn,
    		onFocusOut,
    		datasource,
    		search,
    		formatters,
    		getSelected,
    		isInternalOp,
    		fetchPromise,
    		dispatch,
    		fetchData,
    		setData,
    		open,
    		hide,
    		setSelected,
    		click_handler,
    		input_binding,
    		input_input_handler,
    		div2_binding,
    		optionholder_binding,
    		div3_binding
    	];
    }

    class Main extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			not_equal,
    			{
    				classes: 1,
    				placeholder: 2,
    				selected: 0,
    				datasource: 28,
    				disabled: 3,
    				multiple: 4,
    				search: 29,
    				textKey: 5,
    				valueKey: 6,
    				childKey: 7,
    				formatters: 30,
    				getSelected: 31
    			},
    			[-1, -1]
    		);
    	}

    	get getSelected() {
    		return this.$$.ctx[31];
    	}
    }

    return Main;

})));

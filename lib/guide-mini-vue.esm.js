const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props && props.key,
        shapeFlags: getShapeFlags(type),
    };
    if (typeof children === 'string') {
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 & children object
    if (vnode.shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlags |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlags(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    // return createVNode('div',{},slots)
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            // children 不可以有 array
            // return createVNode('div',{},slot(props))
            // Fragment
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const EMPTY_OBJECT = {};
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasChange = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// add-foo -> addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
// add -> Add
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 优化 清除过后 不用再次清理
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach(dep => {
        dep.delete(effect); // deps => Set() 因此 使用 delete() 删除
    });
    effect.deps.lenght = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    // if(!activeEffect) return // 当执行 effect() 时才会 使用到下面的代码
    // if(!shouldTrack) return 
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options 对功能模块进行抽离 使其应用时更有寓意话
    extend(_effect, options); // _effect.onStop=options.onStop -> Object.assign(_effect,options) -> extend(_effect,options)
    _effect.run();
    const runner = _effect.run.bind(_effect); // run() 中存在 this 使用 bind() 将this指针 指向当前实例对象
    runner.effect = _effect;
    return runner;
}

// 将代码抽离出 避免重复多次调用 损耗性能
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        // target -> {foo:1}
        // key -> foo
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // look res 是不是 object
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // TODO 依赖收集
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        // 返回 警告 提示 信息
        console.warn(`key:${key} set 失败 因为 target 是 readonly`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // look value 是否 is object
        // this._value=value
        this._value = convert(value); // this._value=isObject(value)?reactive(value):value
        this.rawValue = value;
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 一定先修改 value
        // newValue -> this._value
        // if(hasChange(newValue,this._value)){ // because reactive() reutrn Proxy so this._value maybe is prototype
        if (hasChange(newValue, this.rawValue)) {
            this.rawValue = newValue;
            // this._value=newValue
            this._value = convert(newValue); // this._value=isObject(newValue)?reactive(newValue):newValue
            triggerEffect(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // look ref 是不是 ref ? return value : return ref
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            // key yes ref return .value
            // key no ref return value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) { // key yes ref && value no ref
                return target[key].value = value; // set .value
            }
            else { // key no ref && value yes ref
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...args) {
    console.log(event);
    // instance.props -> event
    const { props } = instance;
    // TPP
    // 先写一个特定的行为 -> 重构成通用的行为
    // 特定行为
    // const handler=props['onAdd']
    // handler && handler()
    // 通用行为
    // add-foo -> addFoo
    // add -> Add
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicProperitesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // if(key in setupState){
        //     return setupState[key]
        // }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicProperitesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // if(key === '$el'){
        //     return instance.vnode.el
        // }
    }
};

function initSlots(instance, children) {
    // instance.slots=Array.isArray(children) ? children : [children]
    const { vnode } = instance;
    if (vnode.shapeFlags & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent,
        provides: parent ? parent.provides : {},
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance); // 处理 调用setup() 之后的返回值
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) { // setup maybe is null
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        // setup maybe is Function or Object
        handleSetupResult(instance, setupResult); // 当 setup 为 Object
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult); // 将对象赋值到组件实例上
    }
    finishComponentSetup(instance); // 保证组件的render是有值的
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if(Component.render){
    instance.render = Component.render; // 将render挂载到实例上
    // }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // init
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // component -> vnode
                // 所有的操作都会基于vnode做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, rootContainer) {
        patch(null, vnode, rootContainer, null, null);
    }
    // n1 old n2 new
    function patch(n1, n2, container, parentComponent, anthro) {
        // 判断 是component 还是 element
        // vnode.type -> object || string
        // console.log(vnode.type);
        const { type, shapeFlags } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anthro);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (1 /* ShapeFlags.ELEMENT */ & shapeFlags) {
                    processElement(n1, n2, container, parentComponent, anthro);
                }
                else if (2 /* ShapeFlags.STATEFUL_COMPONENT */ & shapeFlags) {
                    processComponent(n1, n2, container, parentComponent, anthro);
                }
                break;
        }
        /* if(typeof vnode.type==='string'){
            mountElement(vnode,container)
        }else if(isObject(vnode.type)){
            processComponent(vnode,container)
        } */
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textVNode = (n2.el = document.createTextNode(children));
        container.append(textVNode);
    }
    function processFragment(n1, n2, container, parentComponent, anthro) {
        mountChildren(n2.children, container, parentComponent, anthro);
    }
    function processElement(n1, n2, container, parentComponent, anthro) {
        if (!n1) { // n1 不存在 就是 初始化
            mountElement(n2, container, parentComponent, anthro);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anthro);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anthro) {
        console.log('patchElement');
        console.log('n1', n1);
        console.log('n2', n2);
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anthro);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anthro) {
        const prevShapeFlags = n1.shapeFlags;
        const c1 = n1.children;
        const { shapeFlags } = n2;
        const c2 = n2.children;
        // new is text
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) { // old is array
                // 1.把老的 children 清空
                unmountChildren(n1.children);
                // 2.设置 text
                // hostSetElementText(container,c2)
            }
            /*else{// old is text
                if(c1 !== c2){
                    hostSetElementText(container,c2)
                }
            } */
            if (c1 !== c2) { // old is text
                hostSetElementText(container, c2);
            }
        }
        else { // new is array
            if (prevShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) { // old is text
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anthro);
            }
            else { // old is array
                patchKeyedChildren(c1, c2, container, parentComponent, anthro);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, processAnthro) {
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let i = 0;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.key === n2.key && n1.type === n2.type;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, processAnthro);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, processAnthro);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anthro = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anthro);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJECT) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anthro) {
        // vnode -> element -> div
        // const el=(vnode.el=document.createElement(vnode.type))
        const el = (vnode.el = hostCreateElement(vnode.type));
        // children -> string || array
        const { children, shapeFlags } = vnode;
        if (4 /* ShapeFlags.TEXT_CHILDREN */ & shapeFlags) {
            el.textContent = children;
        }
        else if (8 /* ShapeFlags.ARRAY_CHILDREN */ & shapeFlags) {
            mountChildren(vnode.children, el, parentComponent, anthro);
        }
        /* if(typeof children==='string'){
            el.textContent=children
        }else if(Array.isArray(children)){
            mountChildren(vnode,el)
        } */
        // props
        const { props } = vnode;
        for (let key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anthro);
    }
    function mountChildren(children, container, parentComponent, anthro) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anthro);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anthro) {
        mountComponent(n2, container, parentComponent, anthro); // 挂载组件
    }
    function mountComponent(instanceVNode, container, parentComponent, anthro) {
        const instance = createComponentInstance(instanceVNode, parentComponent); // 抽离组件对象 并 创建组件实例 
        setupComponent(instance);
        setupRenderEffect(instanceVNode, instance, container, anthro);
    }
    function setupRenderEffect(instanceVNode, instance, container, anthro) {
        // 实现 响应式数据 依赖收集
        effect(() => {
            // 判断 是 init 还是 update
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                // 调用render()返回vnode -> patch()
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anthro);
                // element -> mount
                instanceVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                // 调用render()返回vnode -> patch()
                const subTree = instance.render.call(proxy); // new component instance
                const prevSubTree = instance.subTree; // old component instance
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anthro);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // on + Event name 
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) { //if(key === 'onClick'){
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anthro) {
    // parent.append(el)
    parent.insertBefore(child, anthro);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const render = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...arg) {
    return render.createApp(...arg);
}

function add(a, b) {
    return a + b;
}

export { add, createApp, createRender, createTextVNode, getCurrentInstance, h, inject, provide, ref, renderSlots };

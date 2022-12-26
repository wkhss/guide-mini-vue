'use strict';

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

const targetMap = new Map();
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

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicProperitesMap = {
    $el: (i) => i.vnode.el
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    setupStatefulComponent(instance); // 处理 调用setup() 之后的返回值
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) { // setup maybe is null
        const setupResult = setup(shallowReadonly(instance.props));
        // setup maybe is Function or Object
        handleSetupResult(instance, setupResult); // 当 setup 为 Object
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult; // 将对象赋值到组件实例上
    }
    finishComponentSetup(instance); // 保证组件的render是有值的
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if(Component.render){
    instance.render = Component.render; // 将render挂载到实例上
    // }
}

function render(vnode, rootContainer) {
    patch(vnode, rootContainer);
}
function patch(vnode, container) {
    // 判断 是component 还是 element
    // vnode.type -> object || string
    // console.log(vnode.type);
    const { shapeFlags } = vnode;
    if (1 /* ShapeFlags.ELEMENT */ & shapeFlags) {
        mountElement(vnode, container);
    }
    else if (2 /* ShapeFlags.STATEFUL_COMPONENT */ & shapeFlags) {
        processComponent(vnode, container);
    }
    /* if(typeof vnode.type==='string'){
        mountElement(vnode,container)
    }else if(isObject(vnode.type)){
        processComponent(vnode,container)
    } */
}
function mountElement(vnode, container) {
    // vnode -> element -> div
    const el = (vnode.el = document.createElement(vnode.type));
    // children -> string || array
    const { children, shapeFlags } = vnode;
    if (4 /* ShapeFlags.TEXT_CHILDREN */ & shapeFlags) {
        el.textContent = children;
    }
    else if (8 /* ShapeFlags.ARRAY_CHILDREN */ & shapeFlags) {
        mountChildren(vnode, el);
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
        // on + Event name 
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) { //if(key === 'onClick'){
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container); // 挂载组件
}
function mountComponent(instanceVNode, container) {
    const instance = createComponentInstance(instanceVNode); // 抽离组件对象 并 创建组件实例 
    setupComponent(instance);
    setupRenderEffect(instanceVNode, instance, container);
}
function setupRenderEffect(instanceVNode, instance, container) {
    const { proxy } = instance;
    // 调用render()返回vnode -> patch()
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // element -> mount
    instanceVNode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlags: getShapeFlags(type),
    };
    if (typeof children === 'string') {
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlags(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // component -> vnode
            // 所有的操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;

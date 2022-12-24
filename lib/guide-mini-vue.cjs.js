'use strict';

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

const publicProperitesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
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
        setupState: {}
    };
    return component;
}
function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance); // 处理 调用setup() 之后的返回值
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) { // setup maybe is null
        const setupResult = setup();
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
    console.log(vnode.type);
    if (typeof vnode.type === 'string') {
        mountElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function mountElement(vnode, container) {
    // vnode -> element -> div
    const el = (vnode.el = document.createElement(vnode.type));
    // children -> string || array
    const { children } = vnode;
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
        const val = props[key];
        el.setAttribute(key, val);
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
    };
    return vnode;
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

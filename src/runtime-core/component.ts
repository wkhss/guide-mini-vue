
export function createComponentInstance(vnode){
    const component={
        vnode,
        type:vnode.type
    }
    return component
}

export function setupComponent(instance){
    // initProps
    // initSlots
    setupStatefulComponent(instance)// 处理 调用setup() 之后的返回值
} 

function setupStatefulComponent(instance){
    const component=instance.type
    const {setup}=component
    if(setup){// setup maybe is null
        const setupResult = setup()
        // setup maybe is Function or Object
        handleSetupResult(instance,setupResult)// 当 setup 为 Object
    }
}

function handleSetupResult(instance,setupResult:any){
    if(typeof setupResult === 'object'){
        instance.setupState=setupResult// 将对象赋值到组件实例上
    }
    finishComponentSetup(instance)// 保证组件的render是有值的
}

function finishComponentSetup(instance){
    const Component=instance.type
    if(Component.render){
        instance.render=Component.render// 将render挂载到实例上
    }
}
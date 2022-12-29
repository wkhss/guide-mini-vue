import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode,parent){
    const component={
        vnode,
        type:vnode.type,
        setupState:{},
        props:{},
        slots:{},
        parent,
        provides:parent ? parent.provides : {},
        emit:()=>{},
    }
    component.emit=emit.bind(null,component) as any
    return component
}

export function setupComponent(instance){
    // initProps
    initProps(instance,instance.vnode.props)
    // initSlots
    initSlots(instance,instance.vnode.children)
    setupStatefulComponent(instance)// 处理 调用setup() 之后的返回值
} 

function setupStatefulComponent(instance){
    const component=instance.type
    instance.proxy=new Proxy({_:instance},PublicInstanceProxyHandlers)
    const {setup}=component
    if(setup){// setup maybe is null
        setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props),{
            emit:instance.emit
        })
        setCurrentInstance(null)
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
    // if(Component.render){
        instance.render=Component.render// 将render挂载到实例上
    // }
}

let currentInstance=null
export function getCurrentInstance(){
    return currentInstance
}

export function setCurrentInstance(instance){
    currentInstance=instance
}
import { ShapeFlags } from "../shared/ShapeFlags"
export const Fragment=Symbol('Fragment')
export const Text=Symbol('Text')
export function createVNode(type,props?,children?){
    const vnode={
        type,
        props,
        children,
        component:null,
        el:null,
        key:props && props.key,
        shapeFlags:getShapeFlags(type),
    }
    if(typeof children === 'string'){
        vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
    }else if(Array.isArray(children)){
        vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
    }

    // 组件 & children object
    if(vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT){
        if(typeof children === 'object'){
            vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN
        }
    }
    return vnode
}
export function createTextVNode(text:string){
    return createVNode(Text,{},text)
}
function getShapeFlags(type){
    return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
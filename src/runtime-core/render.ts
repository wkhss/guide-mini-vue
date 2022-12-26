import { isObject } from "../shared"
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent} from "./component"

export function render(vnode,rootContainer){
    patch(vnode,rootContainer)
}

function patch(vnode,container:any){// patch() 用于递归处理component
    // 判断 是component 还是 element
    // vnode.type -> object || string
    // console.log(vnode.type);
    const { shapeFlags } = vnode
    if(ShapeFlags.ELEMENT & shapeFlags){
        mountElement(vnode,container)
    }else if(ShapeFlags.STATEFUL_COMPONENT & shapeFlags){
        processComponent(vnode,container)
    }
    /* if(typeof vnode.type==='string'){
        mountElement(vnode,container)
    }else if(isObject(vnode.type)){
        processComponent(vnode,container)
    } */
}

function mountElement(vnode,container:any){
    // vnode -> element -> div
    const el=(vnode.el=document.createElement(vnode.type))

    // children -> string || array
    const {children,shapeFlags}=vnode
    if(ShapeFlags.TEXT_CHILDREN & shapeFlags){
        el.textContent=children
    }else if(ShapeFlags.ARRAY_CHILDREN & shapeFlags){
        mountChildren(vnode,el)
    }
    /* if(typeof children==='string'){
        el.textContent=children
    }else if(Array.isArray(children)){
        mountChildren(vnode,el)
    } */

    // props
    const {props}=vnode
    for(let key in props){
        const val=props[key]
        // on + Event name 
        const isOn=(key:string)=>/^on[A-Z]/.test(key)
        if(isOn(key)){//if(key === 'onClick'){
            const event=key.slice(2).toLowerCase()
            el.addEventListener(event,val)
        }else{
            el.setAttribute(key,val)
        }
    }

    container.append(el)
}

function mountChildren(vnode,container){
    vnode.children.forEach((v)=>{
        patch(v,container)
    })
}

function processComponent(vnode,container:any){
    mountComponent(vnode,container)// 挂载组件
}

function mountComponent(instanceVNode,container:any){
    const instance=createComponentInstance(instanceVNode)// 抽离组件对象 并 创建组件实例 
    setupComponent(instance)
    setupRenderEffect(instanceVNode,instance,container)
}

function setupRenderEffect(instanceVNode,instance,container:any){
    const {proxy}=instance
    // 调用render()返回vnode -> patch()
    const subTree=instance.render.call(proxy)
    patch(subTree,container)
    // element -> mount
    instanceVNode.el=subTree.el
}
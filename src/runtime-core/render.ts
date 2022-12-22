import { isObject } from "../shared"
import { createComponentInstance, setupComponent} from "./component"

export function render(vnode,rootContainer){
    patch(vnode,rootContainer)
}

function patch(vnode,container:any){// patch() 用于递归处理component
    // 判断 是component 还是 element
    // vnode.type -> object || string
    console.log(vnode.type);
    if(typeof vnode.type==='string'){
        mountElement(vnode,container)
    }else if(isObject(vnode.type)){
        processComponent(vnode,container)
    }
}

function mountElement(vnode,container:any){
    const el=document.createElement(vnode.type)

    // children -> string || array
    const {children}=vnode
    if(typeof children==='string'){
        el.textContent=children
    }else if(Array.isArray(children)){
        mountChildren(vnode,el)
    }

    // props
    const {props}=vnode
    for(let key in props){
        const val=props[key]
        el.setAttribute(key,val)
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

function mountComponent(vnode,container:any){
    const instance=createComponentInstance(vnode)// 抽离组件对象 并 创建组件实例 
    setupComponent(instance)
    setupRenderEffect(instance,container)
}

function setupRenderEffect(instance,container:any){
    // 调用render()返回vnode -> patch()
    const subTree=instance.render()
    patch(subTree,container)
}
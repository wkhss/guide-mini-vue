import { createComponentInstance, setupComponent} from "./component"

export function render(vnode,rootContainer){
    patch(vnode,rootContainer)
}

function patch(vnode,container:any){// patch() 用于递归处理component
    // 判断 是component 还是 element
    processComponent(vnode,container)
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
    const subTree=instance.render
    patch(subTree,container)
}
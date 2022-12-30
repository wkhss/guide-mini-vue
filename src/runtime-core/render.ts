import { isObject } from "../shared"
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent} from "./component"
import { createAppApi } from "./createApp";
import { Fragment,Text } from "./vnode";

export function createRender(options){
    const {createElement:hostCreateElement,patchProp:hostPatchProp,insert:hostInsert}=options

    function render(vnode,rootContainer){
        patch(vnode,rootContainer,null)
    }

    function patch(vnode,container:any,parentComponent){// patch() 用于递归处理component
        // 判断 是component 还是 element
        // vnode.type -> object || string
        // console.log(vnode.type);
        const { type, shapeFlags } = vnode
        switch(type){
            case Fragment:
                processFragment(vnode,container,parentComponent)
            break;
            case Text:
                processText(vnode,container)
            break;
            default:
                if(ShapeFlags.ELEMENT & shapeFlags){
                    processElement(vnode,container,parentComponent)
                }else if(ShapeFlags.STATEFUL_COMPONENT & shapeFlags){
                    processComponent(vnode,container,parentComponent)
                }
            break;
        }
        /* if(typeof vnode.type==='string'){
            mountElement(vnode,container)
        }else if(isObject(vnode.type)){
            processComponent(vnode,container)
        } */
    }

    function processText(vnode,container:any){
        const {children}=vnode
        const textVNode=(vnode.el=document.createTextNode(children))
        container.append(textVNode)
    }

    function processFragment(vnode,container:any,parentComponent){
        mountChildren(vnode,container,parentComponent)
    }

    function processElement(vnode,container:any,parentComponent){
        mountElement(vnode,container,parentComponent)
    }

    function mountElement(vnode,container:any,parentComponent){
        // vnode -> element -> div
        // const el=(vnode.el=document.createElement(vnode.type))
        const el=(vnode.el=hostCreateElement(vnode.type))

        // children -> string || array
        const {children,shapeFlags}=vnode
        if(ShapeFlags.TEXT_CHILDREN & shapeFlags){
            el.textContent=children
        }else if(ShapeFlags.ARRAY_CHILDREN & shapeFlags){
            mountChildren(vnode,el,parentComponent)
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
            hostPatchProp(el,key,val)
        }

        hostInsert(el,container)
    }

    function mountChildren(vnode,container,parentComponent){
        vnode.children.forEach((v)=>{
            patch(v,container,parentComponent)
        })
    }

    function processComponent(vnode,container:any,parentComponent){
        mountComponent(vnode,container,parentComponent)// 挂载组件
    }

    function mountComponent(instanceVNode,container:any,parentComponent){
        const instance=createComponentInstance(instanceVNode,parentComponent)// 抽离组件对象 并 创建组件实例 
        setupComponent(instance)
        setupRenderEffect(instanceVNode,instance,container)
    }

    function setupRenderEffect(instanceVNode,instance,container:any){
        const {proxy}=instance
        // 调用render()返回vnode -> patch()
        const subTree=instance.render.call(proxy)
        patch(subTree,container,instance)
        // element -> mount
        instanceVNode.el=subTree.el
    }
    return {
        createApp:createAppApi(render)
    }
}